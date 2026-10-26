// 메인 화면(7a) 레이아웃 — 화면 높이 비율 기준. 메인은 스크롤이 없다.
// 고정 요소를 먼저 놓고 남는 높이는 전부 마을 장면이 가져간다. 장면이 사용 가능 높이의 40%보다 작으면 압축한다.
// 이 파일은 RN을 import하지 않는다 (순수 계산 + 상수 → 단위 테스트).

// ── 요소 높이 (pt) — 기본 / 압축 ─────────────────────────────────────────

export const MAIN_LAYOUT = {
  /** 헤더: 마을 이름 · Lv · 성장 바. 3단계부터 부제를 숨긴다 */
  header: { full: 76, compact: 60 },
  /** 방송: 2줄 / 1줄 말줄임 (탭하면 펼침) */
  broadcast: { full: 68, compact: 44 },
  /** 지수 카드: 기본(링 + 숫자 + 문구) / 문구 제거(링 + 숫자) / 한 줄 띠(아이콘 + 숫자, 링 없음). 지수 색은 늘 유지 */
  indices: { full: 96, ring: 72, strip: 44 },
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
/** 하늘 층 원래 높이 (원본 좌표). 해 · 구름 · 별 · 비 · 번개가 이 안에 그려진다 */
export const SCENE_SKY_UNITS = SCENE_GROUND_TOP;
/** 하늘은 줄어도 이만큼(pt)은 남긴다 */
export const SCENE_SKY_MIN = 40;

// ── 메인 레이아웃 계산 ──────────────────────────────────────────────────

/**
 * 압축 단계
 * 0 기본: 지수 96 (링 + 숫자 + 문구), 방송 2줄
 * 1 지수 문구 제거(72, 링 + 숫자) + 방송 1줄 말줄임
 * 2 지수를 한 줄 띠로(44, 아이콘 + 숫자)
 * 3 헤더 부제 숨김 + 간격 8 (기록 버튼 52)
 * 4 장면 최소 220 유지 + 장면 안에서 땅 층 축소 (장면은 위를 자르지 않는다)
 */
export type CompactStep = 0 | 1 | 2 | 3 | 4;
export type IndexVariant = 'full' | 'ring' | 'strip';

export type MainLayout = {
  step: CompactStep;
  /** 사용 가능 높이: 보이는 높이 − 위 안전 영역 − (탭 바 + 아래 안전 영역) */
  available: number;
  header: number;
  showTagline: boolean;
  broadcast: number;
  broadcastLines: 1 | 2;
  indices: number;
  indexVariant: IndexVariant;
  cta: number;
  gap: number;
  /** 마을 장면 높이 (남는 높이 전부) */
  scene: number;
  /** 장면 / 사용 가능 높이 */
  sceneRatio: number;
};

type Pick = {
  header: number;
  tagline: boolean;
  broadcast: number;
  lines: 1 | 2;
  indices: number;
  variant: IndexVariant;
  cta: number;
  gap: number;
};

const total = (p: Pick) => p.header + p.broadcast + p.indices + p.cta + p.gap * MAIN_LAYOUT.gapCount;

const L = MAIN_LAYOUT;
const STEPS: readonly Pick[] = [
  { header: L.header.full, tagline: true, broadcast: L.broadcast.full, lines: 2, indices: L.indices.full, variant: 'full', cta: L.cta.full, gap: L.gap.full },
  { header: L.header.full, tagline: true, broadcast: L.broadcast.compact, lines: 1, indices: L.indices.ring, variant: 'ring', cta: L.cta.full, gap: L.gap.full },
  { header: L.header.full, tagline: true, broadcast: L.broadcast.compact, lines: 1, indices: L.indices.strip, variant: 'strip', cta: L.cta.full, gap: L.gap.full },
  { header: L.header.compact, tagline: false, broadcast: L.broadcast.compact, lines: 1, indices: L.indices.strip, variant: 'strip', cta: L.cta.compact, gap: L.gap.compact },
];

/**
 * 보이는 높이와 안전 영역으로 메인 레이아웃을 정한다.
 * 장면이 40% 미만이면 단계를 올린다 (위 CompactStep). 3단계까지 40%에 못 미치면 4단계:
 * 장면 최소 220을 지키고, 모자란 만큼은 장면 안에서 하늘 → 땅 층 순서로 줄인다 (sceneGeometry).
 */
export function mainLayout(visibleHeight: number, insetTop: number, insetBottom: number): MainLayout {
  const available = Math.max(0, visibleHeight - insetTop - L.tabBar - insetBottom);
  let step: CompactStep = 4;
  let chosen = STEPS[STEPS.length - 1];
  for (let i = 0; i < STEPS.length; i++) {
    if (available - total(STEPS[i]) >= available * SCENE_MIN_RATIO) {
      step = i as CompactStep;
      chosen = STEPS[i];
      break;
    }
  }
  const scene = Math.max(step === 4 ? SCENE_MIN_HEIGHT : 0, available - total(chosen));
  return {
    step,
    available,
    header: chosen.header,
    showTagline: chosen.tagline,
    broadcast: chosen.broadcast,
    broadcastLines: chosen.lines,
    indices: chosen.indices,
    indexVariant: chosen.variant,
    cta: chosen.cta,
    gap: chosen.gap,
    scene,
    sceneRatio: available > 0 ? scene / available : 0,
  };
}

// ── 장면 기하 ───────────────────────────────────────────────────────────

export type SceneGeometry = {
  /** 원본 1단위 = k pt */
  k: number;
  /** 화면에 보이는 원본 좌표 범위 (viewBox). 아래 끝은 늘 원본 아래 끝(340)이고 위는 절대 자르지 않는다 */
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
 * 장면 칸(너비 × 높이, pt)에 그림을 맞춘다. 칸이 어떤 크기여도 하늘(날씨) · 집 · 게시판 · 솔이 · 밭 5칸이 다 보인다.
 * - 땅 쪽 층은 장면 너비 기준 비율(k = 너비 / 366)로 크기가 정해지고 아래에 붙는다.
 * - 칸이 더 높으면 늘어난 만큼은 하늘이 가져간다.
 * - 칸이 낮으면 하늘이 먼저 줄고 (최소 40pt), 그래도 모자라면 땅 층 전체를 비율 그대로 줄인다.
 *   이때 남는 좌우는 그리지 않아 장면 배경색이 보인다 (viewBox가 366보다 넓어지고 그림은 가운데).
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

/**
 * 하늘 그림(해 · 달 · 구름 · 별 · 비 · 번개, 원본 좌표 y 0 ~ 85)을 보이는 하늘 안에 넣는 변환.
 * 보이는 하늘이 원래보다 낮으면 그림을 줄이고(scale), 어느 쪽이든 보이는 하늘 가운데로 옮긴다.
 * 변환: translate(cx, centerY) scale(scale) translate(-cx, -SKY_CENTER)
 */
export const SKY_CENTER = SCENE_SKY_UNITS / 2;
export function skyFit(geo: SceneGeometry): { scale: number; centerY: number } {
  const visible = geo.skyUnits;
  return { scale: Math.min(1, Math.max(0.2, visible / SCENE_SKY_UNITS)), centerY: SCENE_GROUND_TOP - visible / 2 };
}
