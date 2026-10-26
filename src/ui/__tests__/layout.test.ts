import {
  DEFAULT_SCENE_GEOMETRY,
  mainLayout,
  MAIN_LAYOUT,
  SCENE_GROUND_UNITS,
  SCENE_MIN_HEIGHT,
  SCENE_MIN_RATIO,
  SCENE_SKY_MIN,
  sceneGeometry,
} from '../layout';

const sum = (l: ReturnType<typeof mainLayout>) =>
  l.header + l.broadcast + l.indices + l.cta + l.gap * MAIN_LAYOUT.gapCount + l.scene;

describe('메인 레이아웃: 화면 높이 비율', () => {
  it('고정 요소 + 장면 = 사용 가능 높이 (스크롤 없음)', () => {
    for (const [h, top, bottom] of [
      [667, 20, 0], // SE
      [844, 47, 34],
      [932, 59, 34],
      [736, 20, 0],
      [812, 44, 34],
    ] as const) {
      const l = mainLayout(h, top, bottom);
      expect(l.available).toBe(h - top - (MAIN_LAYOUT.tabBar + bottom));
      expect(sum(l)).toBe(l.available);
    }
  });

  it('여유 있는 화면은 기본 크기 (844 · 932)', () => {
    for (const [h, top, bottom] of [[844, 47, 34], [932, 59, 34]] as const) {
      const l = mainLayout(h, top, bottom);
      expect(l).toMatchObject({
        step: 0,
        header: 76,
        showTagline: true,
        broadcast: 68,
        broadcastLines: 2,
        indices: 96,
        indicesCompact: false,
        cta: 56,
        gap: 10,
      });
      expect(l.sceneRatio).toBeGreaterThanOrEqual(SCENE_MIN_RATIO);
    }
  });

  it('장면은 남는 높이 전부 — 화면이 높을수록 장면만 커진다', () => {
    const a = mainLayout(844, 47, 34);
    const b = mainLayout(932, 59, 34);
    expect(b.header).toBe(a.header);
    expect(b.cta).toBe(a.cta);
    expect(b.scene - a.scene).toBe(b.available - a.available);
  });

  it('1단계: 장면이 40% 미만이면 방송 1줄(44) + 지수 압축(64)', () => {
    // 기본이면 40%가 안 되는 높이: 336 고정 → 장면 < 0.4 × 사용 가능
    const l = mainLayout(667 + 40, 20, 0); // available 611, 기본 장면 275 (45%) → 아직 기본
    expect(l.step).toBe(0);
    const tight = mainLayout(570, 20, 0); // available 474: 기본 장면 138 (29%)
    expect(tight.step).toBeGreaterThanOrEqual(1);
    expect(tight.broadcast).toBe(44);
    expect(tight.broadcastLines).toBe(1);
    expect(tight.indices).toBe(64);
    expect(tight.indicesCompact).toBe(true);
  });

  it('1단계에서 40%를 채우면 헤더 · 간격 · 기록 버튼은 그대로', () => {
    // 고정 합(1단계) = 76 + 44 + 64 + 56 + 40 = 280 → 장면 ≥ 0.4 × available ⇔ available ≥ 466.7
    const l = mainLayout(467 + 20 + 76, 20, 0);
    expect(l.step).toBe(1);
    expect(l).toMatchObject({ header: 76, showTagline: true, gap: 10, cta: 56 });
    expect(l.sceneRatio).toBeGreaterThanOrEqual(SCENE_MIN_RATIO);
  });

  it('2단계: 그래도 부족하면 헤더 부제 숨김(60) + 간격 8 (기록 버튼 52)', () => {
    // 2단계 고정 합 = 60 + 44 + 64 + 52 + 32 = 252 → available ≥ 420
    const l = mainLayout(430 + 20 + 76, 20, 0);
    expect(l.step).toBe(2);
    expect(l).toMatchObject({ header: 60, showTagline: false, gap: 8, cta: 52, broadcast: 44, indices: 64 });
    expect(l.sceneRatio).toBeGreaterThanOrEqual(SCENE_MIN_RATIO);
  });

  it('3단계: 아주 작은 화면은 장면 최소 220을 지킨다', () => {
    const l = mainLayout(420, 20, 0); // available 324
    expect(l.step).toBe(3);
    expect(l.scene).toBeGreaterThanOrEqual(SCENE_MIN_HEIGHT);
  });

  it('지수 카드 영역은 항상 있고 최소 64', () => {
    for (let h = 400; h <= 1000; h += 20) expect(mainLayout(h, 20, 0).indices).toBeGreaterThanOrEqual(64);
  });

  it('압축은 높이가 줄수록 단계가 오르기만 한다 (되돌아가지 않는다)', () => {
    let prev = 0;
    for (let h = 1000; h >= 480; h -= 4) {
      const step = mainLayout(h, 20, 0).step;
      expect(step).toBeGreaterThanOrEqual(prev);
      prev = step;
    }
  });
});

