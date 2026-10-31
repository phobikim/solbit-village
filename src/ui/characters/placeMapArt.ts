// 보따리 지도 그림 (디자인 TURN 34·35, 시트 5 쉼터의 mapInner / flag B안 이식): 밤바다 위 솔빛 섬 + 작은 섬 + 핀 깃발.
// 지도에는 가고 싶은 곳(깃발)만 그린다 — 발자국 · 다녀온 길 · 범례의 "다녀옴"은 없다.
// 좌표는 도면 단위(366 x 400, domain/placeMap.ts MAP_SIZE). 깃발 자리와 섬 자리는 domain/placeMap.ts가 정한다.
// react-native-svg는 SMIL(<animate>)을 못 그려서, 움직이는 것(퍼지는 동그라미 · 새 섬 반짝임)은 placeMapFxSvg로 따로 그려
// 화면이 투명도로 깜빡인다.

import type { FlagKind } from '../../domain/placeMap';
import { MAP_SIZE } from '../../domain/placeMap';
import { fonts } from '../theme';
import { L } from './svg';

export type MapArtFlag = {
  id: string;
  name: string;
  kind: FlagKind;
  /** 날짜 잡은 곳의 D-day 배지 글자 ("D-3") */
  dday?: string;
  x: number;
  y: number;
};

export type MapArtIsland = { cx: number; cy: number; fresh: boolean };

export type MapArtInput = {
  flags: readonly MapArtFlag[];
  /** 생긴 작은 섬 (순서대로) */
  islands: readonly MapArtIsland[];
  selectedId: string | null;
};

const PINK = '#FF4FA0';
const YELLOW = '#FFE14D';
const GREEN = '#A8EB5A';
const LAND = '#2C4A3E';
const LAND_HI = '#35594A';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const n1 = (n: number) => String(Math.round(n * 10) / 10);

/**
 * 지도에 보이는 도면 구간. 작은 섬이 없으면 위아래 30씩 덜어 내(칸 366 x 340) 시안 15c · 15d와 같고,
 * 작은 섬이 생기면 필요한 만큼 넓힌다 (위쪽 섬 → 위로, 왼쪽 아래 섬 → 아래로).
 */
export function mapView(islandCount: number): { x: number; y: number; w: number; h: number } {
  const top = islandCount > 0 ? 0 : 30;
  const bottom = islandCount >= 2 ? MAP_SIZE.h : 370;
  return { x: 0, y: top, w: MAP_SIZE.w, h: bottom - top };
}

/** 반짝임 (4갈래 별) */
const sparkle = (x: number, y: number, r: number, c: string) =>
  `<path transform="translate(${n1(x)} ${n1(y)})" d="M0 ${-r} Q0 0 ${r} 0 Q0 0 0 ${r} Q0 0 ${-r} 0 Q0 0 0 ${-r}Z" fill="${c}"/>`;

/**
 * 핀 깃발 (B안): 바닥이 한 점인 핀 머리 안에 깃발. (0, 0)이 바닥.
 * 가고 싶은 곳(분홍) / 이장이 미는 곳(노랑) / 날짜 잡은 곳(핀 머리 위 D-day 배지).
 */
