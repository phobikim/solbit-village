# 솔빛 마을, 아직 망하진 않음

내 삶을 기록하면 화면 속 시골 마을이 따라 변하는 라이프 기록 앱.
게임이 나를 성장시키는 앱이 아니라, 마을이 내 삶을 옆에서 보조하는 앱이다.

- 제품 기획 전체: `docs/SPEC.md` (규칙·화면·미정 사항). 기능을 만들기 전에 해당 절을 먼저 읽는다.
- 디자인 기준: `design/` (Claude Design 시안 v5). 화면 번호(7a, 9a …)는 SPEC과 같다.

## 기술 스택

- Expo (React Native) + TypeScript (strict), 라우팅은 expo-router
- 1차 타깃: iOS (macOS + Xcode에서 빌드). Android는 같은 코드로 나중에.
- 저장: 기기 로컬만 (expo-sqlite). 서버·로그인 없음. 백업은 JSON 내보내기/가져오기.
- 상태: zustand / 애니메이션: react-native-reanimated / 그림: react-native-svg
- 알림: expo-notifications 로컬 예약 알림 (아침 "밤사이 마을 소식")
- 테스트: jest. `src/domain`은 반드시 단위 테스트를 둔다.

## 폴더 구조

```
app/                    expo-router 화면
  (tabs)/               index(마을) · records(장부: 그날그날 / 대소사) · neighbors(이웃) · rest(쉼터) · me(나)
  record.tsx            오늘 기록 시트 (모달)
  seed-result.tsx       씨앗 결과
  ledger/new.tsx        행사 등록 시트
  place-new.tsx         쉼터 가고 싶은 곳 · 다녀온 곳 담기 · [다녀왔슈] 시트
  storage.tsx           수확 창고 (창고 / 교환소 탭)
  neighbor-new.tsx      이웃 등록
  morning-news.tsx      밤사이 마을 소식
src/
  domain/               게임 규칙. 순수 TS, React/RN import 금지
    crops.ts            작물 결정 · 성장 단계 · 밭 5칸 · 자동 수확
    indices.ts          지수 4개 계산
    weather.ts          컨디션 → 날씨 단계
    village.ts          마을 경험치 · 레벨 · 해금
    harvest.ts          수확 레벨 · 농부 칭호 · 스킨 교환
    neighbors.ts        가까움 · 단짝 · 마을 등장 이웃
    events.ts           행사 D-day · 지나간 일
    broadcast.ts        상황 → 이장 방송 선택
    day.ts              "하루"의 경계 계산
  data/                 SQLite 스키마 · 마이그레이션 · repository
  state/                zustand 스토어
  ui/
    theme.ts            색 · 폰트 · 간격 토큰
    characters/         솔이 · 꾸역 이장 · 이웃 얼굴 SVG (디자인 파일에서 이식)
    components/         BroadcastLine, IndexCard, Chip, BottomSheet, FieldPlot …
  copy/broadcasts.ko.ts 이장 방송 문구 모음 (코드에 문구 하드코딩 금지)
  notifications/
design/                 디자인 원본 (수정하지 않음)
docs/SPEC.md
```

## 반드시 지킬 규칙

1. **지수는 날씨, 레벨은 땅.** 지수 4개는 오르내리지만 마을 레벨·수확 레벨·보유 작물은 절대 줄지 않는다.
2. **캐릭터(솔이)에는 레벨이 없다.** 레벨은 마을과 수확에만 있다.
3. **기록은 정확해야 한다.** 희귀 작물·확률 보상 없음. 하루 기록 1번 = 씨앗 1개. 기록을 고쳐도 이미 심은 작물은 바뀌지 않는다.
4. **벌이 없다.** 기록을 안 해도, 수확을 안 해도 아무것도 시들거나 잃지 않는다. 나쁜 작물도 없다. 돌봄 의무(먹이 주기 등)를 만들지 않는다.
5. **기록 입력은 한곳.** "오늘 기록하기" 시트에서만 입력한다. 마을을 탭해서 기록하는 장치는 만들지 않는다.
6. **관계는 긍정적으로.** 가까운 이웃을 부각한다. 소홀한 이웃을 빨간색·경고로 표시하지 않는다. 관계에 집착하는 UI(이웃 필터, 기록 카드의 이웃 표시 등)를 만들지 않는다.
7. **방송 톤.** 시니컬하지만 놀리는 대상은 상황이지 사용자가 아니다. 컨디션이 최악(폭풍)인 날은 개그를 끄고 짧게: "...오늘은 방송 안 해유. 푹 쉬슈. 이상." 이장 말투는 충청도 사투리 (2026-10-22, 디자인 v6).
8. **텍스트는 한글과 영문만.** 한자 사용 금지.
9. 도메인 규칙은 `src/domain`에만 둔다. 화면 컴포넌트에서 규칙을 계산하지 않는다.
10. SPEC에 "미정"으로 표시된 규칙은 임의로 확정하지 말고, 상수로 분리해 TODO를 남기고 사용자에게 묻는다.

## 디자인 토큰 (design/ 6e 기준)

| 용도 | 값 |
|---|---|
| 밤 배경 | `#141A3E` (가장 바깥 `#0D1130`) |
| 카드 | `#232B60`, 보조 카드 `#1E2558` |
| 낮 배경 | `#EAF6FF` |
| 선·진한 글자 | `#10142E` |
| 본문 보조 글자 | `#C9CEF5`, `#8F96CC` |
| 포인트 핑크 (버튼·방송) | `#FF4FA0` |
| 포인트 노랑 (타이틀·불빛) | `#FFE14D` |
| 건강 | `#5FD8FF` |
| 일 (강도별 그라데이션) | `#FFC23C` → `#FF5A4A` (높을수록 빨강) |
| 관계 | `#A8EB5A` |
| 여가 | `#C49BFF` |

폰트: 타이틀 Bagel Fat One · 본문 NanumSquareRound · 숫자 Fredoka · 효과음 Gaegu Bold.
앱에 폰트 파일을 포함하고 `expo-font`로 로드한다. 출시 전에 각 폰트 라이선스를 확인한다.

## 캐릭터 이식

`design/solbit-v5.dc.html` 안의 `<script data-dc-script>`에 솔이(`soliIn`), 이웃(`npcIn`), 이장 등을
SVG 문자열로 만드는 함수가 있다. 이 함수들을 `src/ui/characters/`로 옮겨 `react-native-svg`의 `SvgXml`로 그린다.
선 색 `#10142E`, viewBox `0 0 200 220` 규칙을 유지한다.

## 작업 방식

- 단계는 `docs/SPEC.md`의 "개발 단계" 순서를 따른다. 한 단계가 끝나면 iOS 시뮬레이터에서 확인 가능한 상태로 둔다.
- 날짜 계산은 반드시 `src/domain/day.ts`를 거친다 (하루 경계 규칙 때문).
- 커밋은 기능 단위로 작게.