describe('장면 기하: 땅은 너비 기준, 늘어나는 높이는 하늘만', () => {
  it('원본 크기 그대로면 기본값과 같다', () => {
    const g = sceneGeometry(366, 340);
    expect(g.k).toBeCloseTo(1);
    expect(g.viewBox.y).toBeCloseTo(0);
    expect(g.skyUnits).toBeCloseTo(DEFAULT_SCENE_GEOMETRY.skyUnits);
  });

  it('칸이 높아지면 배율은 그대로, 하늘만 늘어난다', () => {
    const a = sceneGeometry(342, 300);
    const b = sceneGeometry(342, 500);
    expect(b.k).toBeCloseTo(a.k);
    expect(b.k).toBeCloseTo(342 / 366);
    expect(b.skyPx - a.skyPx).toBeCloseTo(200);
    // 땅 층 높이(pt)는 같다
    expect(SCENE_GROUND_UNITS * b.k).toBeCloseTo(SCENE_GROUND_UNITS * a.k);
  });

  it('바닥은 늘 viewBox 아래 끝 (아래 정렬)', () => {
    for (const [w, h] of [[342, 240], [342, 420], [400, 700], [342, 220]] as const) {
      const g = sceneGeometry(w, h);
      expect(g.viewBox.y + g.viewBox.height).toBeCloseTo(340);
    }
  });

  it('칸이 낮아지면 하늘이 먼저 줄고 최소 40pt를 남긴다', () => {
    const w = 342;
    const k = w / 366;
    const groundPx = SCENE_GROUND_UNITS * k; // ≈ 238
    const g = sceneGeometry(w, groundPx + 60);
    expect(g.k).toBeCloseTo(k);
    expect(g.skyPx).toBeCloseTo(60);
    const min = sceneGeometry(w, groundPx + SCENE_SKY_MIN);
    expect(min.k).toBeCloseTo(k);
    expect(min.skyPx).toBeCloseTo(SCENE_SKY_MIN);
  });

  it('하늘 40pt로도 모자라면 땅 배율을 줄여 땅이 잘리지 않게 하고, 하늘은 40pt', () => {
    const w = 342;
    const g = sceneGeometry(w, 220);
    expect(g.k).toBeLessThan(w / 366);
    expect(g.skyPx).toBeCloseTo(SCENE_SKY_MIN);
    // 그림 가로는 칸보다 넓어지고(땅이 양옆으로 이어짐) 가운데 정렬
    expect(g.viewBox.width).toBeGreaterThan(366);
    expect(g.viewBox.x + g.viewBox.width / 2).toBeCloseTo(183);
  });

  it('메인 3단계 최소 장면(220)에서도 땅이 다 보인다', () => {
    const g = sceneGeometry(342, SCENE_MIN_HEIGHT);
    expect(g.viewBox.height * g.k).toBeCloseTo(SCENE_MIN_HEIGHT);
    expect(g.viewBox.y).toBeLessThan(85); // 게시판 · 오두막(y 86~)이 잘리지 않는다
  });
});