export function pinFlagSvg(f: Pick<MapArtFlag, 'name' | 'kind' | 'dday'>, o: { selected?: boolean; noLabel?: boolean } = {}): string {
  const col = f.kind === 'ijang' ? YELLOW : PINK;
  const fs = 11;
  const lw = f.name.length * fs + 14;
  let s = '';
  if (o.selected) s += `<ellipse cy="1" rx="22" ry="8" fill="#FFFFFF" fill-opacity=".14" stroke="#FFFFFF" stroke-width="3"/>`;
  s += `<ellipse cx="1" cy="1" rx="9" ry="3" fill="#000" opacity=".35"/>`;
  s += `<path d="M0 0 C-3 -6 -15 -13 -15 -25 A15 15 0 1 1 15 -25 C15 -13 3 -6 0 0Z" fill="${col}" stroke="${L}" stroke-width="3" stroke-linejoin="round"/>`;
  s += `<path d="M-4.5 -17.5 V-33" stroke="${L}" stroke-width="2.6" stroke-linecap="round"/>`;
  s += `<path d="M-4 -33 H7 L4 -29.5 L7 -26 H-4Z" fill="#FFFFFF" stroke="${L}" stroke-width="2" stroke-linejoin="round"/>`;
  if (f.kind === 'date') {
    s += `<rect x="5" y="-52" width="30" height="16" rx="8" fill="${GREEN}" stroke="${L}" stroke-width="2.2"/>`;
    s += `<text x="20" y="-40.4" text-anchor="middle" font-family="${fonts.numberBold}" font-size="10" fill="${L}">${esc(f.dday ?? '')}</text>`;
  }
  if (!o.noLabel) {
    const ij = f.kind === 'ijang';
    s += `<rect x="${n1(-lw / 2)}" y="7" width="${lw}" height="19" rx="9.5" fill="${ij ? YELLOW : '#141A3E'}" stroke="${L}" stroke-width="2.2"/>`;
    s += `<text y="20.5" text-anchor="middle" font-family="${fonts.bodyHeavy}" font-size="${fs}" fill="${ij ? L : '#FFFFFF'}">${esc(f.name)}</text>`;
  }
  return s;
}

/** 깃발 카드 왼쪽 작은 아이콘 (이름표 없이 핀만) */
export function flagIconSvg(kind: FlagKind, dday?: string): string {
  return `<svg viewBox="-22 -56 56 62" xmlns="http://www.w3.org/2000/svg">${pinFlagSvg({ name: '', kind, dday }, { noLabel: true })}</svg>`;
}

const STARS: readonly [number, number][] = [
  [110, 30], [210, 22], [20, 150], [340, 160], [230, 378], [20, 250],
];
const WAVES: readonly string[] = [
  'M30 196', 'M312 128', 'M150 370', 'M300 372', 'M318 216', 'M14 296', 'M130 40',
];

/** 작은 섬 하나 */
const smallIsland = (cx: number, cy: number) =>
  `<path d="M${cx - 52} ${cy + 8} C${cx - 50} ${cy - 14} ${cx - 20} ${cy - 22} ${cx + 4} ${cy - 20} C${cx + 34} ${cy - 20} ${cx + 54} ${cy - 8} ${cx + 52} ${cy + 8} C${cx + 50} ${cy + 24} ${cx + 20} ${cy + 28} ${cx} ${cy + 26} C${cx - 28} ${cy + 28} ${cx - 54} ${cy + 24} ${cx - 52} ${cy + 8}Z" fill="${LAND}" stroke="${L}" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/>` +
  `<path d="M${cx - 36} ${cy - 6} C${cx - 20} ${cy - 16} ${cx + 10} ${cy - 16} ${cx + 30} ${cy - 10}" stroke="${LAND_HI}" stroke-width="7" stroke-linecap="round" fill="none"/>`;

