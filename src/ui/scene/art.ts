// 새 메인 장면 그림 (디자인 v12 live18 이식 + 집 · 게시판 · 냇가 · 이웃 · 날씨 복원). 390×844 좌표계의 SVG 문자열.
// react-native-svg는 SMIL <animate>를 지원하지 않으므로, 움직이는 것은 조각(Piece)으로 따로 만들어
// reanimated가 조각 단위로 움직인다 (VillageBackdrop.tsx). 정지한 것은 층마다 한 장의 SVG다.
// 색은 전부 VillageTheme(theme.ts)에서 온다 — 꾸미기에서 고른 마을 배경이 곧 이 테마다.
// 일 · 여행 · 쉼 장면 변형은 이번 범위 밖이다 (TODO: 하루별 장면 연결은 다음 요청).

import type { PlotSlot, Weather } from '../../domain/types';
import { plotCrop } from '../characters/crops';
import { faceSvg, FACES } from '../characters/neighbors';
import { buildingSvg } from '../characters/skins';
import { L, nest, o } from '../characters/svg';
import {
  boardWithLantern,
  creek,
  creekFlowers,
  HEART,
  hut,
  type BoardParams,
  type VillageVisitor,
} from '../characters/village';
import { SCENE_PCT } from '../layout';
import { soliShadow } from '../mainScene';
import type { VillageTheme } from './theme';

export const SCENE_W = 390;
export const SCENE_H = 844;

const svgOf = (inner: string, vb: string) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}">${inner}</svg>`;
const full = (inner: string) => svgOf(inner, `0 0 ${SCENE_W} ${SCENE_H}`);

/**
 * 하늘 · 땅은 좌우로 BLEED만큼 더 그린다. 메인(가로 기준 배율)에서는 화면 밖이라 보이지 않고,
 * 꾸미기 미리보기처럼 장면을 작게 줄여 카드에 넣을 때 양옆이 비지 않게 한다.
 */
export const BLEED = 160;
const bleed = (inner: string) => svgOf(inner, `${-BLEED} 0 ${SCENE_W + BLEED * 2} ${SCENE_H}`);

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

// ── 날씨가 하늘에 미치는 영향 (옛 마을 장면 규칙 그대로) ─────────

/** 달 · 별 · 해를 그릴까: 폭풍이면 다 숨고, 비 오는 날은 해만 숨는다 */
export function celestialVisible(t: VillageTheme, weather: Weather): boolean {
  if (t.celestial === 'none' || weather === 'storm') return false;
  if (t.celestial === 'moon') return true;
  return weather !== 'rain';
}

/** 보이는 별 개수: 날씨가 나쁠수록 덜 보인다 (14 → 7 → 4 → 2 → 0) */
export function visibleStars(weather: Weather): number {
  return weather === 'sun' ? STARS.length : weather === 'cloud' ? 7 : weather === 'over' ? 4 : weather === 'rain' ? 2 : 0;
}

// ── 하늘 ──────────────────────────────────────────────

/** 하늘 바탕 + 해/달 빛 + 달 · 낮게 걸린 해 (정지) */
export function skySvg(t: VillageTheme, weather: Weather): string {
  const [a, b] = t.sky;
  let celestial = '';
  if (celestialVisible(t, weather)) {
    if (t.celestial === 'moon') {
      celestial = `<circle cx="318" cy="262" r="46" fill="url(#g)"/><path d="M314 238 A24 24 0 1 0 342 274 A18 18 0 1 1 314 238Z" fill="#FFE14D" ${o(3)}/>`;
    } else if (t.celestial === 'sun') {
      celestial = `<circle cx="318" cy="286" r="56" fill="url(#g)"/>`;
    } else if (t.celestial === 'lowSun') {
      celestial = `<circle cx="290" cy="322" r="96" fill="url(#g)"/><circle cx="290" cy="322" r="54" fill="#FFE14D" ${o(3)}/>`;
    }
  }
  const inner =
    `<defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset=".42" stop-color="${b}"/></linearGradient>` +
    `<radialGradient id="g"><stop offset="0" stop-color="#FFE14D" stop-opacity=".55"/><stop offset="1" stop-color="#FFE14D" stop-opacity="0"/></radialGradient></defs>` +
    `<rect x="${-BLEED}" width="${SCENE_W + BLEED * 2}" height="${SCENE_H}" fill="url(#s)"/>${celestial}`;
  return bleed(inner);
}

