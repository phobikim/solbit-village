// 메인 마을 무대 (7a) — design/solbit-v5.dc.html의 village3() 이식.
// 원본은 고정 그림이었고, 여기서는 날씨·밭·이웃·현수막·등불·냇가 꽃을 매개변수로 받는다.
// viewBox 0 0 366 340.

import type { PlotSlot, TimeOfDay, Weather } from '../../domain/types';
import { plotCrop } from './crops';
import { npcSvg, type NpcHair } from './neighbors';
import { soliSvg, type SoliMood } from './soli';
import { bud, cloud, flower, L, nest, o, star, svgBodyFont } from './svg';

export const VILLAGE_VIEWBOX = { width: 366, height: 340 } as const;

export type VillageVisitor = { color: string; hair: NpcHair; heart?: boolean };

export type VillageSceneParams = {
  timeOfDay: TimeOfDay;
  weather: Weather;
  /** 밭 5칸 */
  plots: readonly PlotSlot[];
  soliMood: SoliMood;
  /** 마을에 놀러 온 가까운 이웃 (최대 2명 표시) */
  visitors: readonly VillageVisitor[];
  /** 가장 가까운 행사 현수막 문구. 없으면 현수막을 걸지 않는다. */
  bannerText: string | null;
  /** 야근이면 밭 옆 등불이 켜짐 */
  lanternOn: boolean;
  /** 냇가 꽃이 핀 정도 0~1 (여가) */
  bloom: number;
};

type Palette = {
  s1: string;
  s2: string;
  hill: string;
  ground: string;
  yard: string;
  yardSpot: string;
  soil: string;
  soilLine: string;
  hut: string;
  wood: string;
  water: string;
  hi: string;
  rock: string;
  cloud: string;
  darkCloud: string;
  window: string;
};

const NIGHT: Palette = {
  s1: '#141A44',
  s2: '#34307C',
  hill: '#212C5C',
  ground: '#24435F',
  yard: '#3E3966',
  yardSpot: '#565083',
  soil: '#5A3E5E',
  soilLine: '#45304A',
  hut: '#7A5446',
  wood: '#B9825A',
  water: '#2D5AA6',
  hi: '#5FD8FF',
  rock: '#6A6F9E',
  cloud: '#4A4F9C',
  darkCloud: '#2A2846',
  window: '#FFE14D',
};

// 낮 색은 시안 village(낮) 팔레트에서 가져옴. 낮 무대 시안은 따로 없다.
const DAY: Palette = {
  s1: '#7FCBFF',
  s2: '#D8F2FF',
  hill: '#9BE38A',
  ground: '#74D068',
  yard: '#A6E38E',
  yardSpot: '#8ACB74',
  soil: '#C98E5E',
  soilLine: '#A9714A',
  hut: '#E8B88A',
  wood: '#E0A86E',
  water: '#5FD8FF',
  hi: '#FFFFFF',
  rock: '#B8BCD8',
  cloud: '#FFFFFF',
  darkCloud: '#9AA3C8',
  window: '#BFEBFF',
};

const PLOT_X = [10, 34.8, 59.6, 84.4, 109.2] as const;

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function sky(p: VillageSceneParams, c: Palette): string {
  const night = p.timeOfDay === 'night';
  const storm = p.weather === 'storm';
  let s = '';
  if (night && !storm) {
    const stars: [number, number, number][] = [
      [18, 22, 4], [62, 90, 3], [138, 16, 5], [236, 22, 3], [264, 96, 4],
      [210, 110, 3], [350, 104, 4], [12, 128, 3], [296, 64, 3],
    ];
    // 날씨가 나쁠수록 별이 덜 보인다
    const visible = p.weather === 'sun' ? stars.length : p.weather === 'cloud' ? 9 : p.weather === 'over' ? 5 : 3;
    s += stars.slice(0, visible).map((a) => star(...a)).join('');
    s += `<path d="M322 16 A22 22 0 1 0 348 50 A17 17 0 1 1 322 16Z" fill="#FFE14D" ${o(3)}/>`;
  } else if (!night && !storm && p.weather !== 'rain') {
    s += [0, 1, 2, 3, 4, 5, 6, 7]
      .map((i) => {
        const a = (i * Math.PI) / 4;
        return `<path d="M${(322 + Math.cos(a) * 26).toFixed(1)} ${(40 + Math.sin(a) * 26).toFixed(1)} L${(322 + Math.cos(a) * 33).toFixed(1)} ${(40 + Math.sin(a) * 33).toFixed(1)}" stroke="${L}" stroke-width="4" stroke-linecap="round"/>`;
      })
      .join('') + `<circle cx="322" cy="40" r="19" fill="#FFE14D" ${o(3)}/>`;
  }
  const drops = (x: number, y: number) =>
    `<path d="M${x} ${y} l-3 8 M${x + 12} ${y + 2} l-3 8 M${x + 24} ${y} l-3 8" stroke="#5FD8FF" stroke-width="3" stroke-linecap="round"/>`;
  switch (p.weather) {
    case 'sun':
      break;
    case 'cloud':
      s += cloud(58, 50, 1.1, c.cloud) + cloud(172, 40, 0.85, c.darkCloud);
      break;
    case 'over':
      s += cloud(58, 50, 1.1, c.cloud) + cloud(172, 40, 0.85, c.darkCloud) + cloud(262, 64, 0.9, c.cloud);
      break;
    case 'rain':
      s += cloud(58, 50, 1.1, c.darkCloud) + cloud(172, 40, 0.85, c.darkCloud) + cloud(270, 30, 0.9, c.darkCloud);
      s += drops(64, 68) + drops(178, 58) + drops(276, 48);
      break;
    case 'storm':
      s += cloud(40, 44, 1.2, c.darkCloud) + cloud(160, 32, 1.1, c.darkCloud) + cloud(270, 40, 1.1, c.darkCloud);
      s += drops(52, 66) + drops(286, 60);
      s += `<path d="M186 54 L174 74 H184 L176 96 L196 68 H186 L194 54Z" fill="#FFE14D" ${o(2.5)}/>`;
      break;
  }
  return s;
}

