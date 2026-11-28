// 요청은 CloudFront → ALB → 태스크 순서로 들어오므로 신뢰할 hop은 2개다. ALB 보안 그룹이
// CloudFront origin-facing 프리픽스만 받아(infra/stacks/network-stack.ts) ALB 직접 접속은 막히고,
// 클라이언트가 미리 넣은 X-Forwarded-For는 CloudFront가 덧붙인 IP 앞에 남아 무시된다.
// 단 이 프리픽스는 우리 배포 전용이 아니다. 남의 CloudFront 배포를 거친 요청까지 막지는 못하므로
// req.ip를 위조 불가능한 값으로 취급하지 않는다(막으려면 비밀 origin 헤더 검사가 필요하다).
// 1로 두면 req.ip가 ALB가 덧붙인 CloudFront 엣지 IP가 되어, 같은 엣지를 쓰는 사용자들이
// 시도 제한 횟수를 나눠 쓰고 동의 증적에도 엣지 IP가 남는다. 2여야 사용자 IP가 된다.
export const TRUST_PROXY_HOPS = 2;
