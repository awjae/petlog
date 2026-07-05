/**
 * infra 전역에서 공유하는 상수 설정.
 *
 * 스택 파일에서 개별적으로 상수를 흩어 정의하지 않고 이 파일을 단일 출처로 사용한다.
 */

/** 기본 AWS 리전 (서울). 스택 내부에서 TerraformVariable 기본값으로 사용한다. */
export const DEFAULT_AWS_REGION = 'ap-northeast-2';

/**
 * Terraform remote state를 저장할 S3 버킷 이름.
 *
 * AWS 계정 ID(095256592046)를 접미사로 붙여 전 세계 유일성을 확보했다.
 *
 * 이 버킷은 CDKTF 스택이 관리하지 않는다 — infra/README.md의 "부트스트랩" 절차에 따라
 * `aws` CLI로 수동 생성한다. CDKTF 스택이 자기 자신의 state를 저장할 버킷을 스스로
 * 만들려고 하면 닭이 먼저냐 달걀이 먼저냐 문제(순환 의존)가 생기기 때문이다.
 */
export const TERRAFORM_STATE_BUCKET = 'petlog-terraform-state-095256592046';

/**
 * Terraform state 잠금(lock)을 위한 DynamoDB 테이블 이름.
 * TERRAFORM_STATE_BUCKET과 마찬가지로 부트스트랩 단계에서 수동 생성한다.
 */
export const TERRAFORM_LOCK_TABLE = 'petlog-terraform-locks';

/** 배포 대상 환경. 스택 네이밍(`petlog-uploads-{env}` 등)에 쓰이므로 synth 시점에 고정된다. */
export type Environment = 'dev' | 'prod';

/** PETLOG_ENV 환경변수로 배포 대상 환경을 제어하며 기본값은 dev. */
export function getEnvironment(): Environment {
  const env = process.env.PETLOG_ENV ?? 'dev';
  if (env !== 'dev' && env !== 'prod') {
    throw new Error(`PETLOG_ENV는 "dev" 또는 "prod"만 허용됩니다. 입력값: ${env}`);
  }
  return env;
}
