import { Construct } from 'constructs';
import { TerraformStack, TerraformVariable, TerraformOutput, S3Backend } from 'cdktf';

import { AwsProvider } from '../.gen/providers/aws/provider';
import { DataAwsIamPolicyDocument } from '../.gen/providers/aws/data-aws-iam-policy-document';
import { IamRole } from '../.gen/providers/aws/iam-role';
import { IamRolePolicyAttachment } from '../.gen/providers/aws/iam-role-policy-attachment';
import { IamInstanceProfile } from '../.gen/providers/aws/iam-instance-profile';
import { DataAwsSsmParameter } from '../.gen/providers/aws/data-aws-ssm-parameter';
import { Instance } from '../.gen/providers/aws/instance';

import {
  DEFAULT_AWS_REGION,
  TERRAFORM_LOCK_TABLE,
  TERRAFORM_STATE_BUCKET,
  Environment,
} from '../config';
import { NetworkStack } from './network-stack';

export interface BastionStackProps {
  /** 배포 대상 환경. 인스턴스/역할 네이밍에 사용한다. */
  readonly environment: Environment;
  /** public 서브넷과 bastion 보안그룹 cross-stack reference를 위해 network-stack을 그대로 받는다. */
  readonly networkStack: NetworkStack;
}

/**
 * RDS(private, publiclyAccessible: false)에 IAM 기반으로 접근하기 위한 SSM Session Manager
 * 전용 bastion EC2 스택.
 *
 * ## 왜 IP 화이트리스트(RDS publiclyAccessible + SG에 내 IP 등록) 대신 이 구조인가
 * IP 방식은 "혼자, 한 네트워크에서" 잠깐 확인하는 용도로는 비용이 0원이라 가장 싸지만,
 * 협업에는 근본적으로 안 맞는다 — 팀원마다 IP가 다르고 수시로 바뀌며(유동 IP), 누가 언제
 * 접속했는지 감사 로그도 안 남는다. 이 스택은 접근 통제를 네트워크 위치(IP)가 아니라
 * IAM(`ssm:StartSession`)으로 옮긴다: 팀원 추가/제거는 IAM 정책만 바꾸면 되고, RDS는
 * 여전히 인터넷에 전혀 노출되지 않는다(SG에 인바운드 규칙 없음 — `network-stack.ts`의
 * `bastionSecurityGroup` 참고).
 *
 * ## 비용 모델: "배포는 한 번, 평소엔 정지"
 * 이 스택 자체(EC2 리소스 정의)는 한 번만 `cdktf deploy`한다. 실사용 시점의 과금을 없애려면
 * Terraform이 아니라 `scripts/db-tunnel.sh`로 인스턴스를 그때그때 start/stop한다 — Client VPN
 * Endpoint(연결 여부와 무관하게 association 자체가 시간당 과금)와 달리, EC2는 정지 상태에서는
 * 컴퓨트 요금이 전혀 없고 EBS 볼륨(8GB gp3, 월 몇백 원) 비용만 남는다. `cdktf deploy`를
 * 재실행해도 Terraform이 실행 중인 인스턴스를 강제로 재시작/재생성하지 않으므로, 이 스택을
 * 다시 배포하는 것과 인스턴스의 실행/정지 상태는 서로 독립적이다.
 *
 * ## NAT Gateway 없이 SSM이 동작하는 이유
 * `network-stack.ts`가 이미 확립한 원칙(ECS Fargate 태스크와 동일)을 그대로 따른다: 이 인스턴스를
 * public 서브넷에 두고 퍼블릭 IP를 직접 받게 해서, NAT Gateway 없이도 SSM 서비스 엔드포인트로
 * 아웃바운드 HTTPS 접속이 가능하게 한다. 인바운드는 `bastionSecurityGroup`에 규칙이 전혀 없어
 * 사실상 전부 차단이다.
 */
export class BastionStack extends TerraformStack {
  public readonly instance: Instance;
  public readonly role: IamRole;

