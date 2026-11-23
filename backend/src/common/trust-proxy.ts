// 요청은 항상 CloudFront → ALB → 태스크 순서로 들어온다. ALB 보안 그룹이 CloudFront
// origin-facing 프리픽스만 받으므로(infra/stacks/network-stack.ts) 이 두 hop은 위조할 수 없다.
// 1로 두면 req.ip가 ALB가 덧붙인 CloudFront 엣지 IP가 되어, 같은 엣지를 쓰는 사용자들이
// 시도 제한 횟수를 나눠 쓰고 동의 증적에도 엣지 IP가 남는다. 2여야 사용자 IP가 된다.
export const TRUST_PROXY_HOPS = 2;
