// 새 메인 장면 그림 (디자인 v12 live18 이식). 390×844 좌표계의 SVG 문자열.
// react-native-svg는 SMIL <animate>를 지원하지 않으므로, 움직이는 것은 조각(Piece)으로 따로 만들어
// reanimated가 조각 단위로 움직인다 (src/ui/scene/Motion.tsx). 정지한 것은 층마다 한 장의 SVG다.
// 이번에는 base(밤) · day(낮)만 연결한다. work · trip · rest는 같은 variant 값으로 층별 교체할 수 있게 자리만 둔다.

import type { PlotSlot } from '../../domain/types';
import { plotCrop } from '../characters/crops';
import { L, o } from '../characters/svg';

export type SceneVariant = 'base' | 'work' | 'trip' | 'rest' | 'day';
/** 이번에 연결한 variant: 밤 · 낮. 나머지는 base로 그린다 (TODO: 일 · 여행 · 쉼 장면 변형은 다음 요청) */
export const connectedVariant = (v: SceneVariant): 'base' | 'day' => (v === 'day' ? 'day' : 'base');

export const SCENE_W = 390;
export const SCENE_H = 844;

const svgOf = (inner: string, vb: string) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}">${inner}</svg>`;

// ── 조각 ──────────────────────────────────────────────

export type Piece = {
  xml: string;
  /** 장면 좌표 (390×844) */
  left: number;
  top: number;
  width: number;
  height: number;
  /** 흔들림 중심 (조각 왼쪽 위 기준) */
  px: number;
  py: number;
};

/** inner는 (atX, atY)를 원점으로 scale 배 한 좌표. vb = [x, y, w, h] (그 좌표계). pivot도 그 좌표계 */
function piece(inner: string, vb: readonly [number, number, number, number], scale: number, atX: number, atY: number, pivot: readonly [number, number] = [0, 0]): Piece {
  const [vx, vy, vw, vh] = vb;
  return {
    xml: svgOf(inner, `${vx} ${vy} ${vw} ${vh}`),
    left: atX + vx * scale,
    top: atY + vy * scale,
    width: vw * scale,
    height: vh * scale,
    px: (pivot[0] - vx) * scale,
    py: (pivot[1] - vy) * scale,
  };
}

// ── 하늘 ──────────────────────────────────────────────

const SKY = { base: ['#141A44', '#2E2C74'], day: ['#4FB4F5', '#C4ECFF'] } as const;

/** 하늘 바탕 + 해/달 빛 + 달 (정지) */
export function skySvg(v: 'base' | 'day'): string {
  const [a, b] = SKY[v];
  const glow = v === 'day' ? `<circle cx="318" cy="286" r="56" fill="url(#g)"/>` : `<circle cx="318" cy="262" r="46" fill="url(#g)"/><path d="M314 238 A24 24 0 1 0 342 274 A18 18 0 1 1 314 238Z" fill="#FFE14D" ${o(3)}/>`;
  const inner = `<defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset=".42" stop-color="${b}"/></linearGradient><radialGradient id="g"><stop offset="0" stop-color="#FFE14D" stop-opacity=".55"/><stop offset="1" stop-color="#FFE14D" stop-opacity="0"/></radialGradient></defs><rect width="${SCENE_W}" height="${SCENE_H}" fill="url(#s)"/>${glow}`;
  return svgOf(inner, `0 0 ${SCENE_W} ${SCENE_H}`);
}

const STARS: readonly (readonly [number, number, number])[] = [
  [22, 64, 3], [70, 30, 2.6], [128, 92, 3], [190, 50, 2.4], [236, 110, 3], [300, 40, 2.6], [356, 96, 3],
  [40, 160, 2.6], [104, 250, 3.4], [168, 262, 2.6], [36, 272, 3], [226, 248, 2.4], [352, 186, 2.6], [150, 200, 2.2],
];

/** 별 깜박임 묶음 수: 별을 깜박임 주기별로 3묶음으로 나눠 움직이는 조각 수를 줄인다 */
export const STAR_GROUPS = 3;
/** 묶음별 깜박임 주기(초) — 시안은 별마다 1.6~3.6초 */
export const STAR_PERIODS = [1.6, 2.6, 3.6] as const;

export function starPiece(group: number): Piece {
  const s = STARS.filter((_, i) => i % STAR_GROUPS === group)
    .map(([x, y, r]) => `<path d="M${x} ${y - r} Q${x} ${y} ${x + r} ${y} Q${x} ${y} ${x} ${y + r} Q${x} ${y} ${x - r} ${y} Q${x} ${y} ${x} ${y - r}Z" fill="#FFE14D"/>`)
    .join('');
  return piece(s, [0, 20, SCENE_W, 270], 1, 0, 0);
}