  constructor(scope: Construct, id: string, props: BastionStackProps) {
    super(scope, id);

    const { environment, networkStack } = props;

    new S3Backend(this, {
      bucket: TERRAFORM_STATE_BUCKET,
      key: `bastion-stack/${environment}/terraform.tfstate`,
      region: DEFAULT_AWS_REGION,
      dynamodbTable: TERRAFORM_LOCK_TABLE,
      encrypt: true,
    });

    const awsRegion = new TerraformVariable(this, 'aws_region', {
      type: 'string',
      default: DEFAULT_AWS_REGION,
      description: 'Bastion 인스턴스를 배포할 AWS 리전 (기본값: 서울)',
    });

    new AwsProvider(this, 'aws', {
      region: awsRegion.stringValue,
      defaultTags: [
        {
          tags: {
            Project: 'petlog',
            Environment: environment,
            ManagedBy: 'cdktf',
          },
        },
      ],
    });

    // --- IAM Role (SSM 에이전트가 인스턴스를 관리 대상으로 등록하는 데 필요) ---
    const assumeRolePolicy = new DataAwsIamPolicyDocument(this, 'bastion-assume-role-policy', {
      statement: [
        {
          effect: 'Allow',
          actions: ['sts:AssumeRole'],
          principals: [{ type: 'Service', identifiers: ['ec2.amazonaws.com'] }],
        },
      ],
    });

    const role = new IamRole(this, 'bastion-role', {
      name: `petlog-bastion-role-${environment}`,
      assumeRolePolicy: assumeRolePolicy.json,
    });
    this.role = role;

    // AWS 관리형 정책. SSM 에이전트 등록 + Session Manager 세션 수신에 필요한 권한 전부를 포함한다.
    new IamRolePolicyAttachment(this, 'bastion-ssm-policy-attachment', {
      role: role.name,
      policyArn: 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore',
    });

    const instanceProfile = new IamInstanceProfile(this, 'bastion-instance-profile', {
      name: `petlog-bastion-profile-${environment}`,
      role: role.name,
    });

    // --- AMI (Amazon Linux 2023, arm64 — t4g 계열과 짝을 맞춘 Graviton) ---
    // AWS가 관리하는 SSM Public Parameter로 리전별 최신 AMI ID를 배포 시점에 동적으로 조회한다
    // (하드코딩된 AMI ID는 리전이 바뀌거나 AMI가 deprecate되면 깨진다).
    const al2023Arm64Ami = new DataAwsSsmParameter(this, 'al2023-arm64-ami', {
      name: '/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-arm64',
    });

    // --- EC2 인스턴스 ---
    const instance = new Instance(this, 'bastion-instance', {
      ami: al2023Arm64Ami.value,
      // 이 AWS 계정은 Free Tier 대상 인스턴스 타입만 허용하도록 제한되어 있다(RunInstances가
      // InvalidParameterCombination으로 거부). `aws ec2 describe-instance-types
      // --filters Name=free-tier-eligible,Values=true`로 확인한 결과 t4g 계열은 `.nano`가
      // 아니라 `.micro` 사이즈만 Free Tier 대상이라 이 크기를 쓴다.
      instanceType: 't4g.micro',
      subnetId: networkStack.publicSubnets[0].id,
      vpcSecurityGroupIds: [networkStack.bastionSecurityGroup.id],
      iamInstanceProfile: instanceProfile.name,
      // NAT 없이 SSM/RDS로 아웃바운드하려면 퍼블릭 IP가 필요하다 (ecs-task-sg와 동일한 이유).
      associatePublicIpAddress: true,
      rootBlockDevice: {
        volumeSize: 8,
        volumeType: 'gp3',
      },
      tags: { Name: `petlog-bastion-${environment}` },
    });
    this.instance = instance;

    // --- Outputs ---
    new TerraformOutput(this, 'bastion_instance_id', {
      value: instance.id,
      description:
        'scripts/db-tunnel.sh 및 팀원의 IAM 정책(ssm:StartSession 리소스 범위)이 참조하는 인스턴스 ID',
    });

    new TerraformOutput(this, 'bastion_role_arn', {
      value: role.arn,
      description: 'Bastion EC2가 assume하는 IAM Role ARN (참고용)',
    });
  }
}
