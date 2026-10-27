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