/** 낮의 해: 천천히 도는 햇살 + 몸 (중심 318,286) */
export function sunPiece(): Piece {
  const rays = [0, 1, 2, 3, 4, 5, 6, 7]
    .map((i) => `<path d="M0 -38 V-48" transform="rotate(${i * 45})" stroke="${L}" stroke-width="6" stroke-linecap="round"/><path d="M0 -38 V-48" transform="rotate(${i * 45})" stroke="#FFE14D" stroke-width="2.6" stroke-linecap="round"/>`)
    .join('');
  const body = `<circle r="28" fill="#FFE14D" ${o(3)}/><path d="M-12 -12 q8 -6 16 -3" stroke="#FFF6D6" stroke-width="3" fill="none" stroke-linecap="round"/>`;
  // 몸은 돌아도 같은 모양이다 (원 + 하이라이트만 같이 돈다 — 시안도 같이 돈다)
  return piece(rays + body, [-52, -52, 104, 104], 0.85, 318, 286);
}

const CLOUD = (f: string) => `<path d="M-8 12 H38 A9 9 0 0 0 36 -4 A14 14 0 0 0 10 -10 A15 15 0 0 0 -8 12 Z" fill="${f}" stroke="${L}" stroke-width="2.6" stroke-linejoin="round"/>`;

export type CloudSpec = { piece: Piece; dx: number; period: number };

/** 구름 3개: [x, y, 크기, 이동 거리, 주기(초)] — 시안은 20~30px, 18~26초 */
export function cloudSpecs(v: 'base' | 'day'): CloudSpec[] {
  const cc = v === 'day' ? (['#FFFFFF', '#EEF8FF'] as const) : (['#4A4F9C', '#3A3F86'] as const);
  const defs: [number, number, number, string, number, number][] = [
    [40, 252, 1.2, cc[0], 26, 22],
    [190, 278, 0.8, cc[1], -20, 18],
    [250, 120, 0.9, cc[1], 30, 26],
  ];
  return defs.map(([x, y, s, f, dx, d]) => {
    // 선 굵기를 크기와 무관하게 2.6으로 두려고 안쪽을 1/s로 키운 좌표를 쓴다
    const inner = `<g transform="scale(${1})">${CLOUD(f).replace('stroke-width="2.6"', `stroke-width="${(2.6 / s).toFixed(2)}"`)}</g>`;
    return { piece: piece(inner, [-12, -20, 62, 38], s, x, y), dx, period: d };
  });
}

// ── 땅 (정지): 원경 · 중경 · 냇가 · 마당 · 울타리 · 밭 바닥 ──────────

const ridge = (d: string, c: string, w: number) => `<path d="${d}" fill="${c}" ${o(w)}/>`;

