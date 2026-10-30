import { MAIN_HUD, sceneFit, soliHit, tabBarSpace } from '../mainScene';

describe('메인 장면 맞춤 (xMidYMax slice)', () => {
  it('390×844는 배율 1, 어긋남 없음', () => {
    expect(sceneFit(390, 844)).toEqual({ scale: 1, left: 0, top: 0 });
  });
  it('작은 화면 375×667은 가로에 맞추지 않고 큰 쪽 배율 — s = max(w/390, h/844)', () => {
    const f = sceneFit(375, 667);
    expect(f.scale).toBeCloseTo(375 / 390, 5);
    expect(f.top).toBeCloseTo(667 - 844 * f.scale, 5);
    expect(f.top).toBeLessThan(0);
  });
  it('세로로 긴 화면은 높이에 맞추고 가로는 가운데로 잘린다', () => {
    const f = sceneFit(360, 900);
    expect(f.scale).toBeCloseTo(900 / 844, 5);
    expect(f.left).toBeLessThan(0);
    expect(f.top).toBeCloseTo(0, 5);
  });
  it('장면은 어떤 화면비에서도 화면을 다 덮는다', () => {
    for (const [w, h] of [[320, 568], [375, 667], [390, 844], [430, 932], [430, 600]]) {
      const f = sceneFit(w, h);
      expect(f.left).toBeLessThanOrEqual(0.001);
      expect(f.top).toBeLessThanOrEqual(0.001);
      expect(f.left + 390 * f.scale).toBeGreaterThanOrEqual(w - 0.001);
      expect(f.top + 844 * f.scale).toBeGreaterThanOrEqual(h - 0.001);
    }
  });
});

describe('솔이 누르는 영역 (시안 hL/hB/hW/hH)', () => {
  it('390×844: 가로 230 × 세로 228, 왼쪽 95, 바닥 216', () => {
    expect(soliHit(390, 844)).toMatchObject({ left: 95, bottom: 216, width: 230, height: 228, badgeLeft: 191, badgeTop: 190 });
  });
  it('375×667: s = max(375/390, 667/844) 에 비례', () => {
    const s = 375 / 390;
    const h = soliHit(375, 667);
    expect(h.width).toBeCloseTo(230 * s, 1);
    expect(h.height).toBeCloseTo(228 * s, 1);
    expect(h.badgeLeft).toBeCloseTo(205 * s - 14, 1);
  });
});

describe('탭 바', () => {
  it('높이 64 + 여백 6/14 + 아래 안전 영역', () => {
    expect(tabBarSpace(0)).toBe(84);
    expect(tabBarSpace(34)).toBe(118);
    expect(MAIN_HUD.broadcastClosed).toBe(42);
  });
});
