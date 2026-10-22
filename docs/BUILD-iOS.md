# Mac에서 내 아이폰에 설치하기

Windows에서는 iOS 앱을 빌드할 수 없어서 Mac에서 한다. 무료 Apple 계정이면 설치한 앱이 7일 뒤에 안 열리니, 그때 마지막 단계(6)만 다시 하면 된다. 다시 설치해도 앱을 지우지 않는 한 폰에 저장된 기록은 그대로 남는다.

## 준비 (처음 한 번)

1. **Xcode**: App Store에서 설치하고 한 번 실행해서 추가 구성요소까지 설치한다.
   - Xcode › Settings › Accounts에서 Apple ID로 로그인한다 (무료 계정이면 "Personal Team"이 생긴다).
2. **Node 22**: `node -v`가 22.x여야 한다 (`.nvmrc` 참고). nvm을 쓰면 프로젝트 폴더에서 `nvm use`.
3. **CocoaPods**: `pod --version`이 안 되면 `brew install cocoapods`.
4. **아이폰**
   - USB로 Mac에 연결하고 "이 컴퓨터를 신뢰" 누르기.
   - 설정 › 개인정보 보호 및 보안 › **개발자 모드** 켜기 (재시동됨).

## 빌드

```bash
git clone https://github.com/phobikim/solbit-village.git
cd solbit-village
npm ci
npx expo prebuild --platform ios --clean
```

`prebuild`가 `ios/` 폴더를 만든다 (`.gitignore`에 들어 있어 커밋하지 않는다).

## Xcode에서 서명

5. `open ios/*.xcworkspace` 로 Xcode를 연다 (`.xcodeproj` 말고 `.xcworkspace`).
   - 왼쪽에서 프로젝트 › 타깃 선택 › **Signing & Capabilities**
   - **Team**: 내 Personal Team 선택
   - **Bundle Identifier**: `com.solbit.village`가 이미 쓰인다고 나오면 `com.내이름.solbit` 처럼 바꾼다.
   - **Push Notifications** 항목이 있으면 휴지통으로 지운다. 무료 계정은 푸시를 못 쓰는데, 이 앱은 기기 안에서 예약하는 로컬 알림만 써서 지워도 아침 소식 알림은 그대로 온다.
   - 위쪽 실행 대상에서 내 아이폰을 고른다.

## 설치

6. Xcode 메뉴 **Product › Scheme › Edit Scheme › Run › Build Configuration**을 **Release**로 바꾸고 ▶ (Run).
   - Release로 빌드하면 개발 서버 없이 폰 혼자 돌아가고, 개발 도구도 숨겨진다.
   - 처음 실행하면 폰에서 "신뢰하지 않는 개발자"가 뜬다: 설정 › 일반 › VPN 및 기기 관리 › 내 Apple ID › 신뢰.

명령어로 하고 싶으면 5의 서명을 한 번 해 둔 뒤 `npx expo run:ios --device --configuration Release`.

## 알아둘 것

- 기록은 폰 안(SQLite)에만 저장된다. 웹이나 Expo Go에서 넣은 테스트 기록은 따라오지 않는다. 빈 마을에서 시작한다.
- 앱을 **지우면** 기록도 지워진다. 옮기거나 지우기 전에 나 › 설정 › 백업 파일 내보내기.
- 코드가 바뀌면 `git pull` → `npm ci` → `npx expo prebuild --platform ios --clean` → 5(서명 다시 확인) → 6.
