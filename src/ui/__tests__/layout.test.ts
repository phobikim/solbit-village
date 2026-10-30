import { APP_MAX_WIDTH, contentWidth, morningDayLayout, SCENE_PCT, SCENE_RATIO, SCENE_VIEW, sceneHeight, sx, sy } from '../layout';

const W390 = contentWidth(390); // 358
const W375 = contentWidth(375); // 343
const W430 = contentWidth(430); // 398

describe('마을 장면 4:3 고정', () => {
  it('너비 = 콘텐츠 영역 전체(좌우 16), 높이 = 너비 × 3/4', () => {
    expect(W390).toBe(390 - 32);
    expect(W375).toBe(375 - 32);
    expect(sceneHeight(358)).toBeCloseTo(268.5);
    expect(SCENE_RATIO).toBe(0.75);
    expect(SCENE_VIEW.height / SCENE_VIEW.width).toBe(0.75);
  });

  it('웹 앱 틀 최대 너비(430)를 넘는 창에서는 430 기준', () => {
    expect(contentWidth(1600)).toBe(APP_MAX_WIDTH - 32);
    expect(contentWidth(430)).toBe(398);
  });

  it('장면 비율은 너비의 3/4', () => {
    for (const w of [W375, W390, W430]) expect(sceneHeight(w)).toBeCloseTo(w * 0.75, 1);
  });
});

describe('장면 안 % 좌표 (SPEC 11장)', () => {
  it('하늘 0~35 / 원경 28~48 / 땅 52', () => {
    expect(SCENE_PCT.sky).toEqual({ top: 0, bottom: 35 });
    expect(SCENE_PCT.far).toEqual({ top: 28, bottom: 48 });
    expect(SCENE_PCT.groundTop).toBe(52);
  });
  it('집 x 4~30 · 게시판 x 32~56 · 냇가 x 60~96 y 52~62, 집 · 게시판 바닥 60', () => {
    expect(SCENE_PCT.house).toEqual({ x0: 4, x1: 30, bottom: 60 });
    expect(SCENE_PCT.board).toEqual({ x0: 32, x1: 56, bottom: 60 });
    expect(SCENE_PCT.creek).toEqual({ x0: 60, x1: 96, y0: 52, y1: 62 });
  });
  it('솔이 가운데 바닥 96 너비 30 / 이웃 18 · 82 바닥 94 너비 16', () => {
    expect(SCENE_PCT.soli).toEqual({ cx: 50, bottom: 96, width: 30 });
    expect(SCENE_PCT.neighbors).toEqual({ cx: [18, 82], bottom: 94, width: 16 });
  });
  it('겹치지 않는다: 집 | 게시판 | 냇가가 가로로 나란히, 솔이 · 이웃도 장면 안', () => {
    expect(SCENE_PCT.house.x1).toBeLessThan(SCENE_PCT.board.x0);
    expect(SCENE_PCT.board.x1).toBeLessThan(SCENE_PCT.creek.x0);
    const s = SCENE_PCT.soli;
    expect(s.cx - s.width / 2).toBeGreaterThanOrEqual(0);
    expect(s.cx + s.width / 2).toBeLessThanOrEqual(100);
    for (const cx of SCENE_PCT.neighbors.cx) {
      expect(cx - SCENE_PCT.neighbors.width / 2).toBeGreaterThanOrEqual(0);
      expect(cx + SCENE_PCT.neighbors.width / 2).toBeLessThanOrEqual(100);
    }
    // 이웃과 솔이도 가로로 안 겹친다
    expect(SCENE_PCT.neighbors.cx[0] + SCENE_PCT.neighbors.width / 2).toBeLessThanOrEqual(s.cx - s.width / 2);
    expect(SCENE_PCT.neighbors.cx[1] - SCENE_PCT.neighbors.width / 2).toBeGreaterThanOrEqual(s.cx + s.width / 2);
  });
  it('% → 장면 좌표', () => {
    expect(sx(50)).toBe(200);
    expect(sy(50)).toBe(150);
    expect(sy(96)).toBeCloseTo(288);
  });
});

describe('morningDayLayout (오늘 하루 고르기)', () => {
  it('키 큰 화면은 장면 318, 카드 기본 150', () => {
    const L = morningDayLayout(932, 59, 34);
    expect(L).toMatchObject({ step: 0, scene: 318, dayCard: 150, scroll: false });
  });
  it('보통 화면은 장면이 줄어들고 스크롤 없음', () => {
    const L = morningDayLayout(852, 59, 34);
    expect(L).toMatchObject({ step: 0, scroll: false });
    expect(L.scene).toBeGreaterThanOrEqual(220);
    expect(L.scene).toBeLessThanOrEqual(318);
  });
  it('작은 화면은 카드를 압축', () => {
    const L = morningDayLayout(700, 20, 0);
    expect(L.step).toBe(1);
    expect(L.dayCard).toBe(124);
    expect(L.scene).toBeGreaterThanOrEqual(170);
  });
  it('아주 작으면 스크롤', () => {
    const L = morningDayLayout(560, 20, 0);
    expect(L).toMatchObject({ step: 2, scene: 170, scroll: true });
  });
  it('들어가는 화면에서는 내용 높이가 사용 가능 높이를 넘지 않는다', () => {
    for (const h of [667, 700, 740, 780, 852, 932]) {
      const L = morningDayLayout(h, 20, 0);
      if (L.scroll) continue;
      const used = L.scene + L.dayCard + 50 + 68 + 12 + 14 + 30 + 8 + 52 + 12 + 56 + 6 + 28 + 6;
      expect(used).toBeLessThanOrEqual(L.available);
    }
  });
});
