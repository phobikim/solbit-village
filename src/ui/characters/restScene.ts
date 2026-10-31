// 쉼터 모닥불 풍경 (디자인 "5 쉼터 v2" 1a): 밤하늘 · 달 · 소나무 · 언덕 위에 모닥불과 구구 할매. 칸 366 x 280.
// 불 세기(꺼짐 / 보통 / 뜨끈)에 따라 불 크기 · 땅 위 색 · 구구 할매가 바뀐다.
// react-native-svg는 SMIL을 못 그려서 움직이는 것(불 번짐 · 불티 · 할매 김)은 restSceneFxSvg로 따로 그려 화면이 투명도로 깜빡인다.

import type { FireMood } from '../../domain/fire';
import { GUGU_VIEWBOX, guguFxInner } from './gugu';

export const REST_SCENE = { w: 366, h: 280 } as const;

const W = REST_SCENE.w;
const H = REST_SCENE.h;
/** 땅 높이 · 불 자리 · 할매 자리 (시안 scene1) */
const GY = 206;
const FIRE_X = 120;
/** 구구 할매 자리 (칸 안). 할매는 움직여서 GuguActor가 따로 그린다 — 이 파일은 김(fx)만 같은 자리에 그린다 */
export const GUGU_BOX = { x: 212, y: 86, w: 112, h: 136 } as const;

const L = '#10142E';
const n1 = (n: number) => String(Math.round(n * 100) / 100);

/** 시안 sky(): 별 · 달(초승달) · 소나무 네 그루 · 언덕 */
function sky(): string {
  const stars = [[30, 40], [90, 24], [150, 52], [250, 30], [320, 58], [340, 110], [60, 100], [210, 16]]
    .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.5" fill="#FFFFFF" opacity=".8"/>`)
    .join('');
  const pine = (x: number, s: number) =>
    `<path d="M${x} ${GY - 70 * s} L${x + 22 * s} ${GY - 10} L${x - 22 * s} ${GY - 10}Z M${x} ${GY - 50 * s} L${x + 28 * s} ${GY} L${x - 28 * s} ${GY}Z" fill="#17214F"/>`;
  return (
    `<rect width="${W}" height="${H}" fill="#0F1636"/>${stars}` +
    `<circle cx="${W - 50}" cy="46" r="16" fill="#FFF3B0"/><circle cx="${W - 44}" cy="41" r="14" fill="#0F1636"/>` +
    pine(40, 1) + pine(80, 0.7) + pine(W - 36, 1.1) + pine(W - 84, 0.75) +
    `<path d="M-10 ${GY} Q${W / 2} ${GY - 18} ${W + 10} ${GY} V${H} H-10Z" fill="#1B2A55"/>`
  );
}

/** 모닥불 불꽃 (viewBox 0 0 40 48을 s배로, 발이 (cx, y)) */
const flame = (cx: number, y: number, s: number) =>
  `<g transform="translate(${n1(cx - 20 * s)} ${n1(y - 46 * s)}) scale(${s})">` +
  `<path d="M20 2C22 12 32 16 32 30a12 12 0 0 1-24 0c0-7 4-10 6-15 2 4 2 7 5 8C19 15 18 9 20 2z" fill="#FF9A3C"/>` +
  `<path d="M20 22c1 5 6 7 6 13a6 6 0 0 1-12 0c0-4 3-6 4-9 1 2 1 3 2 4 0-3 0-5 0-8z" fill="#FFE14D"/></g>`;

/** 엇갈린 통나무 두 개. 불이 꺼지면 차갑게 */
function logs(cx: number, y: number, cold: boolean): string {
  const a = cold ? '#3A3F6B' : '#7A4A2E';
  const b = cold ? '#4A4F7A' : '#8E5A38';
  return (
    `<g transform="translate(${cx} ${y})">` +
    `<rect x="-56" y="-4" width="112" height="20" rx="10" fill="${a}" stroke="${L}" stroke-width="3" transform="rotate(-9)"/>` +
    `<rect x="-56" y="-4" width="112" height="20" rx="10" fill="${b}" stroke="${L}" stroke-width="3" transform="rotate(9)"/></g>`
  );
}

/** 구구 할매를 장면 안 상자(112 x 136)에 앉힌다 */
function gugu(inner: string): string {
  const v = GUGU_VIEWBOX;
  const s = Math.min(GUGU_BOX.w / v.w, GUGU_BOX.h / v.h);
  const tx = GUGU_BOX.x + (GUGU_BOX.w - v.w * s) / 2 - v.x * s;
  const ty = GUGU_BOX.y + (GUGU_BOX.h - v.h * s) / 2 - v.y * s;
  return `<g transform="translate(${n1(tx)} ${n1(ty)}) scale(${s.toFixed(4)})">${inner}</g>`;
}

/** 움직이지 않는 그림 (구구 할매는 뺀다 — GuguActor) */
export function restSceneSvg(mood: FireMood): string {
  const pre =
    mood === 'off'
      ? `<rect width="${W}" height="${H}" fill="#3A6BD0" opacity=".14"/>`
      : mood === 'hot'
        ? `<ellipse cx="170" cy="200" rx="220" ry="130" fill="#FF7A3C" opacity=".18"/>`
        : '';
  const fire =
    mood === 'off'
      ? `<path d="M${FIRE_X} 196 q-10 -16 2 -30 q12 -14 0 -30" stroke="#5C6498" stroke-width="5" fill="none" stroke-linecap="round" opacity=".6"/>`
      : flame(FIRE_X, GY, mood === 'hot' ? 2.7 : 2.1);
  return (
    `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">` +
    sky() + pre +
    `<ellipse cx="${FIRE_X}" cy="${GY + 18}" rx="70" ry="9" fill="#000" opacity=".3"/>` +
    fire + logs(FIRE_X, GY, mood === 'off') +
    '</svg>'
  );
}

/** 깜빡이는 것: 불 번짐 · 불티 · 뜨끈할 때 할매 머리의 김. 불이 꺼졌으면 null */
export function restSceneFxSvg(mood: FireMood): string | null {
  if (mood === 'off') return null;
  const s = mood === 'hot' ? 2.7 : 2.1;
  const sparks = [[8, 14], [32, 10], [22, 4]]
    .map(([x, y]) => `<circle cx="${n1(FIRE_X - 20 * s + x * s)}" cy="${n1(GY - 46 * s + y * s)}" r="${n1(1.8 * s)}" fill="#FFE14D"/>`)
    .join('');
  const glow = `<circle cx="${FIRE_X}" cy="${n1(GY - 46 * s + 32 * s)}" r="${n1(19 * s)}" fill="#FF9A3C" opacity=".25"/>`;
  const steam = guguFxInner(mood);
  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">${glow}${sparks}${steam ? gugu(steam) : ''}</svg>`;
}
