// infra/.env는 AWS_PROFILE 같은 "어떤 자격증명을 쓸지"에 대한 비-시크릿 참조만 담는다.
// 실제 Access Key/Secret Key는 이 파일이 아니라 ~/.aws/credentials(레포 밖)에 있어야 한다.
import 'dotenv/config';
import { App } from 'cdktf';

import { BootstrapStack } from './stacks/bootstrap-stack';
import { RegistryStack } from './stacks/registry-stack';
import { StorageStack } from './stacks/storage-stack';
import { NetworkStack } from './stacks/network-stack';
import { DatabaseStack } from './stacks/database-stack';
import { BastionStack } from './stacks/bastion-stack';
import { BackendStack } from './stacks/backend-stack';
import { FrontendStack } from './stacks/frontend-stack';
import { getEnvironment } from './config';

const app = new App();

const environment = getEnvironment();

// petlog-bootstrap은 최초 1회만 배포하는 특수 스택이다 (로컬 state, remote state
// 저장소 자체를 만드는 스택이라 순환 의존을 피하려고 의도적으로 분리했다).
// `cdktf deploy petlog-bootstrap`으로 스택 이름을 지정해 이것만 단독 배포한다.
new BootstrapStack(app, 'petlog-bootstrap');

// 스택은 도메인 단위로 분리하고, 스택 간 의존은 인스턴스를 props로 전달해 cross-stack
// reference(output 참조)로만 연결한다 (하나의 스택 실패가 다른 스택에 영향을 주지 않도록).
//
// 생성 순서가 곧 의존 순서다:
//   (registry-stack, storage-stack, network-stack — 서로 독립) →
//   database-stack (network 참조) →
//   backend-stack (storage + registry + network + database 참조, ECS 클러스터 + 공유 ALB 생성) →
//   frontend-stack (registry + network + backend 참조, 공유 ALB의 frontend 타겟 그룹에 등록)
const registryStack = new RegistryStack(app, `petlog-registry-${environment}`, { environment });

const storageStack = new StorageStack(app, `petlog-storage-${environment}`, { environment });

const networkStack = new NetworkStack(app, `petlog-network-${environment}`, { environment });

// database-stack은 network-stack의 private 서브넷/보안그룹을 cross-stack reference로
// 읽어야 하므로 반드시 network-stack 다음에 생성한다.
const databaseStack = new DatabaseStack(app, `petlog-database-${environment}`, {
  environment,
  networkStack,
});

// bastion-stack은 network-stack의 public 서브넷/bastion 보안그룹만 참조하므로 database-stack과
// 독립적이다 (RDS 자체를 만들지 않는다 — RDS의 rds-sg가 bastionSecurityGroup을 소스로
// 참조할 뿐). SSM 기반 팀 DB 접근용 EC2로, `scripts/db-tunnel.sh`가 사용한다.
new BastionStack(app, `petlog-bastion-${environment}`, {
  environment,
  networkStack,
});

const backendStack = new BackendStack(app, `petlog-backend-${environment}`, {
  environment,
  storageStack,
  registryStack,
  networkStack,
  databaseStack,
});

// frontend-stack은 backend-stack이 만든 ECS 클러스터/공유 ALB(frontend 타겟 그룹, 리스너)를
// cross-stack reference로 읽어야 하므로 반드시 backend-stack 다음에 생성한다.
new FrontendStack(app, `petlog-frontend-${environment}`, {
  environment,
  registryStack,
  networkStack,
  backendStack,
  storageStack,
});

app.synth();
