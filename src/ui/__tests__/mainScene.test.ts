import { PLOT } from '../scene/art';
import { SCENE_PCT } from '../layout';
import {
  MAIN_HUD,
  PLOT_GAP,
  sceneFit,
  sceneLift,
  sceneRect,
  SOLI_BOB,
  SOLI_CENTER_X,
  SOLI_FOOT_Y,
  SOLI_SCALE,
  soliBox,
  soliHit,
  soliShadow,
  tabBarSpace,
} from '../mainScene';

describe('메인 장면 맞춤 (가로 기준)', () => {
  it('390×844는 배율 1, 어긋남 없음', () => {
    expect(sceneFit(390, 844)).toEqual({ scale: 1, left: 0, top: 0 });
  });
  it('작은 화면 375×667은 가로에 맞춰 줄이고 위가 잘린다', () => {
    const f = sceneFit(375, 667);
    expect(f.scale).toBeCloseTo(375 / 390, 5);
    expect(f.top).toBeCloseTo(667 - 844 * f.scale, 5);
    expect(f.top).toBeLessThan(0);
  });
  it('세로로 긴 화면도 가로 기준이라 배경이 더 커지지 않고, 위는 바탕색이 채운다', () => {
    const f = sceneFit(360, 900);
    expect(f.scale).toBeCloseTo(360 / 390, 5);
    expect(f.left).toBeCloseTo(0, 5);
    expect(f.top).toBeGreaterThan(0);
  });
  it('가로는 늘 꽉 차고 아래는 화면 바닥에 붙는다', () => {
    for (const [w, h] of [[320, 568], [375, 667], [390, 844], [430, 932], [430, 600]]) {
      const f = sceneFit(w, h);
      expect(f.left).toBeCloseTo(0, 5);
      expect(f.top + 844 * f.scale).toBeCloseTo(h, 5);
    }
  });
});

describe('솔이 크기 · 자리 (SOLI_SCALE 하나에서 계산)', () => {
  it('v11 크기 1.364배 (v12의 1.9배는 너무 컸다)', () => {
    expect(SOLI_SCALE).toBe(1.364);
    expect(SOLI_BOB.unit).toBe(SOLI_SCALE);
  });
  it('가로 중앙(195)과 발(y≈623)은 그대로, 상자는 SOLI_SCALE에 비례해 줄었다', () => {
    const b = soliBox();
    expect(b.left + b.width / 2).toBeCloseTo(SOLI_CENTER_X, 0);
    expect(b.width).toBeCloseTo(110 * 1.364, 1);
    expect(b.height).toBeCloseTo(b.width * 1.2, 1);
    // 발 기준선은 포즈 캔버스 아래에서 12 → 상자 높이의 95% 지점
    expect(b.top + b.height * 0.95).toBeCloseTo(SOLI_FOOT_Y, 0);
    expect(soliBox(1.9).width).toBeGreaterThan(b.width);
  });
  it('그림자 폭도 배율을 따른다', () => {
    expect(soliShadow(1.9).rx).toBeGreaterThan(soliShadow().rx);
    expect(soliShadow().cy).toBeLessThan(SOLI_FOOT_Y);
  });
});

describe('솔이 누르는 영역 · 옷걸이 배지', () => {
  it('390×844: 솔이 상자 둘레 (좌우 10 · 위 4 · 발 아래 5)', () => {
    const b = soliBox();
    const h = soliHit(390, 844);
    expect(h.left).toBeCloseTo(b.left - 10, 1);
    expect(h.width).toBeCloseTo(b.width + 20, 1);
    expect(h.height).toBeCloseTo(SOLI_FOOT_Y + 5 - (b.top - 4), 1);
    expect(h.bottom).toBeCloseTo(844 - (SOLI_FOOT_Y + 5), 1);
  });
  it('배지는 누르는 영역 오른쪽 아래 안쪽에 있다', () => {
    const h = soliHit(390, 844);
    expect(h.badgeLeft).toBeGreaterThan(h.width / 2);
    expect(h.badgeLeft + 28).toBeLessThanOrEqual(h.width);
    expect(h.badgeTop + 28).toBeLessThanOrEqual(h.height);
  });
  it('375×667: 가로 배율(375/390)에 비례', () => {
    const s = 375 / 390;
    const b = soliBox();
    const h = soliHit(375, 667);
    expect(h.width).toBeCloseTo((b.width + 20) * s, 1);
    expect(h.height).toBeCloseTo((SOLI_FOOT_Y + 5 - (b.top - 4)) * s, 1);
  });
  it('장면을 올리면 누르는 영역도 같이 올라간다', () => {
    expect(soliHit(390, 844, 30).bottom).toBeCloseTo(soliHit(390, 844, 0).bottom + 30, 1);
  });
});

