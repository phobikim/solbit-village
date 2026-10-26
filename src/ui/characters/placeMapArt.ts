// 보따리 지도 그림 (디자인 v9 15d "밤바다 위 솔빛 섬"): 가운데 솔빛 마을 섬 + 산 · 숲 · 한강 물줄기, 먼 곳은 작은 섬.
// 다녀온 곳 = 초록 발자국 길(점선), 갈 곳 = 흐린 점선 + 깃발. 이장이 미는 곳은 노란 깃발 + 퍼지는 동그라미.
// 좌표는 모두 지도 칸(px). 핀 자리는 domain/placeMap.ts가 정하고 화면이 px로 바꿔 넘긴다.

import { fonts } from '../theme';
import { L } from './svg';

export type MapFilter = 'all' | 'foot' | 'flag';

export type MapArtPin = {
  id: string;
  name: string;
  x: number;
  y: number;
  visited: boolean;
  /** 이장이 미는 깃발 (오래 담아둔 곳) */
  pushed: boolean;
};

export type MapArtInput = {
  w: number;
  h: number;
  /** 솔빛 마을 자리 */
  center: { x: number; y: number };
  pins: readonly MapArtPin[];
  /** 마을에서 다녀온 순서대로 이은 발자국 길 (마을 포함) */
  trail: readonly { x: number; y: number }[];
  filter: MapFilter;
  selectedId: string | null;
  night?: boolean;
};

/** 가운데 큰 섬이 덮는 범위 (마을 기준, 지도 칸 크기에 비례) */
export const MAIN_ISLAND = { rx: 0.25, ry: 0.28 };

const SEA = '#19204F';
const SEA_EDGE = '#333C7A';
const LAND = '#2A4A3A';
const LAND_EDGE = L;
const GREEN = '#A8EB5A';
const PINK = '#FF4FA0';
const YELLOW = '#FFE14D';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const f = (n: number) => n.toFixed(1);

