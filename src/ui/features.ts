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
} as const;

/**
 * 새 메인(디자인 TURN 30)의 장면 요소 스위치. true = 장면에 그린다 (app/(tabs)/index.tsx 가 이 값을 VillageBackdrop에 넘긴다).
 * TURN 30에서 뺐던 게시판 · 이웃 · 집 · 냇가 · 날씨는 TURN 31 메인 보정에서 복원했다. 지수 카드 · 밭 띠는 계속 끈다
 * (IndexCard · FieldStrip 컴포넌트는 남아 있다).
 */
export const MAIN_SCENE = {
  /** 지수 카드 4개 (건강 · 일 · 관계 · 쉼). 지수는 나 탭 "최근 4주"에서 본다 */
  indexCards: false,
  /** 게시판 (행사 쪽지 최대 3개, 누르면 장부 대소사). 복원 (TURN 31 메인 보정) */
  board: true,
  /** 놀러 온 가까운 이웃 (최대 2명). 복원 */
  visitors: true,
  /** 집 · 냇가(물). 복원 */
  houseAndCreek: true,
  /** 밭 띠 (장면 밖 띠). 밭은 장면 속으로 들어갔다 */
  fieldStrip: false,
  /** 날씨 5단계 표현(구름 · 비 · 폭풍). 계산은 domain/weather, 그림은 scene/art.ts weatherSvg. 복원 */
  weatherSky: true,
} as const;