describe('밭 · 기록 버튼 · 탭 바와 겹치지 않게 장면 올리기', () => {
  const plotBottomFromBottom = (w: number, inset: number) => {
    const s = w / 390;
    return (844 - (PLOT.y + PLOT.height)) * s + sceneLift(w, inset);
  };
  const ctaTopFromBottom = (inset: number) => tabBarSpace(inset) + MAIN_HUD.cta.height;

  it('밭 아랫변은 어떤 폭 · 안전 영역에서도 기록 버튼 윗변 + 간격보다 위에 있다', () => {
    for (const w of [320, 360, 375, 390, 414, 430]) {
      for (const inset of [0, 20, 34]) {
        expect(plotBottomFromBottom(w, inset)).toBeGreaterThanOrEqual(ctaTopFromBottom(inset) + PLOT_GAP - 0.1);
      }
    }
  });
  it('390 폭 · 안전 영역 34에서도 간격이 작게만 올라간다 (이미 충분하면 0)', () => {
    expect(sceneLift(390, 0)).toBeLessThanOrEqual(PLOT_GAP);
    expect(sceneLift(390, 34)).toBeLessThanOrEqual(40);
    expect(sceneLift(430, 0)).toBe(0);
  });
});

describe('뒤 줄 · 이웃 배치 (SCENE_PCT 한 곳)', () => {
  const yPx = (pct: number) => (844 * pct) / 100;
  const soli = soliBox();

  it('집 · 게시판 · 냇가는 SPEC 11 가로 비율이고 서로 겹치지 않는다', () => {
    expect(SCENE_PCT.house).toMatchObject({ x0: 4, x1: 30 });
    expect(SCENE_PCT.board).toMatchObject({ x0: 32, x1: 56 });
    expect(SCENE_PCT.creek).toMatchObject({ x0: 60, x1: 96 });
    expect(SCENE_PCT.house.x1).toBeLessThan(SCENE_PCT.board.x0);
    expect(SCENE_PCT.board.x1).toBeLessThan(SCENE_PCT.creek.x0);
  });
  it('뒤 줄 바닥선은 y≈470, 솔이 머리(상자 위쪽)보다 위다', () => {
    for (const k of ['house', 'board', 'creek'] as const) {
      expect(yPx(SCENE_PCT[k].bottom)).toBeCloseTo(470, 0);
      expect(yPx(SCENE_PCT[k].bottom)).toBeLessThanOrEqual(soli.top + 20);
    }
  });
  it('이웃은 솔이 좌우 마당에 있고 솔이와 가로로 겹치지 않으며, 발 높이가 솔이와 비슷하다', () => {
    const w = 390 * (SCENE_PCT.neighbors.width / 100);
    const [a, b] = SCENE_PCT.neighbors.cx.map((c) => (390 * c) / 100);
    expect(a + w / 2).toBeLessThanOrEqual(soli.left);
    expect(b - w / 2).toBeGreaterThanOrEqual(soli.left + soli.width);
    expect(Math.abs(yPx(SCENE_PCT.neighbors.bottom) - SOLI_FOOT_Y)).toBeLessThanOrEqual(2);
  });
  it('뒤 줄 · 이웃은 밭(y 648~) 위에 있다', () => {
    expect(yPx(SCENE_PCT.neighbors.bottom)).toBeLessThan(PLOT.y);
  });
  it('게시판 누르는 영역은 게시판 가로 범위 안', () => {
    expect(SCENE_PCT.boardHit.x0).toBe(SCENE_PCT.board.x0);
    expect(SCENE_PCT.boardHit.x1).toBe(SCENE_PCT.board.x1);
    const r = sceneRect(390, 844, 0, { x0: 0, y0: 100, x1: 39, y1: 200 });
    expect(r).toEqual({ left: 0, top: 100, width: 39, height: 100 });
  });
});

describe('탭 바', () => {
  it('높이 64 + 여백 6/14 + 아래 안전 영역', () => {
    expect(tabBarSpace(0)).toBe(84);
    expect(tabBarSpace(34)).toBe(118);
    expect(MAIN_HUD.broadcastClosed).toBe(42);
  });
});
