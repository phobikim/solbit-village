// 쉼터 그림 (디자인 v8 TURN 15): 모닥불 · 장작 크기 · 깃발 · 발자국 · 쪽지. 선 #10142E, 둥근 끝.

import type { FireBand, RestSize } from '../../domain/fire';
import { L } from './svg';

const WOOD = '#B9783C';
const WOOD_DARK = '#8A5528';

/** 엇갈린 통나무 두 개 (viewBox 200 x 140 안, 가운데 아래) */
const crossLogs = () =>
  `<g stroke-linejoin="round" stroke-linecap="round">` +
  `<rect x="30" y="106" width="140" height="24" rx="12" fill="#6F4328" stroke="#4A2C18" stroke-width="2.4" transform="rotate(7 100 118)"/>` +
  `<rect x="30" y="94" width="140" height="24" rx="12" fill="#8B5A38" stroke="#5A3822" stroke-width="2.4" transform="rotate(-7 100 106)"/>` +
  `<path d="M44 100 H150" stroke="#A9714A" stroke-width="3" opacity=".7" transform="rotate(-7 100 106)"/>` +
  `</g>`;

/** 불꽃 크기: 활활 > 타오름 > 사그라듦 > 꺼져감 */
const FLAME: Record<FireBand | 'none', { h: number; col: string; core: string }> = {
  blaze: { h: 78, col: '#FF8A3C', core: '#FFE14D' },
  burning: { h: 62, col: '#FF9A3C', core: '#FFE14D' },
  dying: { h: 44, col: '#E8863C', core: '#B8A04A' },
  out: { h: 16, col: '#B8604A', core: '#FF9A3C' },
  none: { h: 0, col: '#8F96CC', core: '#C9CEF5' },
};

const FIRE_BASE = 98;
/** 모닥불 그림 높이(너비 200 기준): 불이 작을수록 위 빈 곳을 줄인다 */
export function fireHeight(band: FireBand | null): number {
  const f = FLAME[band ?? 'none'];
  return 140 - Math.max(0, FIRE_BASE - f.h - 14);
}

/** 모닥불 (너비 200, 높이 fireHeight). 위에 불꽃, 아래에 엇갈린 통나무 */
export function fireSvg(band: FireBand | null): string {
  const f = FLAME[band ?? 'none'];
  const base = FIRE_BASE;
  const top = base - f.h;
  const minY = Math.max(0, FIRE_BASE - f.h - 14);
  const w = 12 + f.h * 0.28;
  const flame =
    f.h > 0
      ? `<path d="M100 ${top} C${100 + w} ${top + f.h * 0.45} ${100 + w} ${base} 100 ${base} C${100 - w} ${base} ${100 - w} ${top + f.h * 0.45} 100 ${top}Z" fill="${f.col}"/>` +
        `<path d="M100 ${top + f.h * 0.4} C${100 + w * 0.55} ${top + f.h * 0.65} ${100 + w * 0.55} ${base - 3} 100 ${base - 3} C${100 - w * 0.55} ${base - 3} ${100 - w * 0.55} ${top + f.h * 0.65} 100 ${top + f.h * 0.4}Z" fill="${f.core}"/>`
      : `<path d="M92 92 q4-10 8-10 t8 10" fill="none" stroke="#8F96CC" stroke-width="3" stroke-linecap="round" stroke-dasharray="1 7"/>`;
  return `<svg viewBox="0 ${minY} 200 ${140 - minY}" xmlns="http://www.w3.org/2000/svg">${flame}${crossLogs()}</svg>`;
}

/** 장작 크기 그림 (viewBox 48x32): 잔가지 / 장작 / 통나무 */
export function sizeSvg(size: RestSize, on: boolean): string {
  const col = on ? WOOD : '#6C6FA8';
  const dark = on ? WOOD_DARK : '#52568C';
  const body =
    size === 'twig'
      ? `<path d="M8 22 L40 12 M14 12 L36 24 M20 26 L30 8" fill="none" stroke="${L}" stroke-width="6" stroke-linecap="round"/><path d="M8 22 L40 12 M14 12 L36 24 M20 26 L30 8" fill="none" stroke="${col}" stroke-width="3" stroke-linecap="round"/>`
      : size === 'firewood'
        ? `<g stroke="${L}" stroke-width="2.4" stroke-linejoin="round"><rect x="6" y="17" width="36" height="10" rx="5" fill="${dark}"/><rect x="9" y="6" width="30" height="10" rx="5" fill="${col}"/></g>`
        : `<g stroke="${L}" stroke-width="2.4" stroke-linejoin="round"><rect x="4" y="9" width="40" height="18" rx="9" fill="${col}"/><ellipse cx="36" cy="18" rx="5" ry="8" fill="${dark}"/><path d="M36 14.5a2 3.6 0 0 1 0 7" fill="none" stroke="${L}" stroke-width="1.6"/></g>`;
  return `<svg viewBox="0 0 48 32" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;
}

/** 지도 가운데 솔빛 마을 (viewBox 60x60) */
export function villagePinSvg(): string {
  return `<svg viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"><circle cx="30" cy="30" r="27" fill="#232B60" stroke="${L}" stroke-width="2.6"/><path d="M14 33 L30 18 L46 33 V45 H14Z" fill="#FFE14D" stroke="${L}" stroke-width="2.6" stroke-linejoin="round"/><rect x="25" y="34" width="10" height="11" rx="2" fill="#FF4FA0" stroke="${L}" stroke-width="2"/></svg>`;
}

