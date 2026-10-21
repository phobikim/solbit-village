// 메인 마을 무대 (7a) — design/solbit-v5.dc.html의 village11() 이식 (TURN 11 마을 게시판 배치).
// 하늘(0–85) · 뒤: 오두막·게시판·냇가(85–170) · 마당: 솔이·이웃(170–255) · 앞: 밭 5칸(255–340).
// 날씨·낮밤·게시판 쪽지·밭·이웃·스킨·야근 등불·냇가 꽃을 매개변수로 받는다. viewBox 0 0 366 340.

import { EVENT_PAPER_COLOR } from '../../copy/labels.ko';
import type { EventType } from '../../domain/events';
import type { PlotSlot, TimeOfDay, Weather } from '../../domain/types';
import { fonts } from '../theme';
import { plotCrop } from './crops';
import { eventIconInner } from './eventIcons';
import { faceSvg, FACES } from './neighbors';
import { buildingSvg } from './skins';
import { soliSkinSvg, soliSvg, type SoliMood } from './soli';
import { bud, cloud, flower, L, nest, o, place48, star } from './svg';

export const VILLAGE_VIEWBOX = { width: 366, height: 340 } as const;

/** 놀러 온 이웃: 얼굴(0-11), 단짝이면 하트 */
export type VillageVisitor = { face: number; heart?: boolean };

/** 게시판 쪽지 하나: 분류 · D-day 글자 · 이름 (맨 앞 쪽지에만 이름이 보인다) */
export type BoardPaper = { type: EventType; dday: string; name: string };

export type VillageSceneParams = {
  timeOfDay: TimeOfDay;
  weather: Weather;
  /** 밭 5칸 */
  plots: readonly PlotSlot[];
  soliMood: SoliMood;
  /** 쓰고 있는 솔이 스킨 id */
  soliSkin?: string | null;
  /** 마을에 놓은 건물 스킨 id */
  building?: string | null;
  /** 마을에 놀러 온 가까운 이웃 (최대 2명 표시) */
  visitors: readonly VillageVisitor[];
  /** 게시판 쪽지 (가까운 순, 최대 3장). 비면 '붙일 게 없습니다' 쪽지 */
  board: readonly BoardPaper[];
  /** 맨 앞 행사가 오늘이면 '오늘!' 도장 */
  boardToday: boolean;
  /** 야근이면 게시판 옆 등불이 켜짐 */
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
  front: string;
  soil: string;
  soilLine: string;
  pebble: string;
  hut: string;
  wood: string;
  boardInner: string;
  boardLine: string;
  post: string;
  water: string;
  hi: string;
  rock: string;
  cloud: string;
  darkCloud: string;
  window: string;
};

const NIGHT: Palette = {
  s1: '#141A44',
  s2: '#2E2C74',
  hill: '#212C5C',
  ground: '#24435F',
  yard: '#3E3966',
  front: '#2E2A55',
  soil: '#5A3E5E',
  soilLine: '#45304A',
  pebble: '#6A5470',
  hut: '#7A5446',
  wood: '#B9825A',
  boardInner: '#A06E48',
  boardLine: '#8C5E3C',
  post: '#96643F',
  water: '#2D5AA6',
  hi: '#5FD8FF',
  rock: '#6A6F9E',
  cloud: '#4A4F9C',
  darkCloud: '#262342',
  window: '#FFE14D',
};

