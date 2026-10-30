// 마을 배경 테마 (꾸미기 · 마을 → 메인 장면). VillageTheme 하나가 장면 층의 색을 전부 정한다.
// 순수 TS (RN import 없음 → 단위 테스트). 장면 그림은 art.ts가 이 값만 보고 그린다.
//
// 기본(base) = 지금의 메인 장면: 밤 팔레트 + 낮 팔레트 (06:00~18:59 낮 — day.ts timeOfDayAt). 기본이 적용 중이면 지금과 똑같이 보인다.
// 구매한 6종은 시간과 상관없이 고정 팔레트다. 시안(꾸미기 #31b)에는 테마당 기준색 6개(하늘 / 풀 / 흙 / 물 / 물결 / 나무)와 장식 점뿐이다.
// 나머지는 기준색에서 파생한다 (규칙은 deriveTheme 주석):
//   능선·중경·앞마당·길·잎 밝기·땅 선 색 = 하늘 · 풀 · 흙 색을 어둡게 · 밝게 섞는다.
//   집 · 게시판 같은 구조물 색은 테마와 상관없는 낮/밤 구조물 팔레트(village.ts DAY · NIGHT)를 쓰고, 물 · 물결만 테마 색으로 바꾼다.
// 시안이 정하지 않은 입자(반딧불이 · 나비)는 구매 테마에서 끈다.

import type { TimeOfDay } from '../../domain/types';
import { BG_BASE, isKnownBg } from '../../domain/villageBg';
import { DAY as DAY_STRUCT, NIGHT as NIGHT_STRUCT, type Palette } from '../characters/village';

// ── 색 계산 ───────────────────────────────────────────

type Rgb = [number, number, number];

