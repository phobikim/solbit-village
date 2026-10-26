// 메인 화면(7a) 레이아웃 — 화면 높이 비율 기준. 메인은 스크롤이 없다.
// 고정 요소를 먼저 놓고 남는 높이는 전부 마을 장면이 가져간다. 장면이 사용 가능 높이의 40%보다 작으면 압축한다.
// 이 파일은 RN을 import하지 않는다 (순수 계산 + 상수 → 단위 테스트).

// ── 요소 높이 (pt) — 기본 / 압축 ─────────────────────────────────────────

export const MAIN_LAYOUT = {
  /** 헤더: 마을 이름 · Lv · 성장 바. 압축에서는 부제를 숨긴다 */
  header: { full: 76, compact: 60 },
  /** 방송: 2줄 / 1줄 말줄임 (탭하면 펼침) */
  broadcast: { full: 68, compact: 44 },
  /** 지수 카드: 기본 / 압축(아이콘 + 숫자 + 짧은 상태). 지수 카드 영역은 항상 보이고 최소 64 */
  indices: { full: 96, compact: 64 },
  /** 오늘 기록하기 */
  cta: { full: 56, compact: 52 },
  /** 탭 바 (하단 안전 영역은 따로 더한다) */
  tabBar: 76,
  /** 요소 사이 간격 */
  gap: { full: 10, compact: 8 },
  /** 간격이 들어가는 곳: 헤더|방송 · 방송|장면 · 장면|지수 · 지수|기록 버튼 */
  gapCount: 4,
} as const;

/** 마을 장면은 사용 가능 높이의 이 비율 이상이어야 한다. 부족하면 압축 */
export const SCENE_MIN_RATIO = 0.4;
/** 압축을 다 해도 장면은 이만큼은 남긴다 */
export const SCENE_MIN_HEIGHT = 220;

// ── 장면 내부 ───────────────────────────────────────────────────────────

/** 장면 그림 원본 좌표계 (village.ts의 viewBox 0 0 366 340) */
export const SCENE_UNITS = { width: 366, height: 340 } as const;
/** 땅 쪽 층(원경 · 중경 · 마당 · 전경)이 시작하는 y. 이 아래는 장면 너비 기준 비율로 크기가 정해진다 */
export const SCENE_GROUND_TOP = 85;
export const SCENE_GROUND_UNITS = SCENE_UNITS.height - SCENE_GROUND_TOP;
/** 하늘 층 원래 높이 (원본 좌표) */
export const SCENE_SKY_UNITS = SCENE_GROUND_TOP;
/** 하늘은 줄어도 이만큼(pt)은 남긴다 */
export const SCENE_SKY_MIN = 40;

// ── 메인 레이아웃 계산 ──────────────────────────────────────────────────

/** 압축 단계: 0 기본 / 1 방송 1줄 + 지수 압축 / 2 헤더 부제 숨김 + 간격 8 (+ 기록 버튼 52) / 3 장면 최소 220 */
export type CompactStep = 0 | 1 | 2 | 3;

export type MainLayout = {
  step: CompactStep;
  /** 사용 가능 높이: 창 높이 − 위 안전 영역 − (탭 바 + 아래 안전 영역) */
  available: number;
  header: number;
  showTagline: boolean;
  broadcast: number;
  broadcastLines: 1 | 2;
  indices: number;
  indicesCompact: boolean;
  cta: number;
  gap: number;
  /** 마을 장면 높이 (남는 높이 전부) */
  scene: number;
  /** 장면 / 사용 가능 높이 */
  sceneRatio: number;
};

type Pick = { header: number; broadcast: number; indices: number; cta: number; gap: number };

const total = (p: Pick) => p.header + p.broadcast + p.indices + p.cta + p.gap * MAIN_LAYOUT.gapCount;

/**
 * 창 높이와 안전 영역으로 메인 레이아웃을 정한다.
 * 장면이 40% 미만이면 1) 방송 1줄 + 지수 압축 → 2) 헤더 부제 숨김 + 간격 8 (기록 버튼 52) → 3) 장면 최소 220.
 * 3단계에서도 장면 40%에 못 미칠 수 있다 (아주 작은 화면). 그때는 장면 220을 지키고 하늘부터 줄인다.
 */
