import {
  DEFAULT_SCENE_GEOMETRY,
  mainLayout,
  MAIN_LAYOUT,
  SCENE_GROUND_TOP,
  SCENE_GROUND_UNITS,
  SCENE_MIN_HEIGHT,
  SCENE_MIN_RATIO,
  SCENE_SKY_MIN,
  SCENE_UNITS,
  sceneGeometry,
  skyFit,
} from '../layout';

const sum = (l: ReturnType<typeof mainLayout>) =>
  l.header + l.broadcast + l.indices + l.cta + l.gap * MAIN_LAYOUT.gapCount + l.scene;

/** 사용 가능 높이 a가 되는 보이는 높이 (위 안전 영역 20, 아래 0) */
const visible = (a: number) => a + 20 + MAIN_LAYOUT.tabBar;

describe('메인 레이아웃: 화면 높이 비율', () => {
  it('고정 요소 + 장면 = 사용 가능 높이 (스크롤 없음) — 3단계까지', () => {
    for (const [h, top, bottom] of [
      [667, 20, 0],
      [844, 47, 34],
      [932, 59, 34],
      [736, 20, 0],
      [660, 0, 0],
      [560, 0, 0],
      [520, 0, 0],
    ] as const) {
      const l = mainLayout(h, top, bottom);
      expect(l.available).toBe(h - top - (MAIN_LAYOUT.tabBar + bottom));
      if (l.step < 4) expect(sum(l)).toBe(l.available);
    }
  });

  it('0단계(기본): 지수 96 (링 + 숫자 + 문구), 방송 2줄', () => {
    for (const [h, top, bottom] of [[844, 47, 34], [932, 59, 34], [660, 0, 0]] as const) {
      const l = mainLayout(h, top, bottom);
      expect(l).toMatchObject({
        step: 0,
        header: 76,
        showTagline: true,
        broadcast: 68,
        broadcastLines: 2,
        indices: 96,
        indexVariant: 'full',
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

  // 단계 경계: 장면 ≥ 사용 가능 × 0.4 ⇔ 사용 가능 ≥ 고정 합 ÷ 0.6
  //   0단계 고정 336 → 560 / 1단계 288 → 480 / 2단계 260 → 433.4 / 3단계 232 → 386.7
  it('1단계: 지수 문구 제거(72, 링 + 숫자) + 방송 1줄 말줄임', () => {
    const l = mainLayout(visible(559), 20, 0);
    expect(l.step).toBe(1);
    expect(l).toMatchObject({ indices: 72, indexVariant: 'ring', broadcast: 44, broadcastLines: 1, header: 76, showTagline: true, gap: 10, cta: 56 });
    expect(l.sceneRatio).toBeGreaterThanOrEqual(SCENE_MIN_RATIO);
  });

  it('2단계: 지수를 한 줄 띠로(44, 아이콘 + 숫자)', () => {
    const l = mainLayout(visible(479), 20, 0);
    expect(l.step).toBe(2);
    expect(l).toMatchObject({ indices: 44, indexVariant: 'strip', broadcast: 44, header: 76, showTagline: true, gap: 10, cta: 56 });
    expect(l.sceneRatio).toBeGreaterThanOrEqual(SCENE_MIN_RATIO);
  });

  it('3단계: 헤더 부제 숨김(60) + 간격 8 (기록 버튼 52)', () => {
    const l = mainLayout(visible(433), 20, 0);
    expect(l.step).toBe(3);
    expect(l).toMatchObject({ header: 60, showTagline: false, gap: 8, cta: 52, indices: 44, indexVariant: 'strip', broadcast: 44 });
    expect(l.sceneRatio).toBeGreaterThanOrEqual(SCENE_MIN_RATIO);
  });

  it('4단계: 그래도 40%가 안 되면 장면 최소 220 유지 (모자란 만큼은 장면 안에서 줄인다)', () => {
    const l = mainLayout(visible(386), 20, 0);
    expect(l.step).toBe(4);
    expect(l.scene).toBe(SCENE_MIN_HEIGHT);
    expect(l).toMatchObject({ header: 60, showTagline: false, gap: 8, cta: 52, indexVariant: 'strip' });
  });

  it('지수 영역은 어느 단계에서도 보인다 (한 줄 띠 44 이상)', () => {
    for (let h = 400; h <= 1000; h += 10) expect(mainLayout(h, 20, 0).indices).toBeGreaterThanOrEqual(44);
  });

  it('높이가 줄수록 단계가 오르기만 한다 (되돌아가지 않는다)', () => {
    let prev = 0;
    for (let h = 1000; h >= 400; h -= 3) {
      const step = mainLayout(h, 20, 0).step;
      expect(step).toBeGreaterThanOrEqual(prev);
      prev = step;
    }
  });
});

describe('장면 기하: 위를 자르지 않는다', () => {
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
  });

  it('칸이 낮아지면 하늘이 먼저 줄고 최소 40pt를 남긴다 (땅 배율은 그대로)', () => {
    const w = 342;
    const k = w / 366;
    const groundPx = SCENE_GROUND_UNITS * k;
    const g = sceneGeometry(w, groundPx + 60);
    expect(g.k).toBeCloseTo(k);
    expect(g.skyPx).toBeCloseTo(60);
    const min = sceneGeometry(w, groundPx + SCENE_SKY_MIN);
    expect(min.k).toBeCloseTo(k);
    expect(min.skyPx).toBeCloseTo(SCENE_SKY_MIN);
  });

  it('하늘 40pt로도 모자라면 땅 층 전체를 비율 그대로 줄이고 하늘은 40pt, 남는 좌우는 그리지 않는다', () => {
    const w = 342;
    const g = sceneGeometry(w, 220);
    expect(g.k).toBeLessThan(w / 366);
    expect(g.skyPx).toBeCloseTo(SCENE_SKY_MIN);
    expect(g.viewBox.width).toBeGreaterThan(SCENE_UNITS.width); // 좌우에 장면 배경색이 남는다
    expect(g.viewBox.x + g.viewBox.width / 2).toBeCloseTo(SCENE_UNITS.width / 2); // 가운데 정렬
  });

  it('어떤 크기에서도 땅 쪽(집 · 게시판 · 솔이 · 밭)은 전부 보이고 아래 끝이 붙는다', () => {
    for (let w = 280; w <= 430; w += 30) {
      for (let h = 120; h <= 900; h += 40) {
        const g = sceneGeometry(w, h);
        const vb = g.viewBox;
        expect(vb.y + vb.height).toBeCloseTo(SCENE_UNITS.height); // 밭이 아래에 붙는다
        expect(vb.x).toBeLessThanOrEqual(1e-6); // 왼쪽 끝 (오두막)
        expect(vb.x + vb.width).toBeGreaterThanOrEqual(SCENE_UNITS.width - 1e-6); // 오른쪽 끝 (냇가)
        expect(vb.y).toBeLessThanOrEqual(SCENE_GROUND_TOP + 1e-6); // 땅 윗선(집 지붕 · 게시판)은 항상 안
        expect(vb.height * g.k).toBeCloseTo(Math.max(1, h)); // 칸을 정확히 채운다
      }
    }
  });

  it('보이는 하늘은 어떤 칸에서도 40pt 이상 (칸이 하늘 40 + 땅을 담을 수 있을 때)', () => {
    for (const [w, h] of [[342, 192], [342, 220], [351, 196], [366, 255], [390, 400]] as const) {
      expect(sceneGeometry(w, h).skyPx).toBeGreaterThanOrEqual(SCENE_SKY_MIN - 1e-6);
    }
  });
});

describe('하늘 그림(날씨)이 보이는 하늘 안에 들어온다', () => {
  // 하늘 그림은 원본 y 0 ~ 85 안에 그려진다. 변환 후 범위가 보이는 하늘 [85 - 보이는 높이, 85] 안이어야 한다.
  const extent = (geo: ReturnType<typeof sceneGeometry>) => {
    const { scale, centerY } = skyFit(geo);
    const center = SCENE_GROUND_TOP / 2;
    return { top: centerY + (0 - center) * scale, bottom: centerY + (SCENE_GROUND_TOP - center) * scale };
  };
  it('줄어든 하늘에서는 그림을 줄여 넣는다', () => {
    for (const [w, h] of [[342, 192], [342, 220], [351, 196], [366, 255], [390, 400], [342, 160]] as const) {
      const g = sceneGeometry(w, h);
      const e = extent(g);
      expect(e.top).toBeGreaterThanOrEqual(g.viewBox.y - 1e-6);
      expect(e.bottom).toBeLessThanOrEqual(SCENE_GROUND_TOP + 1e-6);
    }
  });
  it('하늘이 충분하면 줄이지 않는다 (배율 1)', () => {
    expect(skyFit(sceneGeometry(366, 340)).scale).toBe(1);
    expect(skyFit(sceneGeometry(342, 500)).scale).toBe(1);
  });
});
