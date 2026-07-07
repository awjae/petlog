# Petlog Mobile (Capacitor)

`frontend/`(Next.js, ECS Fargate + CloudFront 배포)를 별도로 재구현하지 않고, Capacitor의
**원격 URL 모드**로 감싸서 iOS/Android 네이티브 셸을 만든다. `server.url`이 배포된 도메인을
그대로 로드하므로 SSR, rewrites 등 `frontend/`의 서버 기능을 그대로 유지한다.

`www/`는 Capacitor 설정 스키마상 필요한 placeholder일 뿐 실제로 로드되지 않는다.

## 현재 상태

- Android 네이티브 프로젝트(`android/`) 생성 완료
- iOS는 미생성 — 로컬에 CocoaPods 설치 후 `npx cap add ios` 필요
  ```
  brew install cocoapods
  npx cap add ios
  ```

## MOBILE_APP_URL

배포 도메인은 코드에 하드코딩하지 않고 환경 변수로 주입한다 (`infra/stacks/backend-stack.ts`의
`domain_name` TF_VAR와 동일한 원칙 — 비밀 값은 아니지만 코드-설정을 분리).

- **CI**: GitHub Actions Repository Variable `MOBILE_APP_URL`로 등록
  (Settings > Secrets and variables > Actions > Variables). `.github/workflows/ci.yml`의
  `sync-mobile` 잡이 이 값을 읽어 `cap sync android`를 실행한다.
- **로컬 개발**: `mobile/.env`(미커밋, `.env.example` 참고)에 기본값을 넣어두면
  `capacitor.config.ts`가 자동으로 읽는다. 셸에 `MOBILE_APP_URL`이 이미 설정돼 있으면
  `.env`보다 우선한다.

```bash
cp mobile/.env.example mobile/.env   # 최초 1회, MOBILE_APP_URL 값 확인/수정
npx cap sync android
npx cap open android   # Android Studio에서 실행
```

## 안드로이드 기기/에뮬레이터에서 바로 실행

`npm run run:android --workspace=mobile`이 sync → Gradle 빌드 → 설치 → 실행까지 한 번에 처리한다.
`mobile/.env`에 값을 넣어뒀다면 별도 환경 변수 지정 없이 바로 실행하면 된다.
연결된 기기/에뮬레이터가 여러 개면 대상을 선택하라는 프롬프트가 뜬다.

```bash
export ANDROID_HOME="$HOME/Library/Android/sdk"
export PATH="$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator"

npm run run:android --workspace=mobile
```

> **Next.js dev 서버(`next dev`, 포트 3000)를 가리키면 안 된다.** Turbopack의 HMR 웹소켓이
> 에뮬레이터(`10.0.2.2`) 경로에서 연결을 못 잡고 ~80초마다 페이지를 강제 리로드해서, 입력
> 중이던 폼 상태(로그인 등)가 계속 초기화되는 것처럼 보인다. 로컬에서 실제 동작을 검증할 땐
> 반드시 프로덕션 빌드를 띄우고 그 포트를 가리켜야 한다.
>
> ```bash
> npm run build --workspace=frontend
> npx next start -p 3001 --prefix frontend   # 또는 cd frontend && npx next start -p 3001
> ```

에뮬레이터가 아니라 실물 기기(USB 연결)라면 `10.0.2.2` 대신 `adb reverse tcp:3001 tcp:3001`로
포트를 포워딩하고 `MOBILE_APP_URL=http://localhost:3001`을 쓴다.

## TODO (다음 단계)

- [ ] 오프라인/네트워크 에러 화면: `server.url` 모드는 로드 실패 시 빈 화면만 보이므로,
      네이티브 WebView 레벨에서 로드 실패를 감지해 로컬 에러 화면을 보여주는 처리가 필요하다.
- [ ] 푸시 알림 연동: `@capacitor/push-notifications`로 권한 요청 및 FCM/APNs 토큰 발급까지만
      이 레이어의 책임이다. 토큰을 유저와 매핑해 저장하고, 백신/투약 만료·주간 리포트 알림을
      실제로 트리거하는 로직은 `backend/`의 신규 `notification` 도메인 모듈에서 담당한다.
- [ ] iOS 네이티브 프로젝트 생성 (`brew install cocoapods` 필요)
- [ ] 앱스토어 심사 대비: 순수 웹뷰로만 보이지 않도록 네이티브 스플래시 스크린,
      상태바 스타일링, 푸시 알림 등 네이티브 기능을 실제로 연결해야 한다
      (Apple Guideline 4.2, Minimum Functionality).