/** 쪽지 (viewBox 32x32) */
export function noteSvg(): string {
  return `<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><path d="M6 5 H26 V22 L20 28 H6Z" fill="#FFE14D" stroke="${L}" stroke-width="2.4" stroke-linejoin="round"/><path d="M20 28 V22 H26" fill="#F3C93A" stroke="${L}" stroke-width="2.2" stroke-linejoin="round"/><path d="M10 11 H22 M10 16 H18" stroke="${L}" stroke-width="2" stroke-linecap="round"/></svg>`;
}

/** 요일 칸 장작 그림 (디자인 5 쉼터 v2 1a): 잔가지(새잎 달린 가지) / 장작(쪼갠 토막) / 통나무(나이테). 크기는 너비 x 높이 */
export const DAY_WOOD: Record<RestSize | 'empty', { w: number; h: number }> = {
  twig: { w: 34, h: 22 },
  firewood: { w: 40, h: 30 },
  log: { w: 44, h: 40 },
  empty: { w: 30, h: 14 },
};

export function dayWoodSvg(kind: RestSize | 'empty'): string {
  const { w, h } = DAY_WOOD[kind];
  const body =
    kind === 'twig'
      ? `<path d="M3 18L31 8M18 13l4-8" stroke="${L}" stroke-width="7" stroke-linecap="round" fill="none"/><path d="M3 18L31 8M18 13l4-8" stroke="#B97D48" stroke-width="3" stroke-linecap="round" fill="none"/><path d="M22.5 5c2-3 6-3.5 8.5-2.5-1 2.8-5 4-8.5 2.5z" fill="#A8EB5A" stroke="${L}" stroke-width="2" stroke-linejoin="round"/>`
      : kind === 'firewood'
        ? `<path d="M11 4.5h21a6 10.5 0 0 1 0 21H11z" fill="#8E5A38" stroke="${L}" stroke-width="2.5" stroke-linejoin="round"/><path d="M18 11h11M20 18.5h9" stroke="#5A3420" stroke-width="2" stroke-linecap="round"/><ellipse cx="11" cy="15" rx="6.5" ry="10.5" fill="#E9B98A" stroke="${L}" stroke-width="2.5"/><ellipse cx="11" cy="15" rx="3.2" ry="5.6" fill="none" stroke="#B97D48" stroke-width="1.8"/>`
        : kind === 'log'
          ? `<path d="M15 3h21a7 17 0 0 1 0 34H15z" fill="#7A4A2E" stroke="${L}" stroke-width="2.5" stroke-linejoin="round"/><path d="M23 10h10M25 20h11M23 30h10" stroke="#4A2A18" stroke-width="2.2" stroke-linecap="round"/><path d="M31 3c1.5 3 4 2.5 5 0" fill="#A8EB5A" stroke="${L}" stroke-width="2" stroke-linejoin="round"/><ellipse cx="15" cy="20" rx="10" ry="17" fill="#E9B98A" stroke="${L}" stroke-width="2.5"/><ellipse cx="15" cy="20" rx="6" ry="10.5" fill="none" stroke="#B97D48" stroke-width="1.8"/><ellipse cx="15" cy="20" rx="2.6" ry="4.4" fill="none" stroke="#B97D48" stroke-width="1.8"/>`
          : `<path d="M3 12q12-10 24 0z" fill="#2B3370" stroke="#4A5290" stroke-width="2" stroke-dasharray="3 3" stroke-linejoin="round"/>`;
  return `<svg viewBox="0 0 ${kind === 'twig' ? 36 : w} ${h}" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;
}
