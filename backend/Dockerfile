# Petlog Backend (NestJS) 프로덕션 Dockerfile
#
# 이 저장소는 npm workspaces 기반 모노레포이며, backend는
# @petlog/ai, @petlog/storage, @petlog/types, @petlog/utils 워크스페이스 패키지에
# 의존한다. 따라서 반드시 "레포 루트"를 빌드 컨텍스트로 사용해야 한다.
#
#   docker build -f backend/Dockerfile .
#
# App Runner 계약(aws-devops 인프라 스택과 합의됨):
#   - 컨테이너는 4000 포트로 리슨한다 (backend/src/main.ts, PORT 환경변수 기본값 4000)
#   - 헬스체크 경로는 /api/health로 고정 (backend/src/health)

########################################
# 1. deps: 워크스페이스 의존성 설치
########################################
FROM node:22-alpine AS deps
WORKDIR /app

# bcrypt 등 네이티브 애드온 컴파일에 필요 (alpine/musl은 prebuilt binary가 없을 수 있음)
RUN apk add --no-cache python3 make g++

# 루트 + 워크스페이스 package.json만 먼저 복사한다 (Docker 레이어 캐시 극대화).
# frontend/infra는 backend 빌드에 필요 없으므로 package.json을 복사하지 않는다.
# npm ci는 root package.json의 workspaces 목록에 있어도 package.json이 없는
# 워크스페이스는 조용히 건너뛰므로 안전하다.
COPY package.json package-lock.json ./
COPY libs/types/package.json ./libs/types/package.json
COPY libs/utils/package.json ./libs/utils/package.json
COPY libs/ai/package.json ./libs/ai/package.json
COPY libs/storage/package.json ./libs/storage/package.json
COPY backend/package.json ./backend/package.json

# backend의 postinstall(prisma generate)이 스키마 파일을 필요로 하므로
# npm ci 이전에 prisma 디렉토리를 먼저 복사해 둔다.
COPY backend/prisma ./backend/prisma

RUN npm ci

########################################
# 2. build: 라이브러리 → 백엔드 순으로 빌드
########################################
FROM node:22-alpine AS build
WORKDIR /app

COPY --from=deps /app ./
COPY tsconfig.base.json ./
COPY libs ./libs
COPY backend ./backend

# 워크스페이스 라이브러리를 먼저 컴파일해 dist/를 생성한다.
# backend가 @petlog/ai, @petlog/storage 등을 node_modules 심볼릭 링크를 통해
# resolve하려면 이 dist/ 산출물(및 .d.ts)이 미리 존재해야 한다.
RUN npx tsc --build libs/types libs/utils libs/ai libs/storage

# Nest 빌드 (backend/dist 생성)
RUN npm run build --workspace=backend

# 런타임에 불필요한 devDependencies 제거 (postinstall 재실행 없이 in-place prune)
RUN npm prune --omit=dev

########################################
# 3. runtime: 최소 실행 이미지
########################################
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# 워크스페이스 심볼릭 링크(node_modules/@petlog/*)가 ../../libs/* 및 ../../backend를
# 상대 경로로 가리키므로, 모노레포 디렉토리 구조를 그대로 유지해야 한다.
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/libs ./libs
COPY --from=build /app/backend/node_modules ./backend/node_modules
COPY --from=build /app/backend/dist ./backend/dist
COPY --from=build /app/backend/prisma ./backend/prisma
COPY --from=build /app/backend/package.json ./backend/package.json

EXPOSE 4000

CMD ["node", "backend/dist/main.js"]