const STARS: readonly (readonly [number, number, number])[] = [
  [22, 64, 3], [70, 30, 2.6], [128, 92, 3], [190, 50, 2.4], [236, 110, 3], [300, 40, 2.6], [356, 96, 3],
  [40, 160, 2.6], [104, 250, 3.4], [168, 262, 2.6], [36, 272, 3], [226, 248, 2.4], [352, 186, 2.6], [150, 200, 2.2],
];

/** 별 깜박임 묶음 수: 별을 깜박임 주기별로 3묶음으로 나눠 움직이는 조각 수를 줄인다 */
export const STAR_GROUPS = 3;
/** 묶음별 깜박임 주기(초) — 시안은 별마다 1.6~3.6초 */
export const STAR_PERIODS = [1.6, 2.6, 3.6] as const;

/** 별 한 묶음. count = 보이는 별 수 (visibleStars). 비면 null */
export function starPiece(group: number, count: number = STARS.length): Piece | null {
  const pts = STARS.slice(0, count).filter((_, i) => i % STAR_GROUPS === group);
  if (!pts.length) return null;
  const s = pts
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

const CLOUD = (f: string, strokeW = 2.6) => `<path d="M-8 12 H38 A9 9 0 0 0 36 -4 A14 14 0 0 0 10 -10 A15 15 0 0 0 -8 12 Z" fill="${f}" stroke="${L}" stroke-width="${strokeW}" stroke-linejoin="round"/>`;

export type CloudSpec = { piece: Piece; dx: number; period: number };

/** 떠다니는 구름 3개: [x, y, 크기, 이동 거리, 주기(초)] — 시안은 20~30px, 18~26초. 비 · 폭풍이면 어두운 구름 */
export function cloudSpecs(t: VillageTheme, weather: Weather): CloudSpec[] {
  if (!t.clouds) return [];
  const dark = weather === 'rain' || weather === 'storm';
  const cc = dark ? ([t.struct.darkCloud, t.struct.darkCloud] as const) : t.clouds;
  const defs: [number, number, number, string, number, number][] = [
    [40, 252, 1.2, cc[0], 26, 22],
    [190, 278, 0.8, cc[1], -20, 18],
    [250, 120, 0.9, cc[1], 30, 26],
  ];
  return defs.map(([x, y, s, f, dx, d]) => ({ piece: piece(CLOUD(f, 2.6 / s), [-12, -20, 62, 38], s, x, y), dx, period: d }));
}

/**
 * 날씨 5단계 표현 (옛 마을 장면 sky()와 같은 구성, 정지한 한 장): 구름 · 비 · 번개. 테마 위에 겹친다.
 * sun: 없음 · cloud: 구름 2 · over: 구름 3 · rain: 어두운 구름 3 + 비 · storm: 어두운 구름 3 + 비 + 번개
 */
export function weatherSvg(t: VillageTheme, weather: Weather): string | null {
  if (weather === 'sun') return null;
  const c = t.struct;
  const cl = (x: number, y: number, s: number, f: string) => `<g transform="translate(${x} ${y}) scale(${s})">${CLOUD(f, 2.6 / s)}</g>`;
  const drops = (x: number, y: number) =>
    `<path d="M${x} ${y} l-2.5 7 M${x + 9} ${y + 1} l-2.5 7 M${x + 18} ${y} l-2.5 7" stroke="#5FD8FF" stroke-width="2.6" stroke-linecap="round"/>`;
  let s = '';
  switch (weather) {
    case 'cloud':
      s = cl(52, 100, 1.1, c.cloud) + cl(190, 84, 0.7, c.darkCloud);
      break;
    case 'over':
      s = cl(52, 100, 1.1, c.cloud) + cl(190, 84, 0.7, c.darkCloud) + cl(262, 128, 0.8, c.cloud);
      break;
    case 'rain':
      s = cl(52, 100, 1.1, c.darkCloud) + cl(190, 84, 0.7, c.darkCloud) + cl(268, 76, 0.8, c.darkCloud) + drops(58, 128) + drops(194, 104) + drops(272, 98);
      break;
    case 'storm':
      s =
        cl(40, 96, 1.2, c.darkCloud) + cl(160, 72, 1.1, c.darkCloud) + cl(268, 84, 1.1, c.darkCloud) + drops(50, 132) + drops(284, 126) +
        `<path d="M184 96 L174 114 H183 L176 134 L194 110 H185 L192 96Z" fill="#FFE14D" ${o(2.5)}/>`;
      break;
  }
  return full(s);
}

// ── 장식 점 (꽃잎 · 낙엽 · 눈) ─────────────────────────────

/** 하늘에 흩어진 장식 점. 한 장으로 그리고 천천히 위아래로 떠다닌다 (움직이는 조각 1개) */
export function decoPiece(t: VillageTheme): Piece | null {
  if (!t.deco) return null;
  const { kind, colors } = t.deco;
  const dots: string[] = [];
  for (let i = 0; i < 26; i++) {
    const x = 8 + ((i * 83) % 374);
    const y = 44 + ((i * 59) % 380);
    const r = 2.4 + (i % 3) * 0.8;
    const c = colors[i % 2];
    if (kind === 'leaf') dots.push(`<path d="M${x} ${y - r * 2} Q${x + r * 1.6} ${y} ${x} ${y + r * 2} Q${x - r * 1.6} ${y} ${x} ${y - r * 2}Z" fill="${c}" transform="rotate(${(i * 47) % 180} ${x} ${y})"/>`);
    else dots.push(`<circle cx="${x}" cy="${y}" r="${r}" fill="${c}"/>`);
  }
  return piece(dots.join(''), [0, 30, SCENE_W, 410], 1, 0, 0);
}

// ── 땅 (정지): 원경 · 중경 · 마당 · 길 · 울타리 · 앞 땅 ───────────

const ridge = (d: string, c: string, w: number) => `<path d="${d}" fill="${c}" ${o(w)}/>`;

function far(t: VillageTheme): string {
  return (
    ridge('M-300 250 V176 H-4 Q40 140 96 166 Q150 128 212 160 Q270 124 330 154 Q352 146 370 152 H700 V250Z', t.ridge[0], 2.4) +
    ridge('M-300 250 V206 H-4 Q70 184 140 200 Q220 180 290 198 Q340 188 370 196 H700 V250Z', t.ridge[1], 2.4) +
    (t.ridgeLights ? [[60, 196], [176, 190], [300, 186]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.4" fill="#FFE14D"/>`).join('') : '')
  );
}

/**
 * 땅 한 장: 원경(translate 0 168, scale 1.066) → 중경 → 마당 + 길 → 울타리 → 앞 땅.
 * 옛 전체 폭 냇물 띠는 뺐다 — 냇가(물)는 뒤 줄의 냇가(rowSvg)로 그린다.
 */
export function landSvg(t: VillageTheme): string {
  let s = `<g transform="translate(0 168) scale(1.066)">${far(t)}</g>`;
  s += `<path d="M-200 446 H-4 C70 430 160 440 240 432 C300 426 350 434 394 430 H600 V844 H-200Z" fill="${t.mid}" ${o(3)}/>`;
  s += `<path d="M-200 506 H-4 C110 494 280 500 394 496 H600 V844 H-200Z" fill="${t.yard}" ${o(3)}/><path d="M150 506 C140 560 220 590 206 640 H250 C266 590 196 556 214 504Z" fill="${t.path}"/>`;
  s += `<path d="M296 600 V570 M326 600 V566 M356 600 V570 M290 580 H362" stroke="${L}" stroke-width="6" stroke-linecap="round"/><path d="M296 600 V570 M326 600 V566 M356 600 V570 M290 580 H362" stroke="#B9825A" stroke-width="2.5" stroke-linecap="round"/>`;
  s += `<path d="M-200 640 H-4 C120 634 270 638 394 634 H600 V844 H-200Z" fill="${t.fore}" ${o(3)}/>`;
  return bleed(s);
}

// ── 뒤 줄: 집 · 게시판 · 냇가 (정지) ────────────────────────

type Box = { x: number; y: number; w: number; h: number };

/** 원본 좌표로 그린 그림(src 상자)을 장면 % 영역(x0~x1)의 바닥선(bottomY)에 앉힌다. maxH가 있으면 그 높이를 넘지 않게 */
function seat(inner: string, src: Box, x0pct: number, x1pct: number, bottomY: number, maxH?: number): string {
  const x0 = (SCENE_W * x0pct) / 100;
  const dw = (SCENE_W * x1pct) / 100 - x0;
  let k = dw / src.w;
  if (maxH !== undefined) k = Math.min(k, maxH / src.h);
  const tx = x0 + (dw - src.w * k) / 2 - src.x * k;
  const ty = bottomY - (src.y + src.h) * k;
  return `<g transform="translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${k.toFixed(4)})">${inner}</g>`;
}

const yOf = (pct: number) => (SCENE_H * pct) / 100;

export type RowParams = BoardParams & {
  /** 냇가 꽃이 핀 정도 0~1 (여가) */
  bloom: number;
  /** 마을에 놓은 건물 스킨 id */
  building?: string | null;
  /** 집 · 냇가를 그릴까 (MAIN_SCENE.houseAndCreek) */
  showHouseAndCreek?: boolean;
  /** 게시판을 그릴까 (MAIN_SCENE.board) */
  showBoard?: boolean;
};

/** 집 · 게시판(+ 야근 등불) · 냇가(+ 꽃). 밤 테마는 창문 · 등불이 빛난다 */
export function rowSvg(t: VillageTheme, p: RowParams): string {
  const P = SCENE_PCT;
  const glow = (cx: number, cy: number, r: number, extra = '') => (t.lit ? `<circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#rg)" ${extra}/>` : '');
  let s = `<defs><radialGradient id="rg"><stop offset="0" stop-color="#FFE14D" stop-opacity=".55"/><stop offset="1" stop-color="#FFE14D" stop-opacity="0"/></radialGradient></defs>`;
  // 건물 스킨은 원경 능선 위 (옛 장면과 같은 자리: 오른쪽 능선)
  if (p.building) s += nest(buildingSvg(p.building), 296, 244, 56);
  const homeAndCreek = p.showHouseAndCreek !== false;
  if (homeAndCreek) s += seat(hut(t.struct, glow(56, 138, 40, 'opacity=".7"')), { x: 6, y: 66, w: 100, h: 98 }, P.house.x0, P.house.x1, yOf(P.house.bottom));
  if (p.showBoard !== false) s += seat(boardWithLantern(p, t.struct, glow(224, 128, 30)), { x: 106, y: 86, w: 128, h: 84 }, P.board.x0, P.board.x1, yOf(P.board.bottom));
  if (homeAndCreek) {
    s += seat(creek(t.struct), { x: 222, y: 134, w: 142, h: 32 }, P.creek.x0, P.creek.x1, yOf(P.creek.bottom), yOf(P.creek.height));
    s += seat(creekFlowers(p.bloom), { x: 230, y: 168, w: 124, h: 16 }, P.creekFlowers.x0, P.creekFlowers.x1, yOf(P.creekFlowers.bottom) + 6);
  }
  return full(s);
}

// ── 나무 · 풀 · 꽃 (흔들림) ────────────────────────────

export type SwayPiece = { piece: Piece; angle: number; period: number };

/**
 * 나무 4그루: [x, y, 크기, 주기]. 뒤 줄(집 · 게시판 · 냇가, 바닥선 y 470) 아래 마당 가장자리에 둔다 — 뒤 줄과 겹치지 않게
 * (예전 y 440 자리는 집 · 냇가가 서는 곳이다). 잎은 테마 색을 번갈아 쓰고, 겨울은 잎 위에 눈이 얹힌다.
 */
export function treePieces(t: VillageTheme): SwayPiece[] {
  const defs: [number, number, number, number][] = [
    [22, 522, 1, 3.2],
    [86, 514, 0.75, 2.8],
    [322, 514, 0.8, 3.6],
    [368, 524, 1.05, 3],
  ];
  return defs.map(([x, y, sc, d], i) => {
    const c = t.leaf[i % 2];
    const snow = t.treeSnow ? `<path d="M-14 -34 Q0 -50 14 -34 Q0 -40 -14 -34Z" fill="#FFFFFF" ${o(2)}/>` : '';
    const inner = `<path d="M0 0 V-16" stroke="${L}" stroke-width="7" stroke-linecap="round"/><path d="M0 0 V-16" stroke="#8E5A38" stroke-width="3" stroke-linecap="round"/><circle cx="0" cy="-30" r="17" fill="${c}" ${o(3)}/><circle cx="-11" cy="-22" r="10" fill="${c}" ${o(3)}/><circle cx="11" cy="-22" r="10" fill="${c}" ${o(3)}/><path d="M-6 -36 q5 -5 11 -3" stroke="${t.leafHi}" stroke-width="2.4" fill="none" stroke-linecap="round"/>${snow}`;
    return { piece: piece(inner, [-24, -52, 48, 56], sc, x, y, [0, 0]), angle: 2.5, period: d };
  });
}

export function tuftPieces(t: VillageTheme): SwayPiece[] {
  const pts: [number, number][] = [[20, 540], [64, 600], [118, 528], [300, 532], [352, 584], [372, 530], [96, 636], [320, 636]];
  return pts.map(([x, y], i) => {
    const inner = `<path d="M${x - 7} ${y} l2 -10 l3 7 l2 -12 l3 12 l3 -8 l2 11z" fill="${t.tuft}" ${o(1.6)}/>`;
    return { piece: piece(inner, [x - 10, y - 16, 26, 20], 1, 0, 0, [x, y]), angle: 6, period: 2 + (i % 3) * 0.6 };
  });
}

export function flowerPieces(t: VillageTheme): SwayPiece[] {
  if (!t.flowers) return [];
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

// ── 반딧불이(밤) · 나비(낮) — 테마가 정한 입자만 ─────────────────

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

// ── 솔이 그림자 · 이웃 ────────────────────────────────────

export function shadowSvg(): string {
  const s = soliShadow();
  return full(`<ellipse cx="${s.cx}" cy="${s.cy}" rx="${s.rx}" ry="${s.ry}" fill="#000" opacity=".28"/>`);
}

/** 놀러 온 가까운 이웃 (최대 2명): 솔이 좌우 마당 18% · 82%. 단짝이면 하트 */
export function neighborsSvg(visitors: readonly VillageVisitor[]): string | null {
  const N = SCENE_PCT.neighbors;
  const nw = (SCENE_W * N.width) / 100;
  const bottom = yOf(N.bottom);
  const one = (v: VillageVisitor, cxPct: number) => {
    const cx = (SCENE_W * cxPct) / 100;
    const x = cx - nw / 2;
    const y = bottom - nw * 1.1;
    let g = `<ellipse cx="${cx.toFixed(1)}" cy="${(bottom - 2).toFixed(1)}" rx="${(nw * 0.36).toFixed(1)}" ry="4" fill="#000" opacity=".25"/>` + nest(faceSvg(FACES[v.face] ?? FACES[0]), x, y, nw);
    if (v.heart) g += `<g transform="translate(${(x + nw - 2).toFixed(1)} ${(y + 12).toFixed(1)}) scale(.85)">${HEART}</g>`;
    return g;
  };
  const [near, farV] = visitors;
  const s = (near ? one(near, N.cx[0]) : '') + (farV ? one(farV, N.cx[1]) : '');
  return s ? full(s) : null;
}

// ── 밭 5칸 ────────────────────────────────────────────

export const PLOT = { width: 68, height: 52, gap: 6, firstX: 13, y: 648 } as const;

/** 칸 하나: 흙 + 실제 작물 (빈 칸은 이랑 줄무늬). 상태 글자는 두지 않는다 */
export function plotCellSvg(slot: PlotSlot, t: VillageTheme): string {
  const c = t.soil;
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

// ── 꾸미기 · 마을 칸 썸네일 (시안 #31b의 작은 섬 그림) ─────────────────
// 메인 장면과 같은 테마 색에서 만든다 (그래서 꾸미기에서 보이는 색과 메인에서 보이는 색이 같다). 장면 전체를 그리지 않는 가벼운 한 장이다.

/** 썸네일 그림 크기 (시안 366×284 중 위 14를 잘라 4:3에 가깝게 슬라이스) */
export const THUMB = { width: 366, height: 284, cropTop: 14 } as const;

export function thumbSvg(t: VillageTheme): string {
  const dots = (pts: readonly (readonly [number, number])[], c: string, r: number) => pts.map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${r + (i % 3) * 0.8}" fill="${c}"/>`).join('');
  const thumbCloud = (x: number, y: number, k: number, f: string) => `<g transform="translate(${x} ${y}) scale(${k})">${CLOUD(f, 2.6 / k)}</g>`;
  const P: readonly (readonly [number, number])[] = [[40, 70], [300, 60], [330, 120], [24, 150], [120, 40], [210, 90], [70, 120], [260, 30], [170, 54], [350, 180]];
  let s = `<defs><linearGradient id="ts" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${t.sky[0]}"/><stop offset="1" stop-color="${t.sky[1]}"/></linearGradient></defs><rect width="366" height="284" fill="url(#ts)"/>`;
  if (t.stars) s += dots(P.slice(0, t.id === 'base' ? 4 : 10), '#FFE14D', 1.6);
  if (t.celestial === 'moon') s += `<path d="M290 44 A24 24 0 1 0 318 80 A18 18 0 1 1 290 44Z" fill="#FFE14D" ${o(3)}/>`;
  if (t.celestial === 'sun') s += `<circle cx="306" cy="58" r="22" fill="#FFE14D" ${o(3)}/>`;
  if (t.celestial === 'lowSun') s += `<circle cx="272" cy="196" r="42" fill="#FFE14D" ${o(3)}/>`;
  if (t.deco) {
    const [a, b] = t.deco.colors;
    s += dots(P.slice(0, 7), a, 3) + dots(P.map(([x, y]) => [x + 22, y + 18] as const).slice(0, 6), b, 2.4);
  }
  if (t.clouds) s += thumbCloud(36, 62, 1, t.clouds[0]) + thumbCloud(t.celestial === 'lowSun' ? 170 : 236, 44, 0.8, t.clouds[1]);
  s += `<rect x="-4" y="230" width="374" height="60" fill="${t.water}" ${o(3)}/><path d="M24 256q8-4 16 0M120 268q8-4 16 0M236 260q8-4 16 0M320 270q8-4 16 0" stroke="${t.wave}" stroke-width="2.5" stroke-linecap="round" fill="none"/>`;
  s += `<ellipse cx="183" cy="235" rx="125" ry="29" fill="${t.soil.soil}" ${o(3)}/><ellipse cx="183" cy="219" rx="125" ry="25" fill="${t.yard}" ${o(3)}/>`;
  const c = t.leaf[0];
  s += `<g transform="translate(70 166)"><path d="M20 54V34" ${o(7)}/><path d="M20 54V34" stroke="#8E5A38" stroke-width="3" stroke-linecap="round"/><circle cx="20" cy="20" r="15" fill="${c}" ${o(3)}/><circle cx="10" cy="30" r="9" fill="${c}" ${o(3)}/><circle cx="30" cy="30" r="9" fill="${c}" ${o(3)}/>${t.treeSnow ? `<path d="M8 14 Q20 2 32 14 Q20 10 8 14Z" fill="#FFFFFF" ${o(2)}/>` : ''}</g>`;
  if (t.flowers) s += [[110, 214, '#FF4FA0'], [250, 212, '#FFE14D'], [140, 226, '#C49BFF']].map(([x, y, col]) => `<circle cx="${x}" cy="${y}" r="4" fill="${col}" ${o(1.6)}/>`).join('');
  s += `<ellipse cx="183" cy="226" rx="40" ry="6" fill="#000" opacity=".2"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 ${THUMB.cropTop} ${THUMB.width} ${THUMB.height - THUMB.cropTop}" preserveAspectRatio="xMidYMid slice">${s}</svg>`;
}
