// 새 메인(디자인 TURN 30)의 장면 맞춤 · 솔이 누르는 영역. 순수 계산이라 단위 테스트한다 (RN import 없음).
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

/** 시안 hL/hB/hW/hH/bL/bT 계산 그대로 (390×844 기준 가로 230 × 세로 228, 화면에 비례해 늘린다) */
export function soliHit(width: number, height: number): SoliHit {
  const s = width / SCENE_DESIGN.width;
  const x = (v: number) => v * s;
  const b = (v: number) => (SCENE_DESIGN.height - v) * s;
  return {
    left: round1(x(95)),
    bottom: round1(b(628)),
    width: round1(230 * s),
    height: round1(228 * s),
    badgeLeft: round1(205 * s - SOLI_BADGE_SIZE / 2),
    badgeTop: round1(204 * s - SOLI_BADGE_SIZE / 2),
  };
}

const round1 = (v: number) => Math.round(v * 10) / 10;

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
