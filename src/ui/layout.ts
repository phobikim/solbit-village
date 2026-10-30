// 메인 화면(7a) 레이아웃 — 고정 규칙. 이 파일은 RN을 import하지 않는다 (순수 계산 + 상수 → 단위 테스트).
//
// 구성 순서: 재화 바(코인 · 흥) → 헤더(마을 이름 + Lv + 성장 바) → 방송 → 마을 장면 → 지수 → 밭 띠 → 오늘 기록하기 → 탭 바
// 마을 장면은 4:3 고정 (너비 = 콘텐츠 영역 전체, 높이 = 너비 × 3/4). 장면 비율은 절대 바꾸지 않고,
// 높이가 모자라면 나머지 요소를 압축한다. 그래도 안 들어가면 메인만 스크롤 (탭 바 고정).

// ── 요소 높이 (pt) — 기본 / 압축 ─────────────────────────────────────────

export const MAIN_LAYOUT = {
  /** 재화 바: 코인 · 흥 칩 한 줄 (헤더 위). 압축하지 않는다 */
  currency: 36,
  /** 재화 바 | 헤더 간격. 압축하지 않는다 */
  currencyGap: 10,
  /** 헤더: 마을 이름 + Lv 한 줄 + 성장 바 (부제 없음). 재화 바는 따로 위에 있다 */
  header: 64,
  /** 방송: 2줄 / 1줄 말줄임 (탭하면 펼침) */
  broadcast: { full: 68, compact: 44 },
  /** 지수: 기본(링 + 숫자 + 문구) / 문구 제거(링 + 숫자) / 한 줄 띠(아이콘 + 숫자, 링 없음). 지수 색은 늘 유지 */
  indices: { full: 96, ring: 72, strip: 44 },
  /** 밭 띠: 기본(그림 + 상태 글자) / 압축(글자 숨김) */
  field: { full: 72, compact: 56 },
  /** 오늘 기록하기 */
  cta: { full: 56, compact: 52 },
  /** 탭 바 (하단 안전 영역은 따로 더한다). 항상 고정 */
  tabBar: 76,
  /** 요소 사이 간격 */
  gap: { full: 10, compact: 8 },
  /** 간격이 들어가는 곳: 헤더|방송 · 방송|장면 · 장면|지수 · 지수|밭 띠 · 밭 띠|기록 버튼 */
  gapCount: 5,
  /** 콘텐츠 영역 좌우 여백 */
  sidePadding: 16,
} as const;

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
  return Math.max(0, Math.min(windowWidth, APP_MAX_WIDTH) - MAIN_LAYOUT.sidePadding * 2);
}

/** 장면 높이 = 너비 × 3/4 */
export function sceneHeight(width: number): number {
  return Math.round(width * SCENE_RATIO * 100) / 100;
}

// ── 메인 레이아웃 계산 ──────────────────────────────────────────────────

/**
 * 압축 단계 (장면 비율은 절대 바꾸지 않는다)
 * 0 기본: 지수 96, 방송 2줄, 밭 띠 72 (글자 있음)
 * 1 지수 문구 제거 (96 → 72)
 * 2 방송 1줄 + 지수 한 줄 띠(44) + 밭 띠 56 (글자 숨김)
 * 3 간격 8, 기록 버튼 52
 * 4 그래도 안 들어가면 메인 스크롤 허용 (탭 바는 고정). 크기는 3단계와 같다.
 */
export type CompactStep = 0 | 1 | 2 | 3 | 4;
export type IndexVariant = 'full' | 'ring' | 'strip';

export type MainLayout = {
  step: CompactStep;
  /** 사용 가능 높이: 보이는 높이 − 위 안전 영역 − (탭 바 + 아래 안전 영역) */
  available: number;
  currency: number;
  currencyGap: number;
  header: number;
  broadcast: number;
  broadcastLines: 1 | 2;
  /** 마을 장면: 너비 × 3/4 */
  sceneWidth: number;
  scene: number;
  indices: number;
  indexVariant: IndexVariant;
  field: number;
  /** 밭 띠 칸마다 상태 글자를 보이는가 */
  fieldLabels: boolean;
  cta: number;
  gap: number;
  /** 요소 + 간격 + 장면을 다 더한 높이 */
  content: number;
  /** content > available이면 메인 스크롤 (4단계) */
  scroll: boolean;
};

type Pick = {
  broadcast: number;
  lines: 1 | 2;
  indices: number;
  variant: IndexVariant;
  field: number;
  labels: boolean;
  cta: number;
  gap: number;
};

