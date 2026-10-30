// 새 메인(디자인 TURN 30)의 장면 맞춤 · 솔이 누르는 영역. 순수 계산이라 단위 테스트한다 (RN import 없음).
// 장면은 390×844 좌표계를 xMidYMax slice로 깔아서 어떤 화면비에서도 화면을 꽉 채운다 (가로나 세로 중 더 모자란 쪽에 맞추고, 남는 쪽은 잘린다).

export const SCENE_DESIGN = { width: 390, height: 844 } as const;

export type SceneFit = {
  /** 배율 = max(w/390, h/844) */
  scale: number;
  /** 화면 안에서 장면 왼쪽 위 (가로는 가운데 맞춤, 세로는 아래 맞춤이라 음수일 수 있다) */
  left: number;
  top: number;
};

export function sceneFit(width: number, height: number): SceneFit {
  const scale = Math.max(width / SCENE_DESIGN.width, height / SCENE_DESIGN.height);
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
  const s = Math.max(width / SCENE_DESIGN.width, height / SCENE_DESIGN.height);
  const x = (v: number) => v * s - (SCENE_DESIGN.width * s - width) / 2;
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
