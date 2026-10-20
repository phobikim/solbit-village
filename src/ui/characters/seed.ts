// 씨앗 결과 그림 — design/solbit-v5.dc.html의 seedArt(9b), fullArt(9c) 이식. 작물·칸을 매개변수로 받는다.

import type { CropKind } from '../../domain/types';
import { cropIconInner } from './crops';
import { L, o, place48, svgBodyFont, svgNumberFont } from './svg';

const sparkle = (x: number, y: number, r: number) =>
  `<path d="M${x} ${y - r} Q${x} ${y} ${x + r} ${y} Q${x} ${y} ${x} ${y + r} Q${x} ${y} ${x - r} ${y} Q${x} ${y} ${x} ${y - r}Z" fill="#FFE14D"/>`;

/** 9b: 웃는 씨앗 + 어떤 작물이 될지 (viewBox 300x200) */
export function seedArtSvg(crop: CropKind): string {
  return `<svg viewBox="0 0 300 200" xmlns="http://www.w3.org/2000/svg">
<ellipse cx="150" cy="178" rx="120" ry="26" fill="#5A3E5E" ${o(4)}/><path d="M60 176 q20 -6 40 0 M190 180 q20 -6 40 0" stroke="#45304A" stroke-width="4" stroke-linecap="round" fill="none"/>
<path d="M150 78 Q186 122 176 150 Q166 172 150 172 Q134 172 124 150 Q114 122 150 78Z" fill="#FF6B8A" ${o(5)}/><path d="M138 108 Q132 126 136 146" stroke="#FFFFFF" stroke-width="6" stroke-linecap="round" fill="none" opacity=".55"/>
<circle cx="141" cy="134" r="4.5" fill="${L}"/><circle cx="160" cy="134" r="4.5" fill="${L}"/><path d="M144 146 Q150.5 152 157 146" stroke="${L}" stroke-width="3.5" stroke-linecap="round" fill="none"/><circle cx="133" cy="144" r="5" fill="#FFB3C7"/><circle cx="168" cy="144" r="5" fill="#FFB3C7"/>
<path d="M150 80 C150 66 154 58 160 52" stroke="${L}" stroke-width="7" stroke-linecap="round" fill="none"/><path d="M150 80 C150 66 154 58 160 52" stroke="#5FB04A" stroke-width="3" stroke-linecap="round" fill="none"/><path d="M158 54 C150 42 138 42 132 48 C140 58 152 60 158 54Z" fill="#B6F35C" ${o(3.5)}/><path d="M160 52 C168 40 182 38 188 42 C182 54 168 58 160 52Z" fill="#7FD24A" ${o(3.5)}/>
<circle cx="246" cy="62" r="34" fill="none" stroke="#5A63A8" stroke-width="3" stroke-dasharray="6 7"/>${place48(cropIconInner(crop), 222, 36, 48)}<path d="M196 92 Q212 84 216 74" stroke="#8F96CC" stroke-width="3" stroke-dasharray="4 6" fill="none" stroke-linecap="round"/>
${sparkle(70, 70, 9)}${sparkle(94, 40, 5)}${sparkle(208, 136, 6)}</svg>`;
}

/**
 * 9c: 밭 5칸(새로 심은 칸에 NEW) + 대신 딴 작물이 창고로 날아가는 그림 (viewBox 304x196)
 * plots: 심은 뒤의 5칸 작물, newSlot: 새로 심은 칸, harvested: 대신 딴 작물
 */
export function fullArtSvg(plots: readonly (CropKind | null)[], newSlot: number, harvested: CropKind): string {
  const xs = [16, 72, 128, 184, 240];
  let s = '';
  xs.forEach((x, i) => {
    s += `<rect x="${x}" y="150" width="48" height="30" rx="8" fill="#5A3E5E" ${o(3.5)}/><path d="M${x + 8} 168 H${x + 40}" stroke="#45304A" stroke-width="3" stroke-linecap="round"/>`;
    const c = plots[i];
    if (c) s += place48(cropIconInner(c), x + 9, 120, 30);
  });
  const nx = xs[newSlot] ?? xs[0];
  s += `<rect x="${nx + 4}" y="104" width="40" height="18" rx="9" fill="#A8EB5A" ${o(2.5)}/><text x="${nx + 24}" y="117" text-anchor="middle" ${svgNumberFont} font-size="11" fill="${L}">NEW</text>`;
  s += `<path d="M${nx + 24} 100 Q100 18 214 40" stroke="#8F96CC" stroke-width="3" stroke-dasharray="5 7" fill="none" stroke-linecap="round"/>`;
  s += place48(cropIconInner(harvested), 98, 26, 40);
  s += `<path d="M88 40 l-10 -4 M88 50 l-12 0 M90 60 l-10 4" stroke="#FFE14D" stroke-width="3" stroke-linecap="round"/>`;
  s += `<circle cx="244" cy="38" r="3.5" fill="#FF8A5C" ${o(1.6)}/>${place48(cropIconInner('strawberry'), 226, 18, 22)}${place48(cropIconInner('potato'), 244, 20, 20)}`;
  s += `<rect x="216" y="36" width="56" height="34" rx="6" fill="#E8B070" ${o(3.5)}/><path d="M222 53 H266" stroke="#B57A3E" stroke-width="3"/>`;
  s += `<text x="244" y="90" text-anchor="middle" ${svgBodyFont} font-size="12" fill="#C9CEF5">창고</text>`;
  return `<svg viewBox="0 0 304 196" xmlns="http://www.w3.org/2000/svg">${s}</svg>`;
}
