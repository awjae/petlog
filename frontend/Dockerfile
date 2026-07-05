# Petlog Frontend (Next.js) — AWS App Runner용 프로덕션 이미지
#
# 이 레포는 npm workspaces 모노레포이므로 빌드 컨텍스트는 반드시 레포 루트다.
#   docker build -f frontend/Dockerfile .
#
# 컨테이너 계약 (infra CDKTF App Runner 스택과 합의됨):
#   - 포트 3000 리슨 (Next.js standalone 서버 기본값)
#   - 헬스체크 경로 /api/health (frontend/src/app/api/health/route.ts)

# ---- 1. deps: 워크스페이스 package.json만으로 의존성 설치 (레이어 캐시 최적화) ----
FROM node:22-alpine AS deps
WORKDIR /app

# frontend는 libs/types, libs/utils, libs/ai, libs/storage, backend, infra
# 어느 워크스페이스도 import하지 않는다(직접 확인 완료: graphql-codegen으로
# 생성한 자체 타입만 사용). npm ci는 root package.json의 workspaces 목록에
# 있어도 package.json이 없는 워크스페이스는 조용히 건너뛰므로, 여기서는
# frontend에 실제로 필요한 워크스페이스만 복사해 설치 범위를 최소화한다
# (설치 패키지 수 1709 → 585개로 감소, 무관한 워크스페이스 변경으로 인한
# 캐시 무효화도 방지).
COPY package.json package-lock.json ./
COPY frontend/package.json ./frontend/package.json

# --ignore-scripts: 루트의 "prepare: husky"는 .git 디렉터리가 필요한데
# .dockerignore로 .git/을 제외했으므로 이미지 빌드 중 실행되면 실패한다.
# frontend 빌드 자체에는 husky가 필요 없으므로 건너뛴다.
RUN npm ci --ignore-scripts

# ---- 2. builder: 전체 소스로 frontend workspace만 빌드 ----
FROM node:22-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_* 값은 next build 시점에 클라이언트 번들/서버 설정에 인라인되므로
# 런타임 환경변수로 주입해도 반영되지 않는다. 반드시 빌드 시점에 ARG로 받는다.
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_USE_MOCK=false
ARG NEXT_PUBLIC_SENTRY_DSN
ARG SENTRY_ORG
ARG SENTRY_PROJECT
ARG SENTRY_AUTH_TOKEN

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_PUBLIC_USE_MOCK=$NEXT_PUBLIC_USE_MOCK \
    NEXT_PUBLIC_SENTRY_DSN=$NEXT_PUBLIC_SENTRY_DSN \
    SENTRY_ORG=$SENTRY_ORG \
    SENTRY_PROJECT=$SENTRY_PROJECT \
    SENTRY_AUTH_TOKEN=$SENTRY_AUTH_TOKEN \
    NODE_ENV=production

RUN npm run build --workspace=frontend

# ---- 3. runner: standalone 산출물만 담은 슬림 실행 이미지 ----
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# next.config.ts의 output: 'standalone' 산출물.
# 모노레포 구조상 .next/standalone 은 레포 루트를 그대로 미러링하므로
# frontend/server.js 와 (hoisted) node_modules/ 가 형제 디렉터리로 생성된다.
COPY --from=builder /app/frontend/.next/standalone ./
COPY --from=builder /app/frontend/.next/static ./frontend/.next/static
COPY --from=builder /app/frontend/public ./frontend/public

EXPOSE 3000

CMD ["node", "frontend/server.js"]