// 낮 색은 시안 village(낮) 팔레트 기준. 하늘 아래쪽은 낮 배경 토큰 #EAF6FF (SPEC 3장 낮/밤 확정).
const DAY: Palette = {
  s1: '#7FCBFF',
  s2: '#EAF6FF',
  hill: '#9BE38A',
  ground: '#74D068',
  yard: '#A6E38E',
  front: '#8ACB74',
  soil: '#C98E5E',
  soilLine: '#A9714A',
  pebble: '#B57A4E',
  hut: '#E8B88A',
  wood: '#E0A86E',
  boardInner: '#C98E5E',
  boardLine: '#A9714A',
  post: '#B57A4E',
  water: '#5FD8FF',
  hi: '#FFFFFF',
  rock: '#B8BCD8',
  cloud: '#FFFFFF',
  darkCloud: '#9AA3C8',
  window: '#BFEBFF',
};

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** 쪽지에 들어갈 만큼만 (길면 말줄임) */
function short(name: string, max: number): string {
  const chars = [...name];
  return chars.length > max ? `${chars.slice(0, max - 1).join('').trimEnd()}…` : name;
}

const txt = (x: number, y: number, t: string, size: number, font: string, col: string = L, anchor = 'middle') =>
  `<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="${font}" font-size="${size}" fill="${col}">${escapeXml(t)}</text>`;

function sky(p: VillageSceneParams, c: Palette, glowId: string): string {
  const night = p.timeOfDay === 'night';
  const storm = p.weather === 'storm';
  let s = '';
  if (night && !storm) {
    const stars: [number, number, number][] = [[20, 18, 4], [110, 12, 3], [246, 16, 4], [150, 58, 3], [270, 62, 3], [14, 70, 3], [228, 44, 2.6]];
    // 날씨가 나쁠수록 별이 덜 보인다
    const visible = p.weather === 'sun' ? stars.length : p.weather === 'cloud' ? 7 : p.weather === 'over' ? 4 : 2;
    s += stars.slice(0, visible).map((a) => star(...a)).join('');
    s += `<circle cx="318" cy="38" r="30" fill="url(#${glowId})"/><path d="M314 16 A22 22 0 1 0 340 50 A17 17 0 1 1 314 16Z" fill="#FFE14D" ${o(3)}/>`;
  } else if (!night && !storm && p.weather !== 'rain') {
    s +=
      [0, 1, 2, 3, 4, 5, 6, 7]
        .map((i) => {
          const a = (i * Math.PI) / 4;
          return `<path d="M${(322 + Math.cos(a) * 26).toFixed(1)} ${(40 + Math.sin(a) * 26).toFixed(1)} L${(322 + Math.cos(a) * 33).toFixed(1)} ${(40 + Math.sin(a) * 33).toFixed(1)}" stroke="${L}" stroke-width="4" stroke-linecap="round"/>`;
        })
        .join('') + `<circle cx="322" cy="40" r="19" fill="#FFE14D" ${o(3)}/>`;
  }
  const drops = (x: number, y: number) =>
    `<path d="M${x} ${y} l-2.5 7 M${x + 9} ${y + 1} l-2.5 7 M${x + 18} ${y} l-2.5 7" stroke="#5FD8FF" stroke-width="2.6" stroke-linecap="round"/>`;
  switch (p.weather) {
    case 'sun':
      break;
    case 'cloud':
      s += cloud(52, 36, 1.1, c.cloud) + cloud(186, 30, 0.7, c.darkCloud);
      break;
    case 'over':
      s += cloud(52, 36, 1.1, c.cloud) + cloud(186, 30, 0.7, c.darkCloud) + cloud(250, 52, 0.8, c.cloud);
      break;
    case 'rain':
      s += cloud(52, 36, 1.1, c.darkCloud) + cloud(186, 30, 0.7, c.darkCloud) + cloud(262, 26, 0.8, c.darkCloud);
      s += drops(58, 52) + drops(188, 46) + drops(266, 42);
      break;
    case 'storm':
      s += cloud(40, 34, 1.2, c.darkCloud) + cloud(160, 24, 1.1, c.darkCloud) + cloud(268, 30, 1.1, c.darkCloud);
      s += drops(50, 54) + drops(284, 50);
      s += `<path d="M184 44 L174 62 H183 L176 82 L194 58 H185 L192 44Z" fill="#FFE14D" ${o(2.5)}/>`;
      break;
  }
  return s;
}