function rgbOf(hex: string): Rgb {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

const hexOf = ([r, g, b]: Rgb) =>
  `#${[r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('').toUpperCase()}`;

/** a와 b를 섞는다 (t=0 → a, t=1 → b) */
export function mix(a: string, b: string, t: number): string {
  const x = rgbOf(a);
  const y = rgbOf(b);
  return hexOf([x[0] + (y[0] - x[0]) * t, x[1] + (y[1] - x[1]) * t, x[2] + (y[2] - x[2]) * t]);
}

/** 어둡게 (검정 쪽으로 t만큼) */
export const darken = (c: string, t: number) => mix(c, '#10142E', t);
/** 밝게 (흰색 쪽으로 t만큼) */
export const lighten = (c: string, t: number) => mix(c, '#FFFFFF', t);

// ── 테마 ─────────────────────────────────────────────

/** 해 · 달: moon = 초승달 + 빛 (정지) · sun = 천천히 도는 햇살 + 빛 · lowSun = 낮게 걸린 큰 해 (정지) */
export type Celestial = 'moon' | 'sun' | 'lowSun' | 'none';

/** 장식 점 (하늘에 흩어진 꽃잎 · 낙엽 · 눈). 천천히 떠다닌다 */
export type DecoKind = 'petal' | 'leaf' | 'snow';

export type VillageTheme = {
  id: string;
  /** 하늘 그라데이션: 위 → 아래 */
  sky: readonly [string, string];
  celestial: Celestial;
  /** 별 (깜박임) */
  stars: boolean;
  /** 구름 두 색 (떠다니는 구름). null이면 구름 없음 */
  clouds: readonly [string, string] | null;
  /** 원경 능선 2색 (뒤 · 앞) */
  ridge: readonly [string, string];
  /** 능선 위 불빛 점(밤) */
  ridgeLights: boolean;
  /** 중경(집 · 게시판 · 냇가가 서는 땅) · 마당(솔이가 서는 땅) · 앞 땅(밭 뒤) · 길 */
  mid: string;
  yard: string;
  fore: string;
  path: string;
  /** 냇가 */
  water: string;
  wave: string;
  /** 나무 잎 (번갈아) · 잎 하이라이트 · 눈 덮임 */
  leaf: readonly [string, string];
  leafHi: string;
  treeSnow: boolean;
  /** 풀숲 색 · 꽃 (놓을지) */
  tuft: string;
  flowers: boolean;
  /** 밭 흙 */
  soil: { soil: string; line: string; pebble: string };
  /** 장식 점 */
  deco: { kind: DecoKind; colors: readonly [string, string] } | null;
  /** 입자: 반딧불이 · 나비 */
  particles: 'firefly' | 'butterfly' | 'none';
  /** 창문 · 등불이 불빛을 내는가 (밤) */
  lit: boolean;
  /** 집 · 게시판 · 냇가를 그릴 구조물 팔레트 (물 · 물결은 테마 색으로 바뀌어 있다) */
  struct: Palette;
};

const LEAF_PAIR = (c: string): readonly [string, string] => [c, lighten(c, 0.1)];

// ── 기본 테마: 지금의 메인 장면 ───────────────────────────

/** 지금 메인 장면의 밤 팔레트 (art.ts가 쓰던 값 그대로) */
const BASE_NIGHT: VillageTheme = {
  id: BG_BASE,
  sky: ['#141A44', '#2E2C74'],
  celestial: 'moon',
  stars: true,
  clouds: ['#4A4F9C', '#3A3F86'],
  ridge: ['#262B63', '#2C3470'],
  ridgeLights: true,
  mid: '#212C5C',
  yard: '#3E3966',
  fore: '#2E2A55',
  path: '#4A4478',
  water: NIGHT_STRUCT.water,
  wave: NIGHT_STRUCT.hi,
  leaf: ['#3E8A3A', '#4FA83A'],
  leafHi: '#B6F35C',
  treeSnow: false,
  tuft: '#3E7A3A',
  flowers: true,
  soil: { soil: '#5A3E5E', line: '#45304A', pebble: '#6A5470' },
  deco: null,
  particles: 'firefly',
  lit: true,
  struct: NIGHT_STRUCT,
};

/** 지금 메인 장면의 낮 팔레트 */
const BASE_DAY: VillageTheme = {
  id: BG_BASE,
  sky: ['#4FB4F5', '#C4ECFF'],
  celestial: 'sun',
  stars: false,
  clouds: ['#FFFFFF', '#EEF8FF'],
  ridge: ['#8EC6EE', '#6FB86A'],
  ridgeLights: false,
  mid: '#8ED062',
  yard: '#A6DC6E',
  fore: '#7FBE52',
  path: '#E8C98A',
  water: DAY_STRUCT.water,
  wave: DAY_STRUCT.hi,
  leaf: ['#3E8A3A', '#4FA83A'],
  leafHi: '#B6F35C',
  treeSnow: false,
  tuft: '#3E7A3A',
  flowers: true,
  soil: { soil: '#B07A4E', line: '#8A5A36', pebble: '#9A6A44' },
  deco: null,
  particles: 'butterfly',
  lit: false,
  struct: DAY_STRUCT,
};

// ── 구매 테마 6종: 시안 기준색에서 파생 ─────────────────────

type Base6 = {
  id: string;
  sky: string;
  grass: string;
  soil: string;
  water: string;
  wave: string;
  tree: string;
};

type Extras = {
  celestial: Celestial;
  stars?: boolean;
  clouds?: readonly [string, string] | null;
  deco?: VillageTheme['deco'];
  flowers?: boolean;
  treeSnow?: boolean;
  /** 밤 구조물(어두운 집 · 불 켜진 창) */
  night?: boolean;
  /** 하늘 아랫단 (없으면 기준 하늘색을 밝게) */
  skyBottom?: string;
};

/**
 * 기준색 6개 + 장식에서 테마 한 벌을 만든다.
 *  - 하늘 위 = 기준 하늘색, 아래 = skyBottom(없으면 기준색을 25% 밝게)
 *  - 능선 뒤 = 하늘 아랫단과 풀을 4:6으로 섞고 6% 어둡게 (하늘빛이 도는 먼 산)
 *  - 능선 앞 = 풀을 20% 어둡게
 *  - 중경 = 풀 8% 어둡게 · 마당 = 풀 그대로 · 앞 땅 = 풀 14% 어둡게
 *  - 길 = 흙을 50% 밝게
 *  - 잎 = 기준 나무색 + 10% 밝은 짝 · 잎 하이라이트 = 나무색을 45% 밝게 · 풀숲 = 풀을 30% 어둡게
 *  - 밭 흙 = 기준 흙 · 선 = 흙 22% 어둡게 · 조약돌 = 흙 12% 밝게
 */
function deriveTheme(b: Base6, x: Extras): VillageTheme {
  const skyBottom = x.skyBottom ?? lighten(b.sky, 0.25);
  const struct: Palette = { ...(x.night ? NIGHT_STRUCT : DAY_STRUCT), water: b.water, hi: b.wave };
  return {
    id: b.id,
    sky: [b.sky, skyBottom],
    celestial: x.celestial,
    stars: !!x.stars,
    clouds: x.clouds ?? null,
    ridge: [darken(mix(skyBottom, b.grass, 0.6), 0.06), darken(b.grass, 0.2)],
    ridgeLights: !!x.night,
    mid: darken(b.grass, 0.08),
    yard: b.grass,
    fore: darken(b.grass, 0.14),
    path: lighten(b.soil, 0.5),
    water: b.water,
    wave: b.wave,
    leaf: LEAF_PAIR(b.tree),
    leafHi: lighten(b.tree, 0.45),
    treeSnow: !!x.treeSnow,
    tuft: darken(b.grass, 0.3),
    flowers: !!x.flowers,
    soil: { soil: b.soil, line: darken(b.soil, 0.22), pebble: lighten(b.soil, 0.12) },
    deco: x.deco ?? null,
    particles: 'none',
    lit: !!x.night,
    struct,
  };
}

const BOUGHT: Record<string, VillageTheme> = {
  spring: deriveTheme(
    { id: 'spring', sky: '#FFD6E8', grass: '#7FD24A', soil: '#B07A4E', water: '#5FD8FF', wave: '#FFFFFF', tree: '#FF8CC6' },
    { celestial: 'none', flowers: true, deco: { kind: 'petal', colors: ['#FF8CC6', '#FFFFFF'] }, skyBottom: '#FFF0F6' },
  ),
  autumn: deriveTheme(
    { id: 'autumn', sky: '#FFC98A', grass: '#D9A84A', soil: '#7A4A2E', water: '#2D5AA6', wave: '#5FD8FF', tree: '#FF6B3A' },
    { celestial: 'none', clouds: ['#FFF6D6', '#FFF6D6'], deco: { kind: 'leaf', colors: ['#FF6B3A', '#FFE14D'] }, skyBottom: '#FFE9C4' },
  ),
  winter: deriveTheme(
    { id: 'winter', sky: '#BFE3FF', grass: '#F4F6FB', soil: '#9AA3C8', water: '#5A8FD6', wave: '#FFFFFF', tree: '#2F6A4A' },
    { celestial: 'none', clouds: ['#FFFFFF', '#FFFFFF'], deco: { kind: 'snow', colors: ['#FFFFFF', '#FFFFFF'] }, treeSnow: true, skyBottom: '#EAF6FF' },
  ),
  sunset: deriveTheme(
    { id: 'sunset', sky: '#FF9A7A', grass: '#5FB04A', soil: '#7A5470', water: '#7A5AA6', wave: '#FFC98A', tree: '#3E8A3A' },
    { celestial: 'lowSun', clouds: ['#FFC2D6', '#FFC2D6'], flowers: true, skyBottom: '#FFD3A0' },
  ),
  night: deriveTheme(
    { id: 'night', sky: '#10142E', grass: '#2F6B4A', soil: '#3A3466', water: '#1E2558', wave: '#5FD8FF', tree: '#24543A' },
    { celestial: 'moon', stars: true, night: true, skyBottom: '#232B60' },
  ),
  summer: deriveTheme(
    { id: 'summer', sky: '#4FB4F5', grass: '#5FBF3A', soil: '#B07A4E', water: '#2D8AE6', wave: '#BFEFFF', tree: '#3E8A3A' },
    { celestial: 'sun', clouds: ['#FFFFFF', '#FFFFFF'], skyBottom: '#BFE6FF' },
  ),
};

/** 배경 id → 테마. 기본은 시각(낮/밤)에 따라 지금의 장면, 나머지는 고정 팔레트. 모르는 id는 기본 */
export function resolveTheme(id: string, timeOfDay: TimeOfDay): VillageTheme {
  if (id !== BG_BASE && isKnownBg(id) && BOUGHT[id]) return BOUGHT[id];
  return timeOfDay === 'day' ? BASE_DAY : BASE_NIGHT;
}

/** 테마가 정의된 배경 id 전부 (기본 + 구매 6종) — 테스트가 배경 목록과 맞는지 본다 */
export const THEME_IDS: readonly string[] = [BG_BASE, ...Object.keys(BOUGHT)];

/** 하늘이 밝은가 (상태바 글자를 어둡게 할지). 위 하늘색의 밝기 기준 */
export function themeIsLight(t: VillageTheme): boolean {
  const [r, g, b] = rgbOf(t.sky[0]);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6;
}

/** 장면 컨테이너 배경색 (하늘 맨 위) — 화면 위가 장면보다 클 때 이 색이 채운다 */
export const themeSkyTop = (t: VillageTheme): string => t.sky[0];
