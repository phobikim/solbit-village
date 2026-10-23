// 화면에서 잠시 끈 기능. 코드는 남겨 두고 여기서만 켜고 끈다.

/** 쉼터 (2026-10-23 사용자 결정: 다녀온 곳 / 가고 싶은 곳 / 쉼 지수 세 가지로 정리) */
export const REST_FEATURES = {
  /** 지침 신호 카드 */
  signal: false,
  /** 오늘의 쉼 제안 */
  suggestions: false,
  /** 1년 전 오늘 */
  yearAgo: false,
  /** 가고 싶은 곳 [날짜 잡기] → 여행 행사 */
  schedule: false,
} as const;
