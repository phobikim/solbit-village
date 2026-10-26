# EAS Update로 PC 없이 폰 Expo Go에서 열기

집 PC의 `npx expo start`를 켜 두지 않아도, GitHub `main`에 푸시하면 자동으로 새 버전이 Expo 서버에 올라가고
폰의 Expo Go에서 그 최신을 열 수 있게 하는 설정이다. (코드 · 이미지 같은 JS 쪽만 올라간다.
네이티브 모듈이 바뀌면 Expo Go 자체가 지원해야 한다.)

> 이 문서는 Expo 문서 기준으로 정리했고, SDK 58 Expo Go에서 실제로 열리는지는 처음 한 번 해 보고 확인해야 한다.

저장소에 이미 들어 있는 것: `.github/workflows/eas-update.yml` (푸시 때마다 타입체크 · 테스트 후 `eas update`).
**아래 1~3을 한 번만 하면 켜진다.** 하기 전에는 워크플로가 "건너뜁니다" 알림만 남기고 끝난다 (실패가 아니다).

## 1. Expo 계정으로 로그인 (집 PC 터미널)

이미 `EXPO_TOKEN`을 쓰고 있다면 같은 창에서 그대로 하면 된다. 아니면:

```bash
cd /d E:\26_WorkSpace\solbit-village
set EXPO_TOKEN=<expo.dev/settings/access-tokens 에서 만든 토큰>
npx expo whoami
```

## 2. 프로젝트를 EAS에 연결 (한 번)

```bash
npx eas-cli@latest init
npx eas-cli@latest update:configure
```

- `init`: Expo 계정에 `solbit-village` 프로젝트를 만들고 `app.json`에 `extra.eas.projectId`를 적는다 (새로 만들겠냐고 물으면 yes).
- `update:configure`: `expo-updates`를 설치하고 `app.json`에 `updates.url` · `runtimeVersion`을 넣고 `eas.json`을 만든다.

바뀐 파일을 커밋하고 푸시한다. (`app.json`, `eas.json`, `package.json`, `package-lock.json`)

```bash
git add app.json eas.json package.json package-lock.json
git commit -m "chore: EAS Update 연결"
git push
```

회사 PC에서는 `git pull` 뒤 `npm install` 한 번.

## 3. GitHub에 토큰 등록 (한 번)

1. https://expo.dev/settings/access-tokens 에서 토큰을 하나 만든다 (본인 계정). 한 번만 보이니 바로 복사.
2. GitHub 저장소 → **Settings → Secrets and variables → Actions → New repository secret**
3. 이름 `EXPO_TOKEN`, 값은 복사한 토큰.

토큰은 비밀번호와 같다. 채팅이나 저장소에 붙이지 않는다. 노출됐다면 expo.dev에서 폐기하고 다시 만든다.

## 4. 폰에서 열기

`main`에 푸시하면 GitHub 저장소의 **Actions 탭 → EAS Update**가 돈다 (1~3분). 초록색이면 올라간 것.

- expo.dev → 프로젝트 `solbit-village` → **Updates** → 가장 위 업데이트 → 폰으로 QR을 찍거나 **Open in Expo Go**.
- 또는 폰의 Expo Go에 같은 계정으로 로그인하면 프로젝트 목록에 나타날 수 있다.

이후에는 푸시할 때마다 새 업데이트가 올라가고, Expo Go에서 프로젝트를 다시 열면 최신을 받는다. PC는 꺼져 있어도 된다.

## 알아 둘 점

- 개발 중 즉시 반영(Fast Refresh)은 여전히 `npx expo start`로 본다. EAS Update는 "PC 없이 최신 버전 보기"용이다.
- 기록 데이터는 폰의 Expo Go 안에 저장된다. 개발 서버로 열 때와 EAS Update로 열 때 같은 데이터를 쓰는지는 확인이 필요하다 (프로젝트 주소가 달라 별도 저장소가 될 수 있다). 중요한 기록은 설정에서 백업을 내보내 둔다.
- 폰 Expo Go의 SDK(지금 58)와 프로젝트 SDK가 같아야 열린다. 새 SDK가 나와 Expo Go가 올라가면 프로젝트도 올려야 한다.
- 무료 계정은 업데이트 용량 · 횟수 제한이 있다. 개인 용도로는 보통 충분하다.
- 되돌리기: `.github/workflows/eas-update.yml`을 지우거나 `EXPO_TOKEN` 시크릿을 지우면 멈춘다.