/** 움직이지 않는 그림: 바다 · 별 · 물결 · 솔빛 섬 · 작은 섬 · 마을 · 깃발 */
export function placeMapSvg(input: MapArtInput): string {
  const v = mapView(input.islands.length);
  let s = '<rect x="-300" y="-300" width="966" height="1000" fill="#1B2A55"/>';
  s += `<g fill="#FFFFFF" opacity=".5">${STARS.map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${[1.4, 1.1, 1.1, 1.2, 1.3, 1][i]}"/>`).join('')}</g>`;
  s += `<g stroke="#2E4380" stroke-width="2.6" stroke-linecap="round" fill="none">${WAVES.map((m) => `<path d="${m} q6 -5 12 0 q6 5 12 0"/>`).join('')}</g>`;

  // 가운데 솔빛 섬 + 능선 + 산 + 숲
  s += `<path d="M120 104 C160 80 236 84 270 112 C304 140 306 196 290 236 C278 270 292 300 256 322 C220 344 150 340 120 314 C92 290 66 262 70 214 C74 166 84 128 120 104Z" fill="${LAND}" stroke="${L}" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/>`;
  s += `<path d="M128 116 C160 96 226 98 256 120" stroke="${LAND_HI}" stroke-width="10" stroke-linecap="round" fill="none"/>`;
  s += `<path d="M164 134 L186 104 L208 134Z" fill="#3E6A55" stroke="${L}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>`;
  s += `<path d="M196 136 L212 114 L228 136Z" fill="${LAND_HI}" stroke="${L}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>`;
  s += `<path d="M179 114 L186 104 L193 114 L186 118Z" fill="#E4E8FF"/>`;
  s += `<g stroke="${L}" stroke-width="2.6"><path d="M84 214 V224 M98 202 V214 M296 206 V216" stroke-linecap="round"/><circle cx="84" cy="208" r="8.5" fill="#4F8A5A"/><circle cx="98" cy="196" r="8" fill="#5FB04A"/><circle cx="296" cy="200" r="7.5" fill="#4F8A5A"/></g>`;

  for (const i of input.islands) s += smallIsland(i.cx, i.cy);

  // 솔빛 마을
  s += `<g transform="translate(186 206)"><ellipse cy="22" rx="18" ry="4" fill="#000" opacity=".35"/><circle r="21" fill="${YELLOW}" stroke="${L}" stroke-width="3.5"/>`;
  s += `<path d="M-9 1 L0 -8 L9 1 V10 H-9Z" fill="${PINK}" stroke="${L}" stroke-width="2.6" stroke-linejoin="round"/>`;
  s += `<path d="M-12 3 L0 -10 L12 3" stroke="${L}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/><rect x="-2.5" y="4" width="5" height="6" fill="${L}"/>`;
  s += `<rect x="-30" y="26" width="60" height="20" rx="8" fill="${YELLOW}" stroke="${L}" stroke-width="2.5"/>`;
  s += `<text y="40" text-anchor="middle" font-family="${fonts.bodyHeavy}" font-size="11.5" fill="${L}">솔빛 마을</text></g>`;

  // 깃발: 아래쪽이 위로 올라오게 y 순서로
  for (const f of [...input.flags].sort((a, b) => a.y - b.y)) {
    s += `<g transform="translate(${n1(f.x)} ${n1(f.y)})">${pinFlagSvg(f, { selected: f.id === input.selectedId })}</g>`;
  }
  return `<svg viewBox="${v.x} ${v.y} ${v.w} ${v.h}" xmlns="http://www.w3.org/2000/svg">${s}</svg>`;
}

/**
 * 깜빡이는 것: 이장이 미는 곳의 퍼지는 동그라미 두 겹 + 새로 생긴 작은 섬의 반짝임.
 * placeMapSvg와 같은 viewBox라 위에 겹쳐 놓으면 맞는다. 보일 게 없으면 null.
 */
export function placeMapFxSvg(input: MapArtInput): string | null {
  const v = mapView(input.islands.length);
  let s = '';
  for (const f of input.flags.filter((x) => x.kind === 'ijang')) {
    s += `<circle cx="${n1(f.x)}" cy="${n1(f.y)}" r="14" fill="none" stroke="${YELLOW}" stroke-width="2.5" opacity=".9"/>`;
    s += `<circle cx="${n1(f.x)}" cy="${n1(f.y)}" r="26" fill="none" stroke="${YELLOW}" stroke-width="2.5" opacity=".4"/>`;
  }
  for (const i of input.islands.filter((x) => x.fresh)) {
    s += [[-58, -24], [56, -22], [0, -36]].map(([dx, dy]) => sparkle(i.cx + dx, i.cy + dy, 6, YELLOW)).join('');
  }
  return s ? `<svg viewBox="${v.x} ${v.y} ${v.w} ${v.h}" xmlns="http://www.w3.org/2000/svg">${s}</svg>` : null;
}
