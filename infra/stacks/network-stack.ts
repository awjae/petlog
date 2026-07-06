import { Construct } from 'constructs';
import { TerraformStack, TerraformVariable, TerraformOutput, S3Backend, Fn } from 'cdktf';

import { AwsProvider } from '../.gen/providers/aws/provider';
import { Vpc } from '../.gen/providers/aws/vpc';
import { Subnet } from '../.gen/providers/aws/subnet';
import { SecurityGroup } from '../.gen/providers/aws/security-group';
import { InternetGateway } from '../.gen/providers/aws/internet-gateway';
import { RouteTable } from '../.gen/providers/aws/route-table';
import { Route } from '../.gen/providers/aws/route';
import { RouteTableAssociation } from '../.gen/providers/aws/route-table-association';
import { DataAwsAvailabilityZones } from '../.gen/providers/aws/data-aws-availability-zones';
import { DataAwsEc2ManagedPrefixList } from '../.gen/providers/aws/data-aws-ec2-managed-prefix-list';

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
 * RDS + ECS Fargate(ALB 포함)를 위한 네트워크 스택.
 *
 * ## App Runner에서 ECS Fargate로 전환하며 바뀐 것 (오늘 세션)
 * App Runner는 서울 리전(ap-northeast-2)을 지원하지 않는다는 사실을 DNS/CLI로 직접 확인해
 * ECS Fargate + ALB로 전환했다. ALB는 반드시 최소 2개 AZ의 **public** 서브넷에 있어야 하므로,
 * 기존에 없던 public 서브넷 2개 + Internet Gateway + 라우트 테이블을 이번에 추가했다.
 *
 * ## 여전히 의도적으로 하지 않는 것 (개인 프로젝트 비용 가드레일)
 * - **NAT Gateway는 만들지 않는다.** 시간당 고정비(~$0.045/시간, 월 $30+)가 발생하는 리소스다.
 *   ECS Fargate 태스크를 private 서브넷 대신 이 public 서브넷에 두고 `assignPublicIp: ENABLED`로
 *   설정해 NAT 없이도 아웃바운드 인터넷(ECR pull, SSM, Secrets Manager, S3 API 호출)에 직접
 *   접근하게 한다. 인바운드는 보안그룹으로 ALB에서만 열어두므로("public 서브넷 + 보안그룹으로
 *   인바운드 통제"), 기존에 이 프로젝트가 RDS/네트워크에 대해 취해온 비용 최소화 원칙과
 *   구조적으로 동일하다.
 * - RDS가 있는 기존 private 서브넷 2개는 그대로 둔다. RDS의 DbSubnetGroup이 이미 이 서브넷들을
 *   참조하고 있으므로 손대지 않는다(재생성 위험 회피).
 *
 * ## AZ를 하드코딩하지 않는 이유
 * AWS 계정/리전마다 사용 가능한 AZ 집합이 다를 수 있어(계정별 AZ ID 매핑, 일부 AZ 접근 제한 등),
 * `DataAwsAvailabilityZones`로 배포 시점에 동적으로 조회한 뒤 앞 2개를 선택한다. Public 서브넷도
 * 같은 AZ 2개를 재사용해 private 서브넷과 짝을 맞춘다.
 */
export class NetworkStack extends TerraformStack {
  public readonly vpc: Vpc;
  public readonly privateSubnets: [Subnet, Subnet];
  public readonly publicSubnets: [Subnet, Subnet];
  public readonly rdsSecurityGroup: SecurityGroup;
  public readonly albSecurityGroup: SecurityGroup;
  public readonly ecsTaskSecurityGroup: SecurityGroup;

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

    // --- Public 서브넷 2개 (ALB + ECS Fargate 태스크 전용, 오늘 신규 추가) ---
    // NAT Gateway 없이 아웃바운드 인터넷을 확보하기 위해 ECS 태스크를 이 서브넷에 두고
    // assignPublicIp: ENABLED로 설정한다 (backend-stack 참고). private 서브넷(10.0.1.0/24,
    // 10.0.2.0/24)과 겹치지 않는 CIDR을 사용한다.
    const publicSubnetA = new Subnet(this, 'public-subnet-a', {
      vpcId: vpc.id,
      cidrBlock: '10.0.11.0/24',
      availabilityZone: Fn.element(availableAzs.names, 0),
      mapPublicIpOnLaunch: true,
      tags: { Name: `petlog-public-subnet-a-${environment}` },
    });

    const publicSubnetB = new Subnet(this, 'public-subnet-b', {
      vpcId: vpc.id,
      cidrBlock: '10.0.12.0/24',
      availabilityZone: Fn.element(availableAzs.names, 1),
      mapPublicIpOnLaunch: true,
      tags: { Name: `petlog-public-subnet-b-${environment}` },
    });

    this.publicSubnets = [publicSubnetA, publicSubnetB];

    // --- Internet Gateway (public 서브넷 전용) ---
    // NAT Gateway(시간당 고정비)는 여전히 만들지 않는다. IGW 자체는 무료이며, public 서브넷의
    // 아웃바운드/인바운드 인터넷 경로로만 쓰인다.
    const internetGateway = new InternetGateway(this, 'igw', {
      vpcId: vpc.id,
      tags: { Name: `petlog-igw-${environment}` },
    });

    // --- Public 라우트 테이블 (0.0.0.0/0 → IGW) ---
    // route를 RouteTable 리소스의 인라인 `route` 블록 대신 별도 `Route` 리소스로 분리한다.
    // (1) 최신 aws provider(6.x)의 인라인 route 블록은 스키마상 모든 대체 대상 필드
    //     (odb_network_arn 등)를 항상 요구하는 경우가 있어 타입 정의(optional)와 실제
    //     provider 동작이 어긋날 수 있고, (2) Terraform 공식 문서도 라우트 테이블과 라우트를
    //     분리 관리하는 것을 권장한다(다른 도구가 라우트를 추가해도 충돌하지 않음).
    const publicRouteTable = new RouteTable(this, 'public-route-table', {
      vpcId: vpc.id,
      tags: { Name: `petlog-public-rt-${environment}` },
    });

    new Route(this, 'public-route-to-igw', {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: internetGateway.id,
    });

    new RouteTableAssociation(this, 'public-subnet-a-rt-association', {
      subnetId: publicSubnetA.id,
      routeTableId: publicRouteTable.id,
    });

    new RouteTableAssociation(this, 'public-subnet-b-rt-association', {
      subnetId: publicSubnetB.id,
      routeTableId: publicRouteTable.id,
    });

    // --- CloudFront 오리진 전용 관리형 프리픽스 리스트 ---
    // ALB 앞에 CloudFront(HTTPS 종단)를 추가하면서, ALB가 CloudFront 엣지에서 나가는 트래픽만
    // 받도록 좁힌다. `com.amazonaws.global.cloudfront.origin-facing`은 AWS가 관리하는 프리픽스
    // 리스트로, CloudFront가 오리진(ALB)에 접속할 때 사용하는 IP 대역 전체를 담고 있다. 이
    // 리스트를 소스로 쓰면 사용자가 CloudFront/HTTPS를 우회해 ALB에 평문 HTTP로 직접 접근하는
    // 경로를 막을 수 있다 (`.claude/docs/decisions/020-cloudfront-https.md` 참고).
    const cloudfrontOriginFacingPrefixList = new DataAwsEc2ManagedPrefixList(
      this,
      'cloudfront-origin-facing-prefix-list',
      {
        name: 'com.amazonaws.global.cloudfront.origin-facing',
      },
    );

    // --- ALB 보안그룹 ---
    // 인바운드 HTTP(80)는 CloudFront 엣지에서 오는 트래픽만 허용한다 (0.0.0.0/0 아님).
    // 커스텀 도메인/ACM 인증서가 없어 ALB 자체에는 HTTPS 리스너를 두지 않으므로, HTTPS는
    // CloudFront가 대신 종단한다 (backend-stack.ts의 CloudFront 배포 참고). CloudFront→ALB
    // 구간은 AWS 내부망이라 HTTP 평문이어도 실사용자에게 노출되지 않는다.
    //
    // 주의: 이 SecurityGroup의 최상위 `description` 필드는 절대 바꾸지 않는다. rds-sg와 동일한
    // 이유(아래 rds-sg 주석 참고) — AWS EC2 SecurityGroup의 GroupDescription은 불변(ForceNew)
    // 속성이라, 값을 바꾸면 Terraform이 이 보안그룹 자체를 삭제 후 재생성하려 든다. 이미 배포된
    // ALB/ECS 태스크 보안그룹이 이 SG ID를 참조하고 있어(alb.securityGroups,
    // ecs-task-sg의 ingress.securityGroups), 실제로 `cdktf diff`에서 재생성(destroy and
    // create replacement) 플랜이 나오는 것을 확인했다. 그래서 텍스트가 더 이상 100% 정확하지
    // 않더라도("from the internet") 최상위 description은 그대로 두고, 실제로 바뀌는 소스 제한은
    // 아래 `ingress` 블록(제자리 업데이트, 무중단)에서만 반영한다.
    const albSecurityGroup = new SecurityGroup(this, 'alb-sg', {
      name: `petlog-alb-sg-${environment}`,
      // AWS EC2 SecurityGroup의 description은 ASCII만 허용한다 (한글 등 non-ASCII 사용 시
      // "Character sets beyond ASCII are not supported" 에러가 난다). 영문으로 작성한다.
      description: 'Security group for the shared ALB (inbound HTTP 80 from the internet)',
      vpcId: vpc.id,
      ingress: [
        {
          description: 'Allow HTTP (80) from CloudFront origin-facing IP ranges only',
          fromPort: 80,
          toPort: 80,
          protocol: 'tcp',
          prefixListIds: [cloudfrontOriginFacingPrefixList.id],
        },
      ],
      // egress를 명시하지 않으면 Terraform이 아웃바운드를 전부 막아버린다(ecs-task-sg와
      // 동일한 이유). ALB가 백엔드/프론트엔드 컨테이너로 트래픽을 전달하려면 아웃바운드가
      // 필요하다. ecs-task-sg가 이 alb-sg를 소스로 참조하며 뒤에 정의되므로(순방향 참조
      // 문제 회피), 여기서는 범위를 좁히지 않고 전체 허용으로 단순화한다.
      egress: [
        {
          description: 'Allow all outbound (to ECS tasks on container ports)',
          fromPort: 0,
          toPort: 0,
          protocol: '-1',
          cidrBlocks: ['0.0.0.0/0'],
        },
      ],
      tags: { Name: `petlog-alb-sg-${environment}` },
    });
    this.albSecurityGroup = albSecurityGroup;

    // --- ECS 태스크 보안그룹 (기존 App Runner Connector 보안그룹 대체) ---
    // 인바운드는 오직 ALB 보안그룹에서 오는 트래픽만, 그것도 컨테이너 포트(backend 4000,
    // frontend 3000)로만 허용한다. 태스크가 public 서브넷의 public IP를 가지더라도, 이
    // 보안그룹이 ALB 외의 인바운드를 전부 차단하므로 사실상 "public 서브넷에 있지만
    // 인바운드는 ALB로만 제한"되는 구조가 된다.
    const ecsTaskSecurityGroup = new SecurityGroup(this, 'ecs-task-sg', {
      name: `petlog-ecs-task-sg-${environment}`,
      description: 'Security group for ECS Fargate tasks (inbound from ALB only)',
      vpcId: vpc.id,
      ingress: [
        {
          description: 'Allow backend container port (4000) from ALB',
          fromPort: 4000,
          toPort: 4000,
          protocol: 'tcp',
          securityGroups: [albSecurityGroup.id],
        },
        {
          description: 'Allow frontend container port (3000) from ALB',
          fromPort: 3000,
          toPort: 3000,
          protocol: 'tcp',
          securityGroups: [albSecurityGroup.id],
        },
      ],
      // 주의: Terraform의 aws_security_group은 AWS 콘솔과 달리 egress를 명시하지 않으면
      // "전체 아웃바운드 허용" 기본값을 만들어주지 않는다 — 오히려 아웃바운드가 전부 막힌
      // 보안그룹이 된다. 이 태스크는 ECR(이미지 pull), SSM/Secrets Manager(시크릿 조회),
      // RDS(5432) 등 인터넷/VPC 내부로 아웃바운드가 반드시 필요하므로 전체 허용을 명시한다
      // (NAT Gateway 없이 public 서브넷 + 퍼블릭 IP로 직접 인터넷에 나가는 구조이므로,
      // 인바운드는 위 ingress로 이미 ALB에서만 오도록 제한되어 있다 — 아웃바운드 전체 허용이
      // 실제 보안 경계를 약화시키지 않는다).
      egress: [
        {
          description: 'Allow all outbound (ECR, SSM, Secrets Manager, RDS, S3 etc.)',
          fromPort: 0,
          toPort: 0,
          protocol: '-1',
          cidrBlocks: ['0.0.0.0/0'],
        },
      ],
      tags: { Name: `petlog-ecs-task-sg-${environment}` },
    });
    this.ecsTaskSecurityGroup = ecsTaskSecurityGroup;

    // --- RDS 보안그룹 ---
    // 인바운드 5432는 오직 ECS 태스크 보안그룹에서 오는 트래픽만 허용한다 (기존에는 App Runner
    // Connector 보안그룹을 소스로 했으나, 컴퓨트가 ECS Fargate로 바뀌면서 소스만 교체한다 —
    // RDS 인스턴스 자체는 건드리지 않으므로 다운타임 없는 변경이다).
    //
    // 주의: 이 SecurityGroup의 **최상위 `description` 필드는 절대 바꾸지 않는다.** AWS EC2
    // SecurityGroup의 GroupDescription은 불변(ForceNew) 속성이라, 값을 바꾸면 Terraform이
    // 이 보안그룹 자체를 삭제 후 재생성하려 든다 — 그런데 이 보안그룹은 이미 RDS 인스턴스의
    // ENI에 연결되어 있어(destroy 시점에 아직 database-stack이 새 SG ID를 모름), AWS가
    // "DependencyViolation"으로 삭제를 거부해 배포가 실패할 수 있다. 그래서 텍스트가 더 이상
    // 100% 정확하지 않더라도(App Runner Connector 언급) 최상위 description은 그대로 두고,
    // 실제로 바뀌는 소스는 아래 `ingress` 블록(제자리 업데이트, 무중단)에서만 반영한다.
    const rdsSecurityGroup = new SecurityGroup(this, 'rds-sg', {
      name: `petlog-rds-sg-${environment}`,
      // 이 필드도 AWS EC2 API의 GroupDescription이라 ASCII만 허용된다 (ingress의 description도 동일).
      description:
        'Security group for RDS PostgreSQL (allows 5432 only from App Runner VPC Connector)',
      vpcId: vpc.id,
      ingress: [
        {
          description: 'Allow PostgreSQL (5432) from ECS Fargate tasks',
          fromPort: 5432,
          toPort: 5432,
          protocol: 'tcp',
          securityGroups: [ecsTaskSecurityGroup.id],
        },
      ],
      tags: { Name: `petlog-rds-sg-${environment}` },
    });
    this.rdsSecurityGroup = rdsSecurityGroup;

    // --- Outputs ---
    new TerraformOutput(this, 'vpc_id', {
      value: vpc.id,
      description: 'RDS/ECS Fargate가 속한 VPC ID',
    });

    new TerraformOutput(this, 'private_subnet_ids', {
      value: [privateSubnetA.id, privateSubnetB.id],
      description: 'DbSubnetGroup이 참조하는 private 서브넷 ID 2개',
    });

    new TerraformOutput(this, 'public_subnet_ids', {
      value: [publicSubnetA.id, publicSubnetB.id],
      description: 'ALB/ECS Fargate 태스크가 참조하는 public 서브넷 ID 2개',
    });

    new TerraformOutput(this, 'rds_security_group_id', {
      value: rdsSecurityGroup.id,
      description: 'RDS DbInstance의 vpcSecurityGroupIds가 참조하는 보안그룹 ID',
    });

    new TerraformOutput(this, 'alb_security_group_id', {
      value: albSecurityGroup.id,
      description: 'ALB의 securityGroups가 참조하는 보안그룹 ID',
    });

    new TerraformOutput(this, 'ecs_task_security_group_id', {
      value: ecsTaskSecurityGroup.id,
      description:
        'ECS 태스크(backend/frontend)의 networkConfiguration.securityGroups가 참조하는 보안그룹 ID',
    });
  }
}
