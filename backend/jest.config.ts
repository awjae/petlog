import type { Config } from 'jest';

// 테스트는 배포 환경과 같은 TZ=UTC로 돌린다.
//
// 결정 문서: .claude/docs/decisions/033-service-timezone.md
//
// 이걸 고정하지 않으면 일자 경계 버그가 개발 머신에서 잡히지 않는다. `setHours(0,0,0,0)`
// 같은 코드는 프로세스 TZ를 따르므로, Asia/Seoul 머신에서는 "서울 기준 오늘"이 우연히
// 맞게 나온다. countTodayRecords 버그가 오래 살아남은 이유가 정확히 이것이다 —
// 로컬에서는 정상이고 UTC 컨테이너에서만 틀렸다.
//
// 실제로 확인했다: 버그 버전을 pet.service.spec.ts로 돌리면 KST에서는 4개 모두 통과하고
// TZ=UTC에서는 3개가 실패한다.
process.env.TZ = 'UTC';

const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
};

export default config;
