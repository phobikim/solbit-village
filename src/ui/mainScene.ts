// 새 메인(디자인 TURN 30)의 장면 맞춤 · 솔이 크기와 자리 · 누르는 영역. 순수 계산이라 단위 테스트한다 (RN import 없음).
// 장면은 390×844 좌표계를 가로에 맞춰(배율 = 너비/390) 아래에 붙여 깐다. 세로가 모자라면 하늘 쪽 위가 잘리고, 남으면 위는 하늘색 바탕이 채운다 (배경이 화면보다 커지지 않게).

export const SCENE_DESIGN = { width: 390, height: 844 } as const;

export type SceneFit = {
  /** 배율 = w/390 (가로 기준) */
  scale: number;
  /** 화면 안에서 장면 왼쪽 위 (가로는 가운데 맞춤, 세로는 아래 맞춤이라 음수일 수 있다) */
  left: number;
  top: number;
};

export function sceneFit(width: number, height: number): SceneFit {
  const scale = width / SCENE_DESIGN.width;
  return {
    scale,
    left: (width - SCENE_DESIGN.width * scale) / 2,
    top: height - SCENE_DESIGN.height * scale,
  };
}

const round1 = (v: number) => Math.round(v * 10) / 10;

// ── 솔이: 크기 · 자리 · 누르는 영역 ─────────────────────────
// 솔이 그림은 기본 포즈 캔버스(200×240, 발 기준선 y=228)를 쓴다. 크기는 SOLI_SCALE 하나로 정하고 나머지는 모두 여기서 계산한다.
// 가로 중앙(x=195)과 발 위치(y≈623, 390×844 기준)는 v12 시안과 같다. 크기만 v12의 1.9배 → v11의 1.364배로 줄였다.

/** 솔이 크기: 폭 110 기준의 배수 (v11 = 1.364, v12 = 1.9 는 너무 컸다) */
export const SOLI_SCALE = 1.364;
export const SOLI_BASE_WIDTH = 110;
export const SOLI_CENTER_X = 195;
/** 발이 닿는 y (390×844 기준) */
export const SOLI_FOOT_Y = 622.8;

/** 포즈 캔버스 비율 (src/ui/characters/soliPoses.ts SOLI_POSE_VIEWBOX) 과 그 안 발 기준선 */
const POSE = { width: 200, height: 240, footY: 228 } as const;

export type SoliBox = { left: number; top: number; width: number; height: number };

/** 솔이 그림 상자 (장면 390×844 좌표) */
export function soliBox(scale: number = SOLI_SCALE): SoliBox {
  const width = SOLI_BASE_WIDTH * scale;
  return {
    left: round1(SOLI_CENTER_X - width / 2),
    top: round1(SOLI_FOOT_Y - (width * POSE.footY) / POSE.width),
    width: round1(width),
    height: round1((width * POSE.height) / POSE.width),
  };
}

/** 발 그림자: 폭은 솔이 크기에 비례, 발 바로 위 */
export function soliShadow(scale: number = SOLI_SCALE) {
  return { cx: 194.9, cy: round1(SOLI_FOOT_Y - 4.6), rx: round1(40 * scale), ry: round1(6 * scale) };
}

/** 폴짝: 3초 주기, 0;-4;0;-16;0;0 (시안 keyTimes). unit = 솔이 배율 (움직임도 같이 줄어든다) */
export const SOLI_BOB = { period: 3, keyTimes: [0, 0.2, 0.4, 0.5, 0.6, 1], values: [0, -4, 0, -16, 0, 0], unit: SOLI_SCALE } as const;

export type SoliHit = {
  left: number;
  /** 화면 아래에서 */
  bottom: number;
  width: number;
  height: number;
  /** 누르는 영역 안 옷걸이 배지(28원) 왼쪽 위 */
  badgeLeft: number;
  badgeTop: number;
};

export const SOLI_BADGE_SIZE = 28;

/**
 * 솔이를 누르는 영역과 옷걸이 배지 자리. 솔이 상자에서 계산한다 (좌우 10 · 위 4 · 발 아래 5 여유, 배지는 오른쪽 아래 모서리 안쪽).
 * lift = 장면을 올린 만큼 (sceneLift).
 */
export function soliHit(width: number, height: number, lift = 0): SoliHit {
  const fit = sceneFit(width, height);
  const box = soliBox();
  const x0 = box.left - 10;
  const x1 = box.left + box.width + 10;
  const y0 = box.top - 4;
  const y1 = SOLI_FOOT_Y + 5;
  const s = fit.scale;
  const hitW = (x1 - x0) * s;
  const hitH = (y1 - y0) * s;
  const top = fit.top - lift + y0 * s;
  return {
    left: round1(fit.left + x0 * s),
    bottom: round1(height - (top + hitH)),
    width: round1(hitW),
    height: round1(hitH),
    badgeLeft: round1(hitW - 25 * s - SOLI_BADGE_SIZE / 2),
    badgeTop: round1(hitH - 24 * s - SOLI_BADGE_SIZE / 2),
  };
}

/** 장면 좌표(390×844)의 사각형 → 화면 좌표. lift = 장면을 올린 만큼 */
export function sceneRect(width: number, height: number, lift: number, r: { x0: number; y0: number; x1: number; y1: number }) {
  const fit = sceneFit(width, height);
  return {
    left: round1(fit.left + r.x0 * fit.scale),
    top: round1(fit.top - lift + r.y0 * fit.scale),
    width: round1((r.x1 - r.x0) * fit.scale),
    height: round1((r.y1 - r.y0) * fit.scale),
  };
}

/** 하단 탭 바: 높이 64, 바깥 여백 위 6 · 좌우 12 · 아래 14 (+ 아래 안전 영역) */
export const TAB_BAR = { height: 64, marginTop: 6, marginSide: 12, marginBottom: 14 } as const;

/** 탭 바가 화면 아래에서 차지하는 높이 */
export const tabBarSpace = (insetBottom: number) => TAB_BAR.marginTop + TAB_BAR.height + TAB_BAR.marginBottom + insetBottom;

/** 메인 위쪽 구성 (HUD · 방송띠) 수치 */
export const MAIN_HUD = {
  /** 상태바 아래 바깥 여백 */
  top: 2,
  side: 12,
  /** 방송띠: HUD 아래 위 여백, 접힘 높이 */
  broadcastGap: 8,
  broadcastClosed: 42,
  /** 오늘 기록하기 */
  cta: { height: 56, marginTop: 12, side: 16 },
  wallet: { height: 44, radius: 22 },
} as const;

// ── 밭 · 기록 버튼 · 탭 바와 겹치지 않게 장면 올리기 ─────────────
/** 밭 5칸 아랫변이 화면 아래에서 떨어진 거리(장면 좌표): 844 − 700 */
export const PLOT_BOTTOM_FROM_BOTTOM = 144;
/** 밭 아랫변과 기록 버튼 윗변 사이 최소 간격 */
export const PLOT_GAP = 6;

/**
 * 장면을 화면 아래에서 얼마나 올릴까. 밭 아랫변이 "기록 버튼 윗변 + 간격" 아래로 내려가지 않게 한다.
 * (아래 안전 영역이 있거나 폭이 좁아 배율이 작으면 밭이 버튼에 가려지므로 그만큼 장면을 올린다.)
 */
export function sceneLift(width: number, insetBottom: number): number {
  const s = width / SCENE_DESIGN.width;
  const need = tabBarSpace(insetBottom) + MAIN_HUD.cta.height + PLOT_GAP;
  return Math.max(0, round1(need - PLOT_BOTTOM_FROM_BOTTOM * s));
}