const M = MAIN_LAYOUT;
const STEPS: readonly Pick[] = [
  { broadcast: M.broadcast.full, lines: 2, indices: M.indices.full, variant: 'full', field: M.field.full, labels: true, cta: M.cta.full, gap: M.gap.full },
  { broadcast: M.broadcast.full, lines: 2, indices: M.indices.ring, variant: 'ring', field: M.field.full, labels: true, cta: M.cta.full, gap: M.gap.full },
  { broadcast: M.broadcast.compact, lines: 1, indices: M.indices.strip, variant: 'strip', field: M.field.compact, labels: false, cta: M.cta.full, gap: M.gap.full },
  { broadcast: M.broadcast.compact, lines: 1, indices: M.indices.strip, variant: 'strip', field: M.field.compact, labels: false, cta: M.cta.compact, gap: M.gap.compact },
];

const fixedOf = (p: Pick) => M.currency + M.currencyGap + M.header + p.broadcast + p.indices + p.field + p.cta + p.gap * M.gapCount;

/**
 * 보이는 높이 · 안전 영역 · 콘텐츠 너비로 메인 레이아웃을 정한다.
 * 장면(너비 × 3/4)을 먼저 놓고, 나머지 요소가 들어갈 때까지 단계를 올린다. 3단계로도 안 들어가면 4단계(스크롤).
 */
export function mainLayout(visibleHeight: number, insetTop: number, insetBottom: number, width: number): MainLayout {
  const available = Math.max(0, visibleHeight - insetTop - M.tabBar - insetBottom);
  const scene = sceneHeight(width);
  let step: CompactStep = 4;
  let chosen = STEPS[STEPS.length - 1];
  for (let i = 0; i < STEPS.length; i++) {
    if (fixedOf(STEPS[i]) + scene <= available) {
      step = i as CompactStep;
      chosen = STEPS[i];
      break;
    }
  }
  const content = fixedOf(chosen) + scene;
  return {
    step,
    available,
    currency: M.currency,
    currencyGap: M.currencyGap,
    header: M.header,
    broadcast: chosen.broadcast,
    broadcastLines: chosen.lines,
    sceneWidth: width,
    scene,
    indices: chosen.indices,
    indexVariant: chosen.variant,
    field: chosen.field,
    fieldLabels: chosen.labels,
    cta: chosen.cta,
    gap: chosen.gap,
    content,
    scroll: step === 4,
  };
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

export function morningDayLayout(visibleHeight: number, insetTop: number, insetBottom: number): MorningDayLayout {
  const M = MORNING_DAY_LAYOUT;
  const available = Math.max(0, visibleHeight - insetTop - insetBottom);
  const fixedOf = (card: number) =>
    M.header + M.broadcast + M.gapScene + M.gapDays + M.label + card + M.gapReward + M.rewardLink + M.gapButton + M.button + M.gapLater + M.later + M.bottomPad;

  const full = Math.min(M.scene.max, available - fixedOf(M.dayCard.full));
  if (full >= M.scene.comfortable) return { step: 0, available, scene: full, dayCard: M.dayCard.full, scroll: false };
  const compact = Math.min(M.scene.max, available - fixedOf(M.dayCard.compact));
  if (compact >= M.scene.min) return { step: 1, available, scene: compact, dayCard: M.dayCard.compact, scroll: false };
  return { step: 2, available, scene: M.scene.min, dayCard: M.dayCard.compact, scroll: true };
}

// ── 옷장 탭 (디자인 TURN 28). 위에서 아래로: 상태바 → 헤더 → 미리보기 → 세그먼트 → 슬롯 탭 → 그리드 → 탭 바 ──
// 미리보기는 284 고정이다. 남는 높이는 그리드가 받고, 그리드는 안에서 스크롤한다.

export const CLOSET_LAYOUT = {
  /** 헤더: 재화 칩 2개(왼쪽) + 제목(오른쪽). 위 2 · 아래 10 여백 포함 */
  header: { height: 36, top: 2, bottom: 10 },
  /** 미리보기 카드 (좌우 12) */
  preview: { height: 284, radius: 28, side: 12 },
  /** 내 옷장 | 옷 가게 세그먼트 */
  segment: { height: 44, top: 12, side: 12 },
  /** 슬롯 탭 줄 */
  tabs: { height: 36, top: 10, side: 12, gap: 6 },
  /** 그리드: 3열, 위 14 · 좌우 12, 칸 사이 가로 10 · 세로 12. 아래 16 (입어 보는 중에는 큰 사기 버튼에 가리지 않게 84) */
  grid: { cols: 3, top: 14, side: 12, gapX: 10, gapY: 12, bottom: 16, bottomWithBuy: 84 },
  /** 칸 안 썸네일 상자 */
  thumb: 80,
  /** 큰 사기 버튼: 탭 바 바로 위에 붙는다 */
  buy: { height: 56, side: 16, bottom: 10 },
  /** 구매 확인 시트 안 미리보기 */
  sheetPreview: 210,
} as const;