/** 게시판과 쪽지 (디자인 11b · 11c · 11d) */
function board(p: VillageSceneParams, c: Palette): string {
  let s = `<ellipse cx="122" cy="166" rx="8" ry="3" fill="#000" opacity=".3"/><ellipse cx="194" cy="166" rx="8" ry="3" fill="#000" opacity=".3"/>`;
  s += `<path d="M122 140 V166 M194 140 V166" ${o(8)}/><path d="M122 140 V166 M194 140 V166" stroke="${c.post}" stroke-width="3.5" stroke-linecap="round"/>`;
  s += `<rect x="108" y="92" width="100" height="56" rx="8" fill="${c.wood}" ${o(3)}/><rect x="113" y="97" width="90" height="46" rx="5" fill="${c.boardInner}"/><path d="M113 112 H203 M113 128 H203" stroke="${c.boardLine}" stroke-width="1.6"/>`;

  const papers = p.board.slice(0, 3);
  // 맨 앞(가장 가까운 행사) · 두 번째 · 세 번째 자리
  const pos: [number, number, number, number, number][] = [
    [116, 98, 42, 47, -4],
    [161, 101, 21, 37, 3],
    [183, 103, 20, 35, -2],
  ];
  const paper = (b: BoardPaper, i: number) => {
    const [x, y, w, ht, r] = pos[i];
    const front = i === 0;
    const iconSize = front ? 17 : 13;
    const cx = x + w / 2;
    let g = `<rect x="${x}" y="${y}" width="${w}" height="${ht}" rx="3" fill="${EVENT_PAPER_COLOR[b.type]}" ${o(2.2)}/><rect x="${x}" y="${y + ht - 3}" width="${w}" height="3" fill="#000" opacity=".08"/>`;
    g += place48(eventIconInner(b.type, true), cx - iconSize / 2, y + 6, iconSize);
    if (front) g += txt(cx, y + 32, short(b.name, 6), 7.6, fonts.bodyHeavy) + txt(cx, y + 43, b.dday, b.dday.length > 4 ? 8.6 : 10.5, fonts.title);
    else g += txt(cx, y + 31, b.dday, b.dday.length > 4 ? 6.4 : 7.6, fonts.title);
    g += `<circle cx="${cx}" cy="${y + 1}" r="3" fill="#FF4FA0" ${o(1.8)}/>`;
    return `<g transform="rotate(${r} ${cx} ${y + ht / 2})">${g}</g>`;
  };
  for (let i = papers.length - 1; i >= 0; i--) s += paper(papers[i], i);

  if (papers.length && p.boardToday)
    s += `<g transform="rotate(-14 150 138)"><rect x="132" y="129" width="38" height="17" rx="4" fill="#FFF6D6" fill-opacity=".75" stroke="#FF5A4A" stroke-width="2.4"/>${txt(151, 142, '오늘!', 11, fonts.title, '#FF5A4A')}</g>`;
  if (!papers.length)
    s +=
      `<g transform="rotate(-3 158 120)"><rect x="118" y="100" width="80" height="40" rx="3" fill="#FFF6D6" ${o(2.2)}/>` +
      txt(124, 114, '붙일 게 없습니다.', 7.4, fonts.bodyHeavy, L, 'start') +
      txt(124, 124, '평화롭습니다.', 7.4, fonts.bodyHeavy, L, 'start') +
      txt(192, 136, '이장', 9, fonts.sfx, '#FF4FA0', 'end') +
      `<circle cx="158" cy="101" r="3" fill="#FF4FA0" ${o(1.8)}/></g>`;
  return s;
}

/** 무대 하늘 맨 위 색. 그림보다 세로로 긴 칸에서 위쪽 여백을 이 색으로 채운다. */
export function villageSkyTop(t: TimeOfDay): string {
  return (t === 'night' ? NIGHT : DAY).s1;
}