export function mainLayout(windowHeight: number, insetTop: number, insetBottom: number): MainLayout {
  const L = MAIN_LAYOUT;
  const available = Math.max(0, windowHeight - insetTop - L.tabBar - insetBottom);
  const steps: { step: CompactStep; pick: Pick; lines: 1 | 2; compactIdx: boolean; tagline: boolean }[] = [
    { step: 0, pick: { header: L.header.full, broadcast: L.broadcast.full, indices: L.indices.full, cta: L.cta.full, gap: L.gap.full }, lines: 2, compactIdx: false, tagline: true },
    { step: 1, pick: { header: L.header.full, broadcast: L.broadcast.compact, indices: L.indices.compact, cta: L.cta.full, gap: L.gap.full }, lines: 1, compactIdx: true, tagline: true },
    { step: 2, pick: { header: L.header.compact, broadcast: L.broadcast.compact, indices: L.indices.compact, cta: L.cta.compact, gap: L.gap.compact }, lines: 1, compactIdx: true, tagline: false },
  ];
  let chosen = steps[steps.length - 1];
  let reached: CompactStep = 3;
  for (const s of steps) {
    if (available - total(s.pick) >= available * SCENE_MIN_RATIO) {
      chosen = s;
      reached = s.step;
      break;
    }
  }
  const scene = Math.max(reached === 3 ? SCENE_MIN_HEIGHT : 0, available - total(chosen.pick));
  return {
    step: reached,
    available,
    header: chosen.pick.header,
    showTagline: chosen.tagline,
    broadcast: chosen.pick.broadcast,
    broadcastLines: chosen.lines,
    indices: chosen.pick.indices,
    indicesCompact: chosen.compactIdx,
    cta: chosen.pick.cta,
    gap: chosen.pick.gap,
    scene,
    sceneRatio: available > 0 ? scene / available : 0,
  };
}

// ── 장면 기하 ───────────────────────────────────────────────────────────

export type SceneGeometry = {
  /** 원본 1단위 = k pt */
  k: number;
  /** 화면에 보이는 원본 좌표 범위 (viewBox) */
  viewBox: { x: number; y: number; width: number; height: number };
  /** 보이는 하늘 높이 (원본 단위) */
  skyUnits: number;
  /** 보이는 하늘 높이 (pt) */
  skyPx: number;
};

/** 원본 그대로 (366 × 340) */
export const DEFAULT_SCENE_GEOMETRY: SceneGeometry = {
  k: 1,
  viewBox: { x: 0, y: 0, width: SCENE_UNITS.width, height: SCENE_UNITS.height },
  skyUnits: SCENE_SKY_UNITS,
  skyPx: SCENE_SKY_UNITS,
};

/**
 * 장면 칸(너비 × 높이, pt)에 그림을 맞춘다.
 * - 땅 쪽 층은 장면 너비 기준 비율(k = 너비 / 366)로 크기가 정해지고 아래에 붙는다.
 * - 칸이 더 높으면 늘어난 만큼은 하늘이 가져간다. 칸이 낮으면 하늘이 먼저 줄고 (최소 40pt),
 *   그래도 모자라면 땅 층 배율도 줄여서 땅이 잘리지 않게 한다 (가로는 땅이 양옆으로 이어진다).
 */
export function sceneGeometry(width: number, height: number): SceneGeometry {
  const w = Math.max(1, width);
  const h = Math.max(1, height);
  const k = Math.max(0.05, Math.min(w / SCENE_UNITS.width, (h - SCENE_SKY_MIN) / SCENE_GROUND_UNITS));
  const vbW = w / k;
  const vbH = h / k;
  const skyUnits = vbH - SCENE_GROUND_UNITS;
  return {
    k,
    viewBox: { x: (SCENE_UNITS.width - vbW) / 2, y: SCENE_UNITS.height - vbH, width: vbW, height: vbH },
    skyUnits,
    skyPx: skyUnits * k,
  };
}
