import { Construct } from 'constructs';
import { TerraformStack, TerraformVariable, TerraformOutput, S3Backend, Fn } from 'cdktf';

import { AwsProvider } from '../.gen/providers/aws/provider';
import { Vpc } from '../.gen/providers/aws/vpc';
import { Subnet } from '../.gen/providers/aws/subnet';
import { SecurityGroup } from '../.gen/providers/aws/security-group';
import { DataAwsAvailabilityZones } from '../.gen/providers/aws/data-aws-availability-zones';

import {
  DEFAULT_AWS_REGION,
  TERRAFORM_LOCK_TABLE,
  TERRAFORM_STATE_BUCKET,
  Environment,
} from '../config';

export interface NetworkStackProps {
  /** 배포 대상 환경. VPC/서브넷/보안그룹 네이밍에 사용한다. */
  readonly environment: Environment;
}

/**
 * RDS + App Runner VPC Connector를 위한 최소 네트워크 스택.
 *
 * ## 의도적으로 하지 않는 것 (개인 프로젝트 비용 가드레일)
 * - **Public 서브넷을 만들지 않는다.** RDS는 `publiclyAccessible: false`로만 쓰고, App Runner
 *   VPC Connector도 "RDS에 도달"하는 용도일 뿐 인터넷 접근이 필요 없다.
 * - **NAT Gateway를 만들지 않는다.** 시간당 고정비(~$0.045/시간, 월 $30+)가 발생하는 리소스이며,
 *   이 스택의 리소스(RDS, VPC Connector) 중 아웃바운드 인터넷이 필요한 것이 없다.
 * - **Internet Gateway도 만들지 않는다.** Public 서브넷이 없으므로 필요 없다.
 * - 그 결과 이 VPC의 서브넷들은 완전히 격리된 private 네트워크이고, RDS와 App Runner
 *   VPC Connector만 그 안에서 서로 통신한다.
 *
 * ## AZ를 하드코딩하지 않는 이유
 * AWS 계정/리전마다 사용 가능한 AZ 집합이 다를 수 있어(계정별 AZ ID 매핑, 일부 AZ 접근 제한 등),
 * `DataAwsAvailabilityZones`로 배포 시점에 동적으로 조회한 뒤 앞 2개를 선택한다.
 */
export class NetworkStack extends TerraformStack {
  public readonly vpc: Vpc;
  public readonly privateSubnets: [Subnet, Subnet];
  public readonly rdsSecurityGroup: SecurityGroup;
  public readonly apprunnerConnectorSecurityGroup: SecurityGroup;

  constructor(scope: Construct, id: string, props: NetworkStackProps) {
    super(scope, id);

    const { environment } = props;

    new S3Backend(this, {
      bucket: TERRAFORM_STATE_BUCKET,
      key: `network-stack/${environment}/terraform.tfstate`,
      region: DEFAULT_AWS_REGION,
      dynamodbTable: TERRAFORM_LOCK_TABLE,
      encrypt: true,
    });

    const awsRegion = new TerraformVariable(this, 'aws_region', {
      type: 'string',
      default: DEFAULT_AWS_REGION,
      description: 'VPC/서브넷을 배포할 AWS 리전 (기본값: 서울)',
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

    // --- VPC ---
    const vpc = new Vpc(this, 'vpc', {
      cidrBlock: '10.0.0.0/16',
      enableDnsSupport: true,
      enableDnsHostnames: true,
      tags: { Name: `petlog-vpc-${environment}` },
    });
    this.vpc = vpc;

    // --- 사용 가능한 AZ 동적 조회 ---
    const availableAzs = new DataAwsAvailabilityZones(this, 'available-azs', {
      state: 'available',
    });

    // --- Private 서브넷 2개 (서로 다른 AZ) ---
    // Public 서브넷은 만들지 않는다 (RDS/VPC Connector 모두 인터넷 접근 불필요).
    const privateSubnetA = new Subnet(this, 'private-subnet-a', {
      vpcId: vpc.id,
      cidrBlock: '10.0.1.0/24',
      availabilityZone: Fn.element(availableAzs.names, 0),
      mapPublicIpOnLaunch: false,
      tags: { Name: `petlog-private-subnet-a-${environment}` },
    });

    const privateSubnetB = new Subnet(this, 'private-subnet-b', {
      vpcId: vpc.id,
      cidrBlock: '10.0.2.0/24',
      availabilityZone: Fn.element(availableAzs.names, 1),
      mapPublicIpOnLaunch: false,
      tags: { Name: `petlog-private-subnet-b-${environment}` },
    });

    this.privateSubnets = [privateSubnetA, privateSubnetB];

    // --- App Runner VPC Connector용 보안그룹 ---
    // 이 보안그룹 자체는 인바운드 규칙이 없다 (아웃바운드로 RDS의 5432에 접속하는 쪽이므로
    // 기본 egress `허용 전체`만 있으면 충분하다 — SecurityGroup은 egress를 지정하지 않으면
    // AWS 기본값(all outbound 허용)을 그대로 쓴다).
    const apprunnerConnectorSecurityGroup = new SecurityGroup(this, 'apprunner-connector-sg', {
      name: `petlog-apprunner-connector-sg-${environment}`,
      description: 'App Runner VPC Connector 전용 보안그룹 (RDS 접근용 아웃바운드만 사용)',
      vpcId: vpc.id,
      tags: { Name: `petlog-apprunner-connector-sg-${environment}` },
    });
    this.apprunnerConnectorSecurityGroup = apprunnerConnectorSecurityGroup;

    // --- RDS 보안그룹 ---
    // 인바운드 5432는 오직 App Runner Connector 보안그룹에서 오는 트래픽만 허용한다.
    // ingress 블록의 `securityGroups` 참조를 사용하면 순환 참조 없이 "이 보안그룹을 단 리소스만
    // 허용"하는 규칙을 만들 수 있다 (Connector SG는 RDS SG를 참조하지 않으므로 단방향).
    const rdsSecurityGroup = new SecurityGroup(this, 'rds-sg', {
      name: `petlog-rds-sg-${environment}`,
      description: 'RDS PostgreSQL 전용 보안그룹 (App Runner VPC Connector에서만 5432 허용)',
      vpcId: vpc.id,
      ingress: [
        {
          description: 'App Runner VPC Connector에서 PostgreSQL(5432) 접근 허용',
          fromPort: 5432,
          toPort: 5432,
          protocol: 'tcp',
          securityGroups: [apprunnerConnectorSecurityGroup.id],
        },
      ],
      tags: { Name: `petlog-rds-sg-${environment}` },
    });
    this.rdsSecurityGroup = rdsSecurityGroup;

    // --- Outputs ---
    new TerraformOutput(this, 'vpc_id', {
      value: vpc.id,
      description: 'RDS/App Runner VPC Connector가 속한 VPC ID',
    });

    new TerraformOutput(this, 'private_subnet_ids', {
      value: [privateSubnetA.id, privateSubnetB.id],
      description: 'DbSubnetGroup/ApprunnerVpcConnector가 참조하는 private 서브넷 ID 2개',
    });

    new TerraformOutput(this, 'rds_security_group_id', {
      value: rdsSecurityGroup.id,
      description: 'RDS DbInstance의 vpcSecurityGroupIds가 참조하는 보안그룹 ID',
    });

    new TerraformOutput(this, 'apprunner_connector_security_group_id', {
      value: apprunnerConnectorSecurityGroup.id,
      description: 'ApprunnerVpcConnector의 securityGroups가 참조하는 보안그룹 ID',
    });
  }
}
