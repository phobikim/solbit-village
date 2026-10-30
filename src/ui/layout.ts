// 화면 레이아웃 상수 · 순수 계산. 이 파일은 RN을 import하지 않는다 (단위 테스트).
// 새 메인(TURN 30)의 장면 맞춤은 src/ui/mainScene.ts. 아래 4:3 장면 좌표(SCENE_*)는 예전 마을 장면(VillageScene) 전용이다.

/** 웹에서 앱 틀의 최대 너비 (app/_layout.tsx frame.maxWidth) */
export const APP_MAX_WIDTH = 430;

// ── 마을 장면: 4:3 고정, 장면 크기 대비 % 좌표 ───────────────────────────

/** 높이 / 너비 */
export const SCENE_RATIO = 3 / 4;
/** 장면 그림 좌표계 (4:3). 아래 % 좌표를 이 좌표로 바꿔 그린다 */
export const SCENE_VIEW = { width: 400, height: 300 } as const;

/** 장면 안 배치 (장면 너비 · 높이 대비 %). x는 너비 기준, y는 높이 기준, bottom은 바닥선 y */
export const SCENE_PCT = {
  /** 하늘 (해 · 구름 · 별 · 비 · 번개) */
  sky: { top: 0, bottom: 35 },
  /**
   * 원경 (언덕). 하루별 원경(출근 · 여행 · 쉬는 날)도 같은 영역을 쓴다.
   * TODO: 하루별 원경 그림은 아직 코드에 없다 — 생기면 이 영역에 그린다.
   */
  far: { top: 28, bottom: 48 },
  /** 땅 시작 y */
  groundTop: 52,
  house: { x0: 4, x1: 30, bottom: 60 },
  board: { x0: 32, x1: 56, bottom: 60 },
  creek: { x0: 60, x1: 96, y0: 52, y1: 62 },
  /** 솔이: 가운데, 바닥 96%, 너비 30% */
  soli: { cx: 50, bottom: 96, width: 30 },
  /** 놀러 온 이웃: 가까운 이웃 18%, 먼 이웃 82%, 바닥 94%, 너비 16% */
  neighbors: { cx: [18, 82] as const, bottom: 94, width: 16 },
  /** 게시판을 누르는 영역 (게시판 간판 부분) */
  boardHit: { x0: 32, x1: 56, y0: 38, y1: 60 },
} as const;

/** 장면 % → 그림 좌표 */
export const sx = (pct: number) => (SCENE_VIEW.width * pct) / 100;
export const sy = (pct: number) => (SCENE_VIEW.height * pct) / 100;

/** 콘텐츠 영역 너비 = 보이는 너비(웹은 앱 틀 최대 너비로 제한) − 좌우 여백 */
export function contentWidth(windowWidth: number): number {
  return Math.max(0, Math.min(windowWidth, APP_MAX_WIDTH) - 16 * 2);
}

/** 장면 높이 = 너비 × 3/4 */
export function sceneHeight(width: number): number {
  return Math.round(width * SCENE_RATIO * 100) / 100;
}

// ── 아침 흐름 2번째 화면 "오늘 하루 고르기" (디자인 v5 26a~c) ───────────
// 스크롤 없이 한 화면. 장면 카드가 남는 높이를 받고(최대 318), 모자라면 선택 카드를 줄인다. 그래도 모자라면 스크롤.

export const MORNING_DAY_LAYOUT = {
  header: 50,
  broadcast: 68,
  /** 방송 | 장면 */
  gapScene: 12,
  scene: { max: 318, min: 170, /** 이 아래로 줄어들면 카드를 압축 */ comfortable: 220 },
  /** 장면 | "오늘은" */
  gapDays: 14,
  /** 소제목 줄 + 소제목과 카드 사이 */
  label: 30,
  dayCard: { full: 150, compact: 124 },
  /** 선택 카드 | 보상표 보기 줄 */
  gapReward: 8,
  /** "보상표 보기" 버튼 32 + 보조 문구 줄 */
  rewardLink: 52,
  /** 보상표 보기 줄 | 다음 버튼 */
  gapButton: 12,
  button: 56,
  /** 다음 버튼 | 나중에 할래유 */
  gapLater: 6,
  later: 28,
  /** 아래 안전 영역에 더하는 여백 */
  bottomPad: 6,
} as const;

export type MorningDayLayout = {
  /** 0 기본 · 1 카드 압축 · 2 압축해도 모자라 스크롤 */
  step: 0 | 1 | 2;
  available: number;
  scene: number;
  dayCard: number;
  scroll: boolean;
};

export function morningDayLayout(visibleHeight: number, insetTop: number, insetBottom: number, withRewardLink = true): MorningDayLayout {
  const M = MORNING_DAY_LAYOUT;
  const available = Math.max(0, visibleHeight - insetTop - insetBottom);
  const fixedOf = (card: number) =>
    M.header + M.broadcast + M.gapScene + M.gapDays + M.label + card + (withRewardLink ? M.gapReward + M.rewardLink : 0) + M.gapButton + M.button + M.gapLater + M.later + M.bottomPad;

  const full = Math.min(M.scene.max, available - fixedOf(M.dayCard.full));
  if (full >= M.scene.comfortable) return { step: 0, available, scene: full, dayCard: M.dayCard.full, scroll: false };
  const compact = Math.min(M.scene.max, available - fixedOf(M.dayCard.compact));
  if (compact >= M.scene.min) return { step: 1, available, scene: compact, dayCard: M.dayCard.compact, scroll: false };
  return { step: 2, available, scene: M.scene.min, dayCard: M.dayCard.compact, scroll: true };
}

// ── 옷장 탭 (디자인 TURN 28). 위에서 아래로: 상태바 → 헤더 → 미리보기 → 세그먼트 → 슬롯 탭 → 그리드 → 탭 바 ──
// 미리보기는 284 고정이다. 남는 높이는 그리드가 받고, 그리드는 안에서 스크롤한다.

export const CLOSET_LAYOUT = {
  /** 헤더: 뒤로 버튼 40 + 제목 + 지갑 알약(36). 위 2 · 아래 10 여백 포함 */
  header: { height: 40, top: 2, bottom: 10 },
  /** 미리보기 카드 (좌우 12) */
  preview: { height: 284, radius: 28, side: 12 },
  /** 슬롯 탭 줄 */
  tabs: { height: 36, top: 10, side: 12, gap: 6 },
  /** 그리드: 3열, 위 14 · 좌우 12, 칸 사이 가로 10 · 세로 12. 아래 30 (하단 액션 버튼이 떠 있으면 100) */
  grid: { cols: 3, top: 14, side: 12, gapX: 10, gapY: 12, bottom: 30, bottomWithAction: 100 },
  /** 칸 안 썸네일 상자 */
  thumb: 80,
  /** 하단 액션 버튼: 안전 영역 위 26. 벗기 버튼은 왼쪽 폭 84 */
  action: { height: 56, side: 16, bottom: 26, takeOffWidth: 84, gap: 10 },
} as const;

/** 지수 카드 모양 (IndexCard). 새 메인에서는 쓰지 않지만 컴포넌트는 남겨 두었다 */
export type IndexVariant = 'full' | 'ring' | 'strip';
