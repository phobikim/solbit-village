// 쉼터 그림 (디자인 v8 TURN 15): 모닥불 · 장작 크기 · 깃발 · 발자국 · 쪽지. 선 #10142E, 둥근 끝.

import type { FireBand, RestSize } from '../../domain/fire';
import { L } from './svg';

const WOOD = '#B9783C';
const WOOD_DARK = '#8A5528';

const logs = (cx: number, y: number, w: number) =>
  `<g stroke="${L}" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round">` +
  `<rect x="${cx - w}" y="${y}" width="${w * 2}" height="9" rx="4.5" fill="${WOOD}" transform="rotate(-8 ${cx} ${y + 4})"/>` +
  `<rect x="${cx - w}" y="${y}" width="${w * 2}" height="9" rx="4.5" fill="${WOOD_DARK}" transform="rotate(8 ${cx} ${y + 4})"/></g>`;

/** 불 크기: 활활 > 타오름 > 사그라듦 > 꺼져감 (viewBox 100x100) */
const FLAME: Record<FireBand | 'none', { h: number; col: string; core: string }> = {
  blaze: { h: 70, col: '#FF8A3C', core: '#FFE14D' },
  burning: { h: 54, col: '#FF9A3C', core: '#FFE14D' },
  dying: { h: 34, col: '#FF7A4A', core: '#FFC23C' },
  out: { h: 16, col: '#B8604A', core: '#FF9A3C' },
  none: { h: 0, col: '#8F96CC', core: '#C9CEF5' },
};

export function fireSvg(band: FireBand | null): string {
  const f = FLAME[band ?? 'none'];
  const base = 84;
  const top = base - f.h;
  const w = 14 + f.h * 0.22;
  const flame =
    f.h > 0
      ? `<path d="M50 ${top} C${50 + w} ${top + f.h * 0.45} ${50 + w} ${base - 4} 50 ${base - 4} C${50 - w} ${base - 4} ${50 - w} ${top + f.h * 0.45} 50 ${top}Z" fill="${f.col}" stroke="${L}" stroke-width="2.6" stroke-linejoin="round"/>` +
        `<path d="M50 ${top + f.h * 0.38} C${50 + w * 0.5} ${top + f.h * 0.62} ${50 + w * 0.5} ${base - 6} 50 ${base - 6} C${50 - w * 0.5} ${base - 6} ${50 - w * 0.5} ${top + f.h * 0.62} 50 ${top + f.h * 0.38}Z" fill="${f.core}"/>`
      : `<path d="M44 84 q2-8 6-8 t6 8" fill="none" stroke="#8F96CC" stroke-width="2.4" stroke-linecap="round" stroke-dasharray="1 5"/>`;
  return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">${flame}${logs(50, 82, 30)}</svg>`;
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

/** 이번 주 7칸의 작은 장작 (viewBox 24x24) */
export function logCellSvg(col = '#FFB04A'): string {
  return `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><g stroke="${L}" stroke-width="1.6" stroke-linejoin="round"><rect x="3" y="13" width="18" height="6" rx="3" fill="${WOOD_DARK}"/><path d="M12 4 C16 8 16 11 12 13 C8 11 8 8 12 4Z" fill="${col}"/></g></svg>`;
}

/** 깃발 (viewBox 40x48) */
export function flagSvg(col: string, old = false): string {
  const wave = old ? 'M10 6 Q20 2 30 8 Q22 14 30 20 Q20 16 10 20Z' : 'M10 6 H32 L26 13 L32 20 H10Z';
  return `<svg viewBox="0 0 40 48" xmlns="http://www.w3.org/2000/svg"><path d="M10 4V44" stroke="${L}" stroke-width="3.4" stroke-linecap="round"/><path d="${wave}" fill="${col}" stroke="${L}" stroke-width="2.4" stroke-linejoin="round"/><ellipse cx="10" cy="44" rx="6" ry="2.2" fill="${L}" opacity=".35"/></svg>`;
}

/** 발자국 (viewBox 40x48) */
export function footprintSvg(col: string): string {
  const toe = (x: number, y: number, r: number) => `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 1.2}" fill="${col}" stroke="${L}" stroke-width="2"/>`;
  return `<svg viewBox="0 0 40 48" xmlns="http://www.w3.org/2000/svg">${toe(11, 14, 3.6)}${toe(19, 9, 3.8)}${toe(28, 11, 3.6)}${toe(34, 19, 3.2)}<path d="M10 28 C10 22 30 22 30 30 C30 40 24 44 19 44 C13 44 10 36 10 28Z" fill="${col}" stroke="${L}" stroke-width="2.4" stroke-linejoin="round"/></svg>`;
}

/** 지도 가운데 솔빛 마을 (viewBox 60x60) */
export function villagePinSvg(): string {
  return `<svg viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"><circle cx="30" cy="30" r="27" fill="#232B60" stroke="${L}" stroke-width="2.6"/><path d="M14 33 L30 18 L46 33 V45 H14Z" fill="#FFE14D" stroke="${L}" stroke-width="2.6" stroke-linejoin="round"/><rect x="25" y="34" width="10" height="11" rx="2" fill="#FF4FA0" stroke="${L}" stroke-width="2"/></svg>`;
}

/** 쪽지 (viewBox 32x32) */
export function noteSvg(): string {
  return `<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><path d="M6 5 H26 V22 L20 28 H6Z" fill="#FFE14D" stroke="${L}" stroke-width="2.4" stroke-linejoin="round"/><path d="M20 28 V22 H26" fill="#F3C93A" stroke="${L}" stroke-width="2.2" stroke-linejoin="round"/><path d="M10 11 H22 M10 16 H18" stroke="${L}" stroke-width="2" stroke-linecap="round"/></svg>`;
}