function far(v: 'base' | 'day'): string {
  if (v === 'day') {
    return (
      ridge('M-4 250 V176 Q40 140 96 166 Q150 128 212 160 Q270 124 330 154 Q352 146 370 152 V250Z', '#8EC6EE', 2.4) +
      ridge('M-4 250 V206 Q70 184 140 200 Q220 180 290 198 Q340 188 370 196 V250Z', '#6FB86A', 2.4)
    );
  }
  return (
    ridge('M-4 250 V176 Q40 140 96 166 Q150 128 212 160 Q270 124 330 154 Q352 146 370 152 V250Z', '#262B63', 2.4) +
    ridge('M-4 250 V206 Q70 184 140 200 Q220 180 290 198 Q340 188 370 196 V250Z', '#2C3470', 2.4) +
    [[60, 196], [176, 190], [300, 186]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.4" fill="#FFE14D"/>`).join('')
  );
}

/** 땅 한 장: 원경(translate 0 168, scale 1.066) → 중경 → 냇가 → 마당 + 길 → 울타리 → 밭 바닥 */
export function landSvg(v: 'base' | 'day'): string {
  const D = v === 'day';
  let s = `<g transform="translate(0 168) scale(1.066)">${far(v)}</g>`;
  s += `<path d="M-4 446 C70 430 160 440 240 432 C300 426 350 434 394 430 V844 H-4Z" fill="${D ? '#8ED062' : '#212C5C'}" ${o(3)}/>`;
  s += `<path d="M-4 470 Q90 458 190 466 Q290 474 394 462 V490 Q290 500 190 492 Q90 486 -4 496Z" fill="#2D5AA6" ${o(3)}/>`;
  s += `<path d="M40 480 q8 -4 16 0 M140 478 q8 -4 16 0 M236 484 q8 -4 16 0 M330 476 q8 -4 16 0" stroke="#5FD8FF" stroke-width="2.5" stroke-linecap="round" fill="none"/>`;
  s += `<path d="M-4 506 C110 494 280 500 394 496 V844 H-4Z" fill="${D ? '#A6DC6E' : '#3E3966'}" ${o(3)}/><path d="M150 506 C140 560 220 590 206 640 H250 C266 590 196 556 214 504Z" fill="${D ? '#E8C98A' : '#4A4478'}"/>`;
  s += `<path d="M296 600 V570 M326 600 V566 M356 600 V570 M290 580 H362" stroke="${L}" stroke-width="6" stroke-linecap="round"/><path d="M296 600 V570 M326 600 V566 M356 600 V570 M290 580 H362" stroke="#B9825A" stroke-width="2.5" stroke-linecap="round"/>`;
  s += `<path d="M-4 640 C120 634 270 638 394 634 V844 H-4Z" fill="${D ? '#7FBE52' : '#2E2A55'}" ${o(3)}/>`;
  return svgOf(s, `0 0 ${SCENE_W} ${SCENE_H}`);
}

// ── 나무 · 풀 · 꽃 (흔들림) ────────────────────────────

export type SwayPiece = { piece: Piece; angle: number; period: number };

/** 나무 4그루: [x, y, 크기, 잎 색, 주기] */
export function treePieces(): SwayPiece[] {
  const defs: [number, number, number, string, number][] = [
    [30, 446, 1, '#3E8A3A', 3.2],
    [84, 440, 0.8, '#4FA83A', 2.8],
    [318, 438, 0.9, '#3E8A3A', 3.6],
    [366, 444, 1.1, '#4FA83A', 3],
  ];
  return defs.map(([x, y, sc, c, d]) => {
    const inner = `<path d="M0 0 V-16" stroke="${L}" stroke-width="7" stroke-linecap="round"/><path d="M0 0 V-16" stroke="#8E5A38" stroke-width="3" stroke-linecap="round"/><circle cx="0" cy="-30" r="17" fill="${c}" ${o(3)}/><circle cx="-11" cy="-22" r="10" fill="${c}" ${o(3)}/><circle cx="11" cy="-22" r="10" fill="${c}" ${o(3)}/><path d="M-6 -36 q5 -5 11 -3" stroke="#B6F35C" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
    return { piece: piece(inner, [-24, -50, 48, 54], sc, x, y, [0, 0]), angle: 2.5, period: d };
  });
}

export function tuftPieces(): SwayPiece[] {
  const pts: [number, number][] = [[20, 540], [64, 600], [118, 528], [300, 532], [352, 584], [372, 530], [96, 636], [320, 636]];
  return pts.map(([x, y], i) => {
    const inner = `<path d="M${x - 7} ${y} l2 -10 l3 7 l2 -12 l3 12 l3 -8 l2 11z" fill="#3E7A3A" ${o(1.6)}/>`;
    return { piece: piece(inner, [x - 10, y - 16, 26, 20], 1, 0, 0, [x, y]), angle: 6, period: 2 + (i % 3) * 0.6 };
  });
}

export function flowerPieces(): SwayPiece[] {
  const defs: [number, number, string, number][] = [
    [40, 566, '#FF4FA0', 2.4], [78, 556, '#C49BFF', 2.9], [330, 560, '#FFE14D', 2.6], [362, 606, '#FF4FA0', 3.1], [28, 620, '#C49BFF', 2.7],
  ];
  return defs.map(([x, y, col, d]) => {
    const petals = [0, 1, 2, 3, 4]
      .map((i) => {
        const a = i * 1.2566;
        return `<circle cx="${(x + Math.sin(a) * 4.4).toFixed(1)}" cy="${(y - 14 - Math.cos(a) * 4.4).toFixed(1)}" r="4" fill="${col}" ${o(1.6)}/>`;
      })
      .join('');
    const inner = `<path d="M${x} ${y} v-10" stroke="#3E8A3A" stroke-width="2.6" stroke-linecap="round"/>${petals}<circle cx="${x}" cy="${y - 14}" r="2.6" fill="#FFE14D" ${o(1.4)}/>`;
    return { piece: piece(inner, [x - 12, y - 28, 24, 30], 1, 0, 0, [x, y]), angle: 8, period: d };
  });
}

// ── 반딧불이(밤) · 나비(낮) ───────────────────────────

export type BugSpec = { piece: Piece; /** 한 바퀴 시간(초) */ loop: number; /** 반짝/날갯짓 주기(초) */ blink: number; phase: number };

export function fireflySpecs(): BugSpec[] {
  const defs: [number, number, number][] = [[60, 520, 5], [120, 580, 6.4], [280, 540, 5.6], [340, 520, 7], [210, 470, 6], [30, 600, 4.6]];
  return defs.map(([x, y, d], i) => ({
    piece: piece(`<circle r="8" fill="#E8FF7A" opacity=".18"/><circle r="3" fill="#E8FF7A"/>`, [-9, -9, 18, 18], 1, x, y, [0, 0]),
    loop: d,
    blink: 1.4 + i * 0.3,
    phase: i * 0.9,
  }));
}

export function butterflySpecs(): BugSpec[] {
  const defs: [number, number, number, string][] = [[70, 520, 9, '#FF4FA0'], [300, 500, 11, '#FFFFFF'], [200, 590, 13, '#C49BFF']];
  return defs.map(([x, y, d, c], i) => ({
    piece: piece(`<path d="M0 0 C-8 -10 -14 -2 -10 4 C-6 8 -2 4 0 0 C2 4 6 8 10 4 C14 -2 8 -10 0 0Z" fill="${c}" stroke="${L}" stroke-width="2" stroke-linejoin="round"/>`, [-14, -13, 28, 24], 1, x, y, [0, 0]),
    loop: d,
    blink: 0.35 + i * 0.05,
    phase: i * 1.7,
  }));
}

// ── 솔이 자리 · 그림자 ─────────────────────────────────

/** 솔이 그림 상자: 시안 nest(…, 128, 146, 110) × scale 1.9 + translate(-152.7 128) */
export const SOLI_BOX = { left: 90.5, top: 405.4, width: 209, height: 229.9 } as const;
export const SOLI_SHADOW = { cx: 194.9, cy: 618.2, rx: 76, ry: 11.4 } as const;
/** 폴짝: 3초 주기, 16(×1.9) 올라감 — 시안 keyTimes 0;.2;.4;.5;.6;1 / 값 0;-4;0;-16;0;0 */
export const SOLI_BOB = { period: 3, keyTimes: [0, 0.2, 0.4, 0.5, 0.6, 1], values: [0, -4, 0, -16, 0, 0], unit: 1.9 } as const;

export function shadowSvg(): string {
  const s = SOLI_SHADOW;
  return svgOf(`<ellipse cx="${s.cx}" cy="${s.cy}" rx="${s.rx}" ry="${s.ry}" fill="#000" opacity=".28"/>`, `0 0 ${SCENE_W} ${SCENE_H}`);
}

// ── 밭 5칸 ────────────────────────────────────────────

export const PLOT = { width: 68, height: 52, gap: 6, firstX: 13, y: 648 } as const;

const SOIL = {
  base: { soil: '#5A3E5E', line: '#45304A', pebble: '#6A5470' },
  day: { soil: '#B07A4E', line: '#8A5A36', pebble: '#9A6A44' },
} as const;

/** 칸 하나: 흙 + 실제 작물 (빈 칸은 이랑 줄무늬). 상태 글자는 두지 않는다 */
export function plotCellSvg(slot: PlotSlot, v: 'base' | 'day'): string {
  const c = SOIL[v];
  const { width: W, height: H } = PLOT;
  let s = `<rect x="1.5" y="1.5" width="${W - 3}" height="${H - 3}" rx="12" fill="${c.soil}" ${o(3)}/><path d="M10 ${H - 8} H${W - 10}" stroke="${c.line}" stroke-width="3" stroke-linecap="round"/>`;
  if (slot) {
    if (slot.stage === 3) s += `<circle cx="${W / 2}" cy="20" r="24" fill="#FFE14D" opacity=".28"/>`;
    // 작물 그림(밭 흙 윗면 y=190 기준)을 칸에 맞게 키운다 (밭 띠와 같은 그림)
    s += `<g transform="translate(${W / 2} ${H - 12}) scale(1.6) translate(0 -190)">${plotCrop(slot.crop, slot.stage, 0)}</g>`;
  } else {
    s += `<path d="M14 20 H${W - 14} M18 30 H${W - 18}" stroke="${c.line}" stroke-width="3" stroke-linecap="round"/><ellipse cx="${W / 2 + 10}" cy="25" rx="2.6" ry="1.8" fill="${c.pebble}"/>`;
  }
  return svgOf(s, `0 0 ${W} ${H}`);
}

export const plotLeft = (i: number) => PLOT.firstX + i * (PLOT.width + PLOT.gap);