/** 무대 하늘 맨 위 색. 그림보다 세로로 긴 칸에서 위쪽 여백을 이 색으로 채운다. */
export function villageSkyTop(t: TimeOfDay): string {
  return (t === 'night' ? NIGHT : DAY).s1;
}

/**
 * fit: 칸이 그림보다 세로로 길면 'meet'(아래 정렬, 위는 하늘색 여백),
 * 가로로 길면 'slice'(아래 정렬, 하늘 위쪽이 잘림). 어느 쪽이든 땅·밭·현수막은 잘리지 않는다.
 */
export function villageSceneSvg(p: VillageSceneParams, fit: 'meet' | 'slice' = 'slice'): string {
  const night = p.timeOfDay === 'night';
  const c = night ? NIGHT : DAY;
  const id = night ? 'vn' : 'vd';
  const glow = (cx: number, cy: number, r: number, extra = '') =>
    night ? `<circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#${id}g)" ${extra}/>` : '';

  let s =
    `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c.s1}"/><stop offset=".55" stop-color="${c.s2}"/></linearGradient>` +
    `<radialGradient id="${id}g"><stop offset="0" stop-color="#FFE14D" stop-opacity=".6"/><stop offset="1" stop-color="#FFE14D" stop-opacity="0"/></radialGradient></defs>` +
    `<rect width="366" height="340" fill="url(#${id})"/>`;

  s += sky(p, c);

  // 언덕 · 땅
  s += `<path d="M-4 168 C60 142 122 150 184 160 C244 170 300 140 370 150 V344 H-4Z" fill="${c.hill}" ${o(3)}/>`;
  s += `<path d="M-4 196 C100 184 262 190 370 184 V344 H-4Z" fill="${c.ground}" ${o(3)}/>`;

  // 오두막 (TODO: 마을 레벨에 따라 건물 수·디자인 변경 — 단계 4 이후, 레벨 곡선 미정)
  s += glow(194, 176, 22);
  s += `<rect x="174" y="168" width="38" height="24" rx="4" fill="${c.hut}" ${o(2.5)}/><path d="M167 171 L193 151 L219 171Z" fill="#FF4FA0" ${o(2.5)}/><rect x="179" y="178" width="8" height="14" rx="2" fill="${c.wood}" ${o(2)}/><rect x="192" y="175" width="12" height="9" rx="2" fill="${c.window}" ${o(2)}/>`;
  s += `<path d="M193 151 C193 146 195 144 197 142" stroke="${L}" stroke-width="4" stroke-linecap="round" fill="none"/><path d="M196 143 C193 139 188 139 186 142 C189 145 193 146 196 143Z M197 142 C200 138 205 137 207 139 C205 143 200 144 197 142Z" fill="#B6F35C" ${o(1.8)}/>`;

  // 밭 5칸
  if (p.lanternOn) s += glow(150, 156, 40);
  s += glow(34, 180, 30, 'opacity=".55"');
  const plot = (x: number) =>
    `<path d="M${x} 206 L${x + 2} 190 Q${x + 2.6} 186 ${x + 6} 186 H${x + 17} Q${x + 20.4} 186 ${x + 21} 190 L${x + 23} 206Z" fill="${c.soil}" ${o(2.5)}/><path d="M${x + 4} 199 H${x + 19}" stroke="${c.soilLine}" stroke-width="2" stroke-linecap="round"/>`;
  PLOT_X.forEach((x, i) => {
    s += plot(x);
    const slot = p.plots[i];
    if (slot) s += plotCrop(slot.crop, slot.stage, x + 11.5);
  });

  // 밭 옆 등불 (야근이면 켜짐)
  s += `<path d="M144 206 V150" ${o(5)}/><path d="M144 206 V150" stroke="${c.wood}" stroke-width="2" stroke-linecap="round"/><path d="M144 152 H154" ${o(4)}/><path d="M154 152 V156" stroke="${L}" stroke-width="2"/>`;
  s += `<rect x="147" y="156" width="14" height="17" rx="4" fill="${p.lanternOn ? '#FFE14D' : '#8A90B0'}" ${o(2.5)}/><path d="M146 156 H162 M146 173 H162" ${o(3)}/>`;

  // 냇가
  s += `<path d="M240 206 Q244 192 272 192 H338 Q362 192 364 206 Q362 218 338 218 H266 Q242 218 240 206Z" fill="${c.water}" ${o(3)}/><path d="M258 204 q8 -4 16 0 M298 208 q8 -4 16 0 M326 200 q6 -3 12 0" stroke="${c.hi}" stroke-width="2.5" stroke-linecap="round" fill="none"/><ellipse cx="242" cy="214" rx="8" ry="5" fill="${c.rock}" ${o(2)}/><ellipse cx="356" cy="214" rx="9" ry="5.5" fill="${c.rock}" ${o(2)}/>`;
  const flowerX = [252, 268, 284, 300, 316, 332, 348];
  const bloomOrder = [0, 2, 4, 6, 1, 3, 5];
  const bloomCount = Math.round(Math.min(1, Math.max(0, p.bloom)) * flowerX.length);
  const blooming = new Set(bloomOrder.slice(0, bloomCount));
  const flowerCols = ['#FF4FA0', '#C49BFF', '#FFE14D'];
  flowerX.forEach((x, i) => {
    s += blooming.has(i) ? flower(x, 230, flowerCols[i % 3]) : bud(x, 230);
  });

  // 앞마당
  s += `<path d="M-4 238 C80 228 290 230 370 234 V344 H-4Z" fill="${c.yard}" ${o(3)}/>`;
  s += `<ellipse cx="40" cy="300" rx="7" ry="3.5" fill="${c.yardSpot}"/><ellipse cx="56" cy="306" rx="4" ry="2.4" fill="${c.yardSpot}"/><ellipse cx="330" cy="318" rx="6" ry="3" fill="${c.yardSpot}"/><path d="M14 258 l3 -9 l3 7 l3 -10 l3 12z M350 262 l3 -9 l3 7 l3 -10 l3 12z" fill="#3E7A3A" ${o(1.6)}/>`;

  // 이웃(뒤) → 솔이 → 이웃(앞)
  const [near, far] = p.visitors;
  if (far) s += `<ellipse cx="326" cy="290" rx="24" ry="4.5" fill="#000" opacity=".25"/>` + nest(npcSvg(far.color, far.hair), 296, 236, 60);
  s += nest(soliSvg(p.soliMood), 90, 176, 140);
  if (near) {
    s += `<ellipse cx="268" cy="322" rx="36" ry="6" fill="#000" opacity=".25"/>` + nest(npcSvg(near.color, near.hair), 226, 240, 84);
    if (near.heart)
      s += `<path d="M280 248 C280 240 270 237 268 245 C266 237 256 240 256 248 C256 256 268 262 268 262 C268 262 280 256 280 248Z" fill="#FF4FA0" ${o(2.5)}/>`;
  }

  // 마을 입구 현수막
  if (p.bannerText) {
    s += `<path d="M6 104 V206 M134 104 V206" ${o(5)}/><path d="M6 104 V206 M134 104 V206" stroke="${c.wood}" stroke-width="2" stroke-linecap="round"/><circle cx="6" cy="102" r="4" fill="#FFE14D" ${o(2.5)}/><circle cx="134" cy="102" r="4" fill="#FFE14D" ${o(2.5)}/>`;
    s += `<path d="M8 110 Q70 116 132 110 V130 Q70 136 8 130Z" fill="#FFE14D" ${o(3)}/><path d="M8 113 Q70 119 132 113 M8 127 Q70 133 132 127" stroke="#FF4FA0" stroke-width="2.5" fill="none"/>`;
    s += `<text x="70" y="125.5" text-anchor="middle" ${svgBodyFont} font-size="10.5" fill="${L}">${escapeXml(p.bannerText)}</text>`;
  }

  return `<svg viewBox="0 0 366 340" preserveAspectRatio="xMidYMax ${fit}" xmlns="http://www.w3.org/2000/svg">${s}</svg>`;
}
