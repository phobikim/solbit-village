import { APP_MAX_WIDTH, contentWidth, MAIN_LAYOUT, mainLayout, morningDayLayout, outfitLayout, SCENE_PCT, SCENE_RATIO, SCENE_VIEW, sceneHeight, sx, sy } from '../layout';

const M = MAIN_LAYOUT;
const W390 = contentWidth(390); // 358
const W375 = contentWidth(375); // 343
const W430 = contentWidth(430); // 398

/** 보이는 높이 = 사용 가능 높이 + 탭 바 (안전 영역 0) */
const visible = (available: number) => available + M.tabBar;

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

  it('장면 비율은 어느 높이 · 어느 단계에서도 바뀌지 않는다', () => {
    for (let h = 300; h <= 1100; h += 7) {
      for (const w of [W375, W390, W430]) {
        const l = mainLayout(h, 20, 0, w);
        expect(l.scene).toBeCloseTo(w * 0.75, 1);
        expect(l.sceneWidth).toBe(w);
      }
    }
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

describe('메인 압축 단계', () => {
  const fixed = (l: ReturnType<typeof mainLayout>) =>
    l.header + l.broadcast + l.indices + l.field + l.cta + l.gap * M.gapCount;

  it('헤더는 64 고정 (부제 없음)', () => {
    for (let h = 400; h <= 1000; h += 40) expect(mainLayout(h, 20, 0, W390).header).toBe(64);
  });

  it('0단계(기본): 지수 96 · 방송 2줄 · 밭 띠 72(글자 있음) · 기록 56 · 간격 10', () => {
    const l = mainLayout(844, 0, 0, W390);
    expect(l).toMatchObject({ step: 0, broadcast: 68, broadcastLines: 2, indices: 96, indexVariant: 'full', field: 72, fieldLabels: true, cta: 56, gap: 10, scroll: false });
    expect(l.content).toBeLessThanOrEqual(l.available);
  });

  // 390 너비: 장면 268.5 → 단계별 고정 합 406 / 382 / 314 / 300
  it('1단계: 지수 문구 제거 (96 → 72)', () => {
    const l = mainLayout(visible(670), 0, 0, W390); // 0단계는 674.5 필요
    expect(l.step).toBe(1);
    expect(l).toMatchObject({ indices: 72, indexVariant: 'ring', broadcast: 68, broadcastLines: 2, field: 72, fieldLabels: true, cta: 56, gap: 10 });
  });

  it('2단계: 방송 1줄 + 지수 한 줄 띠(44) + 밭 띠 56(글자 숨김)', () => {
    const l = mainLayout(visible(640), 0, 0, W390); // 1단계는 650.5 필요
    expect(l.step).toBe(2);
    expect(l).toMatchObject({ indices: 44, indexVariant: 'strip', broadcast: 44, broadcastLines: 1, field: 56, fieldLabels: false, cta: 56, gap: 10 });
  });

  it('3단계: 간격 8, 기록 버튼 52', () => {
    const l = mainLayout(visible(575), 0, 0, W390); // 2단계는 582.5 필요
    expect(l.step).toBe(3);
    expect(l).toMatchObject({ indices: 44, field: 56, cta: 52, gap: 8, scroll: false });
    expect(l.content).toBeLessThanOrEqual(l.available);
  });

  it('4단계: 그래도 안 들어가면 메인 스크롤 허용 (크기는 3단계와 같고, 탭 바는 고정)', () => {
    const l = mainLayout(visible(560), 0, 0, W390);
    const three = mainLayout(visible(575), 0, 0, W390);
    expect(l.step).toBe(4);
    expect(l.scroll).toBe(true);
    expect({ ...l, step: 3, available: 0, scroll: false }).toEqual({ ...three, available: 0 });
    expect(l.content).toBeGreaterThan(l.available);
    expect(MAIN_LAYOUT.tabBar).toBe(76);
    expect(l.available).toBe(560); // 탭 바(76)는 사용 가능 높이에서 이미 뺐다
  });

  it('고정 합 + 장면 = 콘텐츠 높이, 4단계 전에는 사용 가능 높이 안에 들어간다', () => {
    for (let h = 400; h <= 1000; h += 3) {
      for (const w of [W375, W390, W430]) {
        const l = mainLayout(h, 20, 0, w);
        expect(l.content).toBeCloseTo(fixed(l) + l.scene, 5);
        if (!l.scroll) expect(l.content).toBeLessThanOrEqual(l.available + 1e-9);
        else expect(l.content).toBeGreaterThan(l.available);
      }
    }
  });

  it('높이가 줄수록 단계가 오르기만 한다 (되돌아가지 않는다)', () => {
    for (const w of [W375, W390, W430]) {
      let prev = 0;
      for (let h = 1100; h >= 400; h -= 2) {
        const step = mainLayout(h, 20, 0, w).step;
        expect(step).toBeGreaterThanOrEqual(prev);
        prev = step;
      }
    }
  });

  it('안전 영역은 사용 가능 높이에서 빠진다', () => {
    const l = mainLayout(844, 47, 34, W390);
    expect(l.available).toBe(844 - 47 - M.tabBar - 34);
  });

  it('요청한 다섯 크기(웹, 안전 영역 0)의 단계', () => {
    const step = (w: number, h: number) => mainLayout(h, 0, 0, contentWidth(w)).step;
    expect(step(375, 560)).toBe(4);
    expect(step(390, 660)).toBe(2);
    expect(step(375, 667)).toBe(2);
    expect(step(390, 844)).toBe(0);
    expect(step(430, 932)).toBe(0);
  });
});

describe('morningDayLayout (오늘 하루 고르기)', () => {
  it('키 큰 화면은 장면 300, 카드 기본', () => {
    const L = morningDayLayout(932, 59, 34);
    expect(L).toMatchObject({ step: 0, scene: 300, dayCard: 88, condCard: 78, scroll: false });
  });
  it('보통 화면은 장면이 줄어들고 스크롤 없음', () => {
    const L = morningDayLayout(852, 59, 34);
    expect(L.scroll).toBe(false);
    expect(L.scene).toBeGreaterThanOrEqual(180);
    expect(L.scene).toBeLessThanOrEqual(300);
  });
  it('작은 화면은 카드를 압축', () => {
    const L = morningDayLayout(700, 20, 0);
    expect(L.step).toBe(1);
    expect(L.dayCard).toBe(72);
    expect(L.condCard).toBe(64);
  });
  it('아주 작으면 스크롤', () => {
    const L = morningDayLayout(560, 20, 0);
    expect(L).toMatchObject({ step: 2, scene: 180, scroll: true });
  });
  it('들어가는 화면에서는 내용 높이가 사용 가능 높이를 넘지 않는다', () => {
    for (const h of [667, 700, 740, 780, 852, 932]) {
      const L = morningDayLayout(h, 20, 0);
      if (L.scroll) continue;
      const used = L.scene + L.dayCard + L.condCard + 50 + 68 + 12 + 16 + 30 + 14 + 30 + 14 + 56 + 6 + 28 + 6;
      expect(used).toBeLessThanOrEqual(L.available);
    }
  });
});

describe('outfitLayout (복장 고르기)', () => {
  it('키 큰 화면은 미리보기 250, 탭 · 칸 기본, 스크롤 없음', () => {
    expect(outfitLayout(932, 59, 34)).toMatchObject({ step: 0, preview: 250, tab: 52, cell: 76, scroll: false });
  });
  it('보통 화면(852)도 기본 크기로 들어간다', () => {
    const L = outfitLayout(852, 59, 34);
    expect(L.step).toBe(0);
    expect(L.preview).toBeGreaterThanOrEqual(210);
    expect(L.scroll).toBe(false);
  });
  it('작은 화면은 탭 · 칸을 압축', () => {
    const L = outfitLayout(667, 20, 0);
    expect(L).toMatchObject({ step: 1, tab: 46, cell: 62, scroll: false });
    expect(L.preview).toBeGreaterThanOrEqual(150);
  });
  it('아주 작으면 스크롤', () => {
    expect(outfitLayout(520, 20, 0)).toMatchObject({ step: 2, preview: 150, scroll: true });
  });
  it('칸은 어느 단계에서도 터치 영역 44 이상', () => {
    for (const h of [480, 560, 667, 740, 852, 932]) expect(outfitLayout(h, 20, 0).cell).toBeGreaterThanOrEqual(44);
  });
  it('들어가는 화면에서는 내용 높이가 사용 가능 높이를 넘지 않는다', () => {
    for (const h of [640, 667, 700, 740, 780, 852, 932]) {
      const L = outfitLayout(h, 20, 0);
      if (L.scroll) continue;
      const used = L.preview + L.tab + L.cell * 2 + 50 + 68 + 10 + 12 + 12 + 10 + 8 + 12 + 5 + 8 + 22 + 8 + 56 + 20;
      expect(used).toBeLessThanOrEqual(L.available);
    }
  });
});
