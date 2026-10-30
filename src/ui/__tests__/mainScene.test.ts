import { MAIN_HUD, sceneFit, soliHit, tabBarSpace } from '../mainScene';

describe('메인 장면 맞춤 (xMidYMax slice)', () => {
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

describe('솔이 누르는 영역 (시안 hL/hB/hW/hH)', () => {
  it('390×844: 가로 230 × 세로 228, 왼쪽 95, 바닥 216', () => {
    expect(soliHit(390, 844)).toMatchObject({ left: 95, bottom: 216, width: 230, height: 228, badgeLeft: 191, badgeTop: 190 });
  });
  it('375×667: s = 375/390 에 비례', () => {
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