/** 점들을 지나는 매끄러운 닫힌 곡선 (Catmull-Rom → 3차 베지어) */
function blob(points: readonly [number, number][]): string {
  const n = points.length;
  let d = `M${f(points[0][0])} ${f(points[0][1])}`;
  for (let i = 0; i < n; i++) {
    const p0 = points[(i - 1 + n) % n];
    const p1 = points[i];
    const p2 = points[(i + 1) % n];
    const p3 = points[(i + 2) % n];
    const c1: [number, number] = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2: [number, number] = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${f(c1[0])} ${f(c1[1])} ${f(c2[0])} ${f(c2[1])} ${f(p2[0])} ${f(p2[1])}`;
  }
  return d + 'Z';
}

/** 이름으로 정해지는 0~1 값 (같은 장소는 늘 같은 섬 모양) */
function seeded(name: string, salt: number): number {
  let h = 2166136261 ^ salt;
  for (const ch of name) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return ((h >>> 0) % 1000) / 1000;
}

const STARS: readonly [number, number][] = [
  [0.08, 0.1], [0.2, 0.05], [0.33, 0.12], [0.55, 0.07], [0.7, 0.16], [0.9, 0.3], [0.05, 0.42], [0.93, 0.55],
  [0.12, 0.66], [0.82, 0.72], [0.45, 0.93], [0.28, 0.85], [0.64, 0.9], [0.95, 0.9],
];
const WAVES: readonly [number, number][] = [
  [0.12, 0.38], [0.78, 0.46], [0.06, 0.78], [0.62, 0.8], [0.84, 0.86], [0.4, 0.2], [0.82, 0.18],
];

const label = (text: string, cx: number, y: number, w: number, hot = false) => {
  const width = Math.max(30, text.length * 12.5 + 16);
  const x = Math.min(w - width - 6, Math.max(6, cx - width / 2));
  return (
    `<rect x="${f(x)}" y="${f(y)}" width="${f(width)}" height="21" rx="10.5" fill="${hot ? YELLOW : '#141A44'}" stroke="${hot ? L : '#333C7A'}" stroke-width="${hot ? 2.4 : 1.5}"/>` +
    `<text x="${f(x + width / 2)}" y="${f(y + 15)}" text-anchor="middle" font-family="${fonts.bodyHeavy}" font-size="12" fill="${hot ? L : '#FFFFFF'}">${esc(text)}</text>`
  );
};

/** 발자국 핀: 초록 테두리 동그라미 + 발자국 */
const footPin = (p: MapArtPin, selected: boolean) => {
  const r = 17;
  const toe = (dx: number, dy: number) => `<ellipse cx="${f(p.x + dx)}" cy="${f(p.y + dy)}" rx="1.8" ry="2.3" fill="${GREEN}"/>`;
  const sole = (dx: number, dy: number, rot: number) =>
    `<g transform="rotate(${rot} ${f(p.x + dx)} ${f(p.y + dy)})"><ellipse cx="${f(p.x + dx)}" cy="${f(p.y + dy + 4)}" rx="3.2" ry="4.6" fill="${GREEN}"/>${toe(dx - 2.4, dy - 3)}${toe(dx + 0.2, dy - 4.6)}${toe(dx + 2.8, dy - 3.2)}</g>`;
  return (
    `<ellipse cx="${f(p.x)}" cy="${f(p.y + r + 2)}" rx="${r - 3}" ry="3.5" fill="#000" opacity=".3"/>` +
    (selected ? `<circle cx="${f(p.x)}" cy="${f(p.y)}" r="${r + 7}" fill="none" stroke="#FFFFFF" stroke-width="2.5" opacity=".85"/>` : '') +
    `<circle cx="${f(p.x)}" cy="${f(p.y)}" r="${r}" fill="#162338" stroke="${L}" stroke-width="2"/>` +
    `<circle cx="${f(p.x)}" cy="${f(p.y)}" r="${r - 2}" fill="none" stroke="${GREEN}" stroke-width="3.2"/>` +
    sole(-3.5, -2.5, -12) +
    sole(3.8, 1.5, 12)
  );
};

/** 깃발 핀: 흰 깃대 + 깃발. 이장이 미는 곳은 노란 깃발 + 퍼지는 동그라미 */
const flagPin = (p: MapArtPin, selected: boolean) => {
  const col = p.pushed ? YELLOW : PINK;
  const px = p.x - 8;
  const top = p.y - 36;
  const rings = p.pushed
    ? `<circle cx="${f(p.x)}" cy="${f(p.y)}" r="34" fill="${YELLOW}" opacity=".10"/><circle cx="${f(p.x)}" cy="${f(p.y)}" r="25" fill="none" stroke="${YELLOW}" stroke-width="2.5" opacity=".55"/>`
    : '';
  return (
    rings +
    (selected ? `<circle cx="${f(p.x)}" cy="${f(p.y)}" r="${p.pushed ? 40 : 22}" fill="none" stroke="#FFFFFF" stroke-width="2.5" opacity=".85"/>` : '') +
    `<ellipse cx="${f(p.x)}" cy="${f(p.y + 1)}" rx="8" ry="3" fill="#000" opacity=".35"/>` +
    `<path d="M${f(px + 1.5)} ${f(top + 2)} V${f(p.y)}" stroke="${L}" stroke-width="6" stroke-linecap="round"/>` +
    `<path d="M${f(px + 1.5)} ${f(top + 2)} V${f(p.y)}" stroke="#FFFFFF" stroke-width="2.6" stroke-linecap="round"/>` +
    `<path d="M${f(px + 3)} ${f(top)} H${f(px + 27)} L${f(px + 20)} ${f(top + 8)} L${f(px + 27)} ${f(top + 16)} H${f(px + 3)}Z" fill="${col}" stroke="${L}" stroke-width="2.4" stroke-linejoin="round"/>`
  );
};

export function placeMapSvg(o: MapArtInput): string {
  const { w, h, center: c } = o;
  const k = Math.min(w, h) / 400;
  const showFoot = o.filter !== 'flag';
  const showFlag = o.filter !== 'foot';
  const pins = o.pins.filter((p) => (p.visited ? showFoot : showFlag));
  const rx = w * MAIN_ISLAND.rx;
  const ry = h * MAIN_ISLAND.ry;

  let s = `<rect x="1.5" y="1.5" width="${f(w - 3)}" height="${f(h - 3)}" rx="26" fill="${SEA}" stroke="${SEA_EDGE}" stroke-width="3"/>`;
  s += `<clipPath id="mclip"><rect x="3" y="3" width="${f(w - 6)}" height="${f(h - 6)}" rx="24"/></clipPath><g clip-path="url(#mclip)">`;

  // 별 · 물결
  s += STARS.map(([x, y], i) => `<circle cx="${f(w * x)}" cy="${f(h * y)}" r="${i % 3 === 0 ? 2 : 1.4}" fill="#C9CEF5" opacity="${i % 2 ? 0.45 : 0.75}"/>`).join('');
  s += WAVES.map(([x, y]) => `<path d="M${f(w * x)} ${f(h * y)} q6 -6 12 0 t12 0" fill="none" stroke="#3A4690" stroke-width="2.6" stroke-linecap="round"/>`).join('');

  // 가운데 섬 (솔빛 마을)
  const main = (
    [[0, -1], [0.62, -0.82], [0.98, -0.2], [0.82, 0.5], [0.22, 0.98], [-0.45, 0.78], [-1, 0.1], [-0.72, -0.66]] as [number, number][]
  ).map(([dx, dy]): [number, number] => [c.x + dx * rx, c.y + dy * ry]);
  const onMain = (p: { x: number; y: number }) => ((p.x - c.x) / (rx * 1.05)) ** 2 + ((p.y - c.y) / (ry * 1.05)) ** 2 <= 1;

  // 먼 곳: 작은 섬 (섬이 겹쳐 보이지 않게 핀 뒤에 깐다)
  for (const p of pins) {
    if (onMain(p)) continue;
    const base = 30 + seeded(p.name, 1) * 14;
    const away = Math.atan2(p.y - c.y, p.x - c.x);
    const cx = p.x + Math.cos(away) * 14;
    const cy = p.y + Math.sin(away) * 10;
    const pts = Array.from({ length: 7 }, (_, i): [number, number] => {
      const a = (i / 7) * Math.PI * 2;
      const r = base * (0.82 + seeded(p.name, 10 + i) * 0.4);
      return [cx + Math.cos(a) * r * 1.35, cy + Math.sin(a) * r * 0.9];
    });
    s += `<path d="${blob(pts)}" fill="${LAND}" stroke="${LAND_EDGE}" stroke-width="3.5"/>`;
  }

  s += `<path d="${blob(main)}" fill="${LAND}" stroke="${LAND_EDGE}" stroke-width="4"/>`;
  // 언덕 하이라이트
  s += `<path d="M${f(c.x - rx * 0.55)} ${f(c.y - ry * 0.72)} Q${f(c.x)} ${f(c.y - ry * 0.98)} ${f(c.x + rx * 0.5)} ${f(c.y - ry * 0.72)}" fill="none" stroke="#3C6A52" stroke-width="5" stroke-linecap="round" opacity=".7"/>`;
  // 한강 물줄기
  const ry0 = c.y - ry * 0.5;
  const river = `M${f(c.x - rx * 0.92)} ${f(ry0 + 4 * k)} C${f(c.x - rx * 0.4)} ${f(ry0 - 12 * k)} ${f(c.x + rx * 0.1)} ${f(ry0 + 6 * k)} ${f(c.x + rx * 0.95)} ${f(ry0 - 6 * k)}`;
  s += `<path d="${river}" fill="none" stroke="${L}" stroke-width="10" stroke-linecap="round"/><path d="${river}" fill="none" stroke="#2D5AA6" stroke-width="6" stroke-linecap="round"/>`;
  // 숲
  const tree = (x: number, y: number, r: number) =>
    `<path d="M${f(x)} ${f(y + r)} V${f(y + r + 11 * k)}" stroke="${L}" stroke-width="3" stroke-linecap="round"/><circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="#3F8F57" stroke="${L}" stroke-width="2.4"/>`;
  s += tree(c.x - rx * 0.62, c.y - ry * 0.12, 11 * k) + tree(c.x - rx * 0.55, c.y + ry * 0.2, 10 * k) + tree(c.x - rx * 0.45, c.y - ry * 0.32, 9 * k);
  // 산
  const mount = (x: number, y: number, mw: number, mh: number) =>
    `<path d="M${f(x - mw / 2)} ${f(y)} L${f(x)} ${f(y - mh)} L${f(x + mw / 2)} ${f(y)}Z" fill="#3E7A5C" stroke="${L}" stroke-width="2.6" stroke-linejoin="round"/>` +
    `<path d="M${f(x - mw * 0.14)} ${f(y - mh * 0.72)} L${f(x)} ${f(y - mh)} L${f(x + mw * 0.14)} ${f(y - mh * 0.72)} L${f(x)} ${f(y - mh * 0.6)}Z" fill="#E9F0FF"/>`;
  s += mount(c.x + rx * 0.42, c.y + ry * 0.5, 40 * k, 34 * k) + mount(c.x + rx * 0.7, c.y + ry * 0.58, 28 * k, 24 * k);
  // 돛단배
  const bx = c.x + rx * 1.18;
  const by = c.y + ry * 0.12;
  s += `<path d="M${f(bx - 12)} ${f(by + 6)} H${f(bx + 14)} L${f(bx + 9)} ${f(by + 13)} H${f(bx - 7)}Z" fill="${PINK}" stroke="${L}" stroke-width="2.2" stroke-linejoin="round"/><path d="M${f(bx + 1)} ${f(by - 14)} V${f(by + 5)} H${f(bx + 14)}Z" fill="#FFFFFF" stroke="${L}" stroke-width="2" stroke-linejoin="round"/>`;

  // 길: 다녀온 길(초록 점선), 갈 곳(흐린 점선), 이장이 미는 곳(노란 점선)
  if (showFoot && o.trail.length > 1) {
    const d = o.trail.map((t, i) => `${i ? 'L' : 'M'}${f(t.x)} ${f(t.y)}`).join(' ');
    s += `<path d="${d}" fill="none" stroke="${GREEN}" stroke-width="4" stroke-linecap="round" stroke-dasharray="0.1 9"/>`;
  }
  if (showFlag) {
    for (const p of pins.filter((q) => !q.visited)) {
      s += `<path d="M${f(c.x)} ${f(c.y)} L${f(p.x)} ${f(p.y)}" stroke="${p.pushed ? YELLOW : '#7C84C8'}" stroke-width="2.6" stroke-linecap="round" stroke-dasharray="8 8" fill="none"/>`;
    }
  }

  // 솔빛 마을
  s += `<ellipse cx="${f(c.x)}" cy="${f(c.y + 24)}" rx="20" ry="4" fill="#000" opacity=".3"/>`;
  s += `<circle cx="${f(c.x)}" cy="${f(c.y)}" r="23" fill="${YELLOW}" stroke="${L}" stroke-width="3"/>`;
  s += `<path d="M${f(c.x - 11)} ${f(c.y + 1)} L${f(c.x)} ${f(c.y - 10)} L${f(c.x + 11)} ${f(c.y + 1)}Z" fill="${PINK}" stroke="${L}" stroke-width="2.2" stroke-linejoin="round"/><rect x="${f(c.x - 8)}" y="${f(c.y + 1)}" width="16" height="11" rx="2" fill="#FFF6D6" stroke="${L}" stroke-width="2.2"/><rect x="${f(c.x - 2.5)}" y="${f(c.y + 5)}" width="5" height="7" rx="1" fill="${L}"/>`;
  s += label('솔빛 마을', c.x, c.y + 28, w, true);

  // 핀과 이름표
  for (const p of pins) {
    const sel = p.id === o.selectedId;
    if (p.visited) s += footPin(p, sel) + label(p.name, p.x, p.y - 44, w);
    else s += flagPin(p, sel) + label(p.name, p.x, p.y + 6, w, p.pushed);
  }

  // 나침반
  const nx = w - 44;
  const ny = 54;
  s += `<text x="${f(nx)}" y="${f(ny - 28)}" text-anchor="middle" font-family="${fonts.numberBold}" font-size="11" fill="${YELLOW}">N</text>`;
  s += `<circle cx="${f(nx)}" cy="${f(ny)}" r="23" fill="#141A44" stroke="${SEA_EDGE}" stroke-width="3"/>`;
  s += `<path d="M${f(nx)} ${f(ny - 15)} L${f(nx + 5)} ${f(ny)} L${f(nx)} ${f(ny + 3)}Z" fill="${YELLOW}"/><path d="M${f(nx)} ${f(ny + 15)} L${f(nx - 5)} ${f(ny)} L${f(nx)} ${f(ny - 3)}Z" fill="#7C84C8"/>`;

  // 범례
  const ly = h - 40;
  s += `<rect x="14" y="${f(ly)}" width="148" height="28" rx="14" fill="#141A44" opacity=".92"/>`;
  s += `<path d="M26 ${f(ly + 14)} h18" stroke="${GREEN}" stroke-width="3.4" stroke-linecap="round" stroke-dasharray="0.1 6"/>`;
  s += `<text x="50" y="${f(ly + 19)}" font-family="${fonts.bodyHeavy}" font-size="12" fill="#C9CEF5">다녀옴</text>`;
  s += `<path d="M100 ${f(ly + 14)} h18" stroke="#7C84C8" stroke-width="3" stroke-linecap="round" stroke-dasharray="6 5"/>`;
  s += `<text x="124" y="${f(ly + 19)}" font-family="${fonts.bodyHeavy}" font-size="12" fill="#C9CEF5">갈 데</text>`;

  s += '</g>';
  return `<svg viewBox="0 0 ${f(w)} ${f(h)}" xmlns="http://www.w3.org/2000/svg">${s}</svg>`;
}

/** 지도 칸 안에서 마을이 놓이는 자리 (칸 가운데보다 살짝 아래) */
export const MAP_CENTER = { x: 0.5, y: 0.5 };
