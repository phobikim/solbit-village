// 화면에서 잠시 끈 기능. 코드는 남겨 두고 여기서만 켜고 끈다.

/** 쉼터 (디자인 v8 TURN 15: 모닥불 · 장작 던지기 · 보따리 지도) */
export const REST_FEATURES = {
  /** 지침 신호 카드 (꺼 둔 채 유지) */
  signal: false,
  /** 1년 전 오늘 (꺼 둔 채 유지) */
  yearAgo: false,
} as const;

/** 아침 흐름 (솔이 깨우기 → 컨디션 …). false면 앱 시작 때 자동으로 뜨지 않고, 웹 /wake · 나 탭 개발자 항목으로만 연다. */
export const FEATURES = {
  morningFlow: false,
  /** 하루 고르기의 "보상표 보기" 진입. 시트 컴포넌트(VillageRewardSheet)는 남겨 두고 진입만 끈다 (디자인 TURN 29) */
  rewardTable: false,
} as const;

/**
 * 새 메인(디자인 TURN 30)에서 뺀 요소 기록. 코드 · 도메인은 지우지 않았고, 화면에서 그리지 않는다.
 * 다시 그리려면 app/(tabs)/index.tsx 에서 해당 컴포넌트를 되살린다 (VillageScene · IndexCard · FieldStrip · BroadcastLine 등이 남아 있다).
 */
export const MAIN_SCENE = {
  /** 지수 카드 4개 (건강 · 일 · 관계 · 쉼). 지수는 나 탭 "최근 4주"에서 본다 */
  indexCards: false,
  /** 게시판 (행사 쪽지). 행사는 장부 대소사와 방송으로 본다 */
  board: false,
  /** 놀러 온 이웃. 이웃은 이웃 탭에서 본다 */
  visitors: false,
  /** 집 · 냇가 */
  houseAndCreek: false,
  /** 밭 띠 (장면 밖 띠). 밭은 장면 속으로 들어갔다 */
  fieldStrip: false,
  /** 날씨 5단계 표현. 계산(domain/weather)은 그대로, 새 하늘 레이어에는 아직 안 옮겼다 */
  weatherSky: false,
} as const;