/**
 * fit: 칸이 그림보다 세로로 길면 'meet'(아래 정렬, 위는 하늘색 여백),
 * 가로로 길면 'slice'(아래 정렬, 하늘 위쪽이 잘림). 어느 쪽이든 땅·밭·게시판은 잘리지 않는다.
 */
export function villageSceneSvg(p: VillageSceneParams, fit: 'meet' | 'slice' = 'slice'): string {
  const night = p.timeOfDay === 'night';
  const c = night ? NIGHT : DAY;
  const id = night ? 'vn' : 'vd';
  const glowId = `${id}g`;
  const glow = (cx: number, cy: number, r: number, extra = '') =>
    night ? `<circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#${glowId})" ${extra}/>` : '';

  let s =
    `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c.s1}"/><stop offset=".3" stop-color="${c.s2}"/></linearGradient>` +
    `<radialGradient id="${glowId}"><stop offset="0" stop-color="#FFE14D" stop-opacity=".55"/><stop offset="1" stop-color="#FFE14D" stop-opacity="0"/></radialGradient></defs>` +
    `<rect width="366" height="340" fill="url(#${id})"/>`;

  // 1. 하늘
  s += sky(p, c, glowId);

  // 2. 뒤: 언덕 · 땅 · 오두막 · 게시판 · 냇가
  s += `<path d="M-4 104 C70 92 150 98 220 100 C280 102 330 92 370 96 V344 H-4Z" fill="${c.hill}" ${o(3)}/>`;
  if (p.building) s += nest(buildingSvg(p.building), 306, 84, 54);
  s += `<path d="M-4 160 C110 154 250 158 370 152 V344 H-4Z" fill="${c.ground}" ${o(3)}/>`;

  // 오두막 (TODO: 마을 레벨에 따라 건물 수·디자인 변경)
  s += glow(56, 138, 40, 'opacity=".7"');
  s += `<rect x="16" y="116" width="80" height="48" rx="6" fill="${c.hut}" ${o(3)}/><path d="M6 120 L56 86 L106 120Z" fill="#FF4FA0" ${o(3)}/><rect x="28" y="132" width="16" height="32" rx="3" fill="${c.wood}" ${o(2.5)}/><circle cx="40" cy="149" r="1.8" fill="${L}"/><rect x="58" y="128" width="26" height="18" rx="3" fill="${c.window}" ${o(2.5)}/><path d="M71 128 V146 M58 137 H84" stroke="${L}" stroke-width="2"/>`;
  s += `<path d="M56 86 C56 79 59 76 62 73" stroke="${L}" stroke-width="5" stroke-linecap="round" fill="none"/><path d="M61 74 C57 68 50 68 47 72 C51 76 57 77 61 74Z M62 73 C66 67 73 66 76 69 C73 74 66 75 62 73Z" fill="#B6F35C" ${o(2)}/>`;

  s += board(p, c);

  // 게시판 옆 등불 (야근이면 켜짐)
  if (p.lanternOn) s += glow(224, 128, 30);
  s += `<path d="M214 166 V114" ${o(5)}/><path d="M214 166 V114" stroke="${c.wood}" stroke-width="2" stroke-linecap="round"/><path d="M214 116 H224" ${o(4)}/><path d="M224 116 V120" stroke="${L}" stroke-width="2"/>`;
  s += `<rect x="217" y="120" width="14" height="17" rx="4" fill="${p.lanternOn ? '#FFE14D' : '#8A90B0'}" ${o(2.5)}/><path d="M216 120 H232 M216 137 H232" ${o(3)}/>`;

  // 냇가 + 꽃 (여가)
  s += `<path d="M222 150 Q226 136 254 136 H336 Q362 136 364 150 Q362 162 336 162 H248 Q224 162 222 150Z" fill="${c.water}" ${o(3)}/><path d="M244 148 q8 -4 16 0 M288 152 q8 -4 16 0 M322 144 q6 -3 12 0" stroke="${c.hi}" stroke-width="2.5" stroke-linecap="round" fill="none"/><ellipse cx="226" cy="158" rx="8" ry="5" fill="${c.rock}" ${o(2)}/><ellipse cx="354" cy="160" rx="9" ry="5.5" fill="${c.rock}" ${o(2)}/>`;
  const flowerX = [236, 252, 268, 284, 300, 316, 332, 348];
  const bloomOrder = [0, 2, 4, 6, 1, 3, 5, 7];
  const bloomCount = Math.round(Math.min(1, Math.max(0, p.bloom)) * flowerX.length);
  const blooming = new Set(bloomOrder.slice(0, bloomCount));
  const flowerCols = ['#FF4FA0', '#C49BFF', '#FFE14D'];
  flowerX.forEach((x, i) => {
    s += blooming.has(i) ? flower(x, 176, flowerCols[i % 3]) : bud(x, 176);
  });

  // 3. 마당: 이웃(양옆) · 솔이(가운데)
  s += `<path d="M-4 180 C100 172 260 176 370 178 V344 H-4Z" fill="${c.yard}" ${o(3)}/>`;
  s += `<path d="M14 196 l3 -9 l3 7 l3 -10 l3 12z M346 200 l3 -9 l3 7 l3 -10 l3 12z" fill="#3E7A3A" ${o(1.6)}/>`;
  const [near, far] = p.visitors;
  if (near) {
    s += `<ellipse cx="74" cy="252" rx="24" ry="4.5" fill="#000" opacity=".25"/>` + nest(faceSvg(FACES[near.face] ?? FACES[0]), 40, 186, 66);
    if (near.heart)
      s += `<path d="M110 196 C110 189 102 187 100 193 C98 187 90 189 90 196 C90 202 100 207 100 207 C100 207 110 202 110 196Z" fill="#FF4FA0" ${o(2.5)}/>`;
  }
  if (far) s += `<ellipse cx="292" cy="252" rx="24" ry="4.5" fill="#000" opacity=".25"/>` + nest(faceSvg(FACES[far.face] ?? FACES[0]), 259, 186, 66);
  s += `<ellipse cx="183" cy="258" rx="40" ry="6" fill="#000" opacity=".28"/>` + nest(soliSvg(p.soliMood) + soliSkinSvg(p.soliSkin ?? null), 128, 146, 110);

  // 4. 앞: 밭 5칸
  s += `<path d="M-4 262 C120 258 250 260 370 258 V344 H-4Z" fill="${c.front}" ${o(3)}/>`;
  const W = 65.2;
  const Y = 272;
  const H = 58;
  for (let i = 0; i < 5; i++) {
    const x = 8 + i * (W + 6);
    const cx = x + W / 2;
    s += `<rect x="${x}" y="${Y}" width="${W}" height="${H}" rx="12" fill="${c.soil}" ${o(3)}/><path d="M${x + 10} ${Y + 46} H${x + W - 10}" stroke="${c.soilLine}" stroke-width="3" stroke-linecap="round"/>`;
    const slot = p.plots[i];
    if (slot) {
      if (slot.stage === 3) s += glow(cx, Y + 16, 26, 'opacity=".7"');
      // 작물 그림(밭 흙 윗면 y=190 기준)을 큰 밭에 맞게 키운다
      s += `<g transform="translate(${cx} ${Y + 40}) scale(1.9) translate(0 -190)">${plotCrop(slot.crop, slot.stage, 0)}</g>`;
    } else {
      s += `<path d="M${x + 14} ${Y + 22} H${x + W - 14} M${x + 18} ${Y + 34} H${x + W - 18}" stroke="${c.soilLine}" stroke-width="3" stroke-linecap="round"/><ellipse cx="${cx + 12}" cy="${Y + 28}" rx="3" ry="2" fill="${c.pebble}"/>`;
    }
  }

  return `<svg viewBox="0 0 366 340" preserveAspectRatio="xMidYMax ${fit}" xmlns="http://www.w3.org/2000/svg">${s}</svg>`;
}
