// design/solbit-v5.dc.html <script data-dc-script>의 공통 헬퍼 이식.
// 원본은 중첩 <svg>로 배치했지만, react-native-svg 호환을 위해 <g transform>으로 바꾼다.

import { fonts } from '../theme';

/** 선 색 */
export const L = '#10142E';

/** 공통 외곽선 속성 */
export function o(w: number): string {
  return `stroke="${L}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
}

/** 캐릭터 단독 표시용. viewBox 0 0 200 220 규칙. */
export function wrap(inner: string): string {
  return `<svg viewBox="0 0 200 220" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;
}

/** 캐릭터(200x220)를 (x, y)에 너비 w로 배치 */
export function nest(inner: string, x: number, y: number, w: number): string {
  return `<g transform="translate(${x} ${y}) scale(${(w / 200).toFixed(4)})">${inner}</g>`;
}

/** 48x48 아이콘을 (x, y)에 크기 s로 배치 */
export function place48(inner: string, x: number, y: number, s: number): string {
  return `<g transform="translate(${x} ${y}) scale(${(s / 48).toFixed(4)})">${inner}</g>`;
}

/** 시안 속 SVG <text>의 font-family="NanumSquareRound" + weight 800 → 앱에 로드한 폰트 이름 */
export const svgBodyFont = `font-family="${fonts.bodyHeavy}"`;
export const svgNumberFont = `font-family="${fonts.numberBold}"`;

/** 반짝이 별 (네 꼭짓점) */
export function star(x: number, y: number, r: number): string {
  return `<path d="M${x} ${y - r} Q${x} ${y} ${x + r} ${y} Q${x} ${y} ${x} ${y + r} Q${x} ${y} ${x - r} ${y} Q${x} ${y} ${x} ${y - r}Z" fill="#FFE14D"/>`;
}

/** 구름 */
export function cloud(x: number, y: number, s: number, f: string): string {
  return `<path transform="translate(${x} ${y}) scale(${s})" d="M-8 12 H38 A9 9 0 0 0 36 -4 A14 14 0 0 0 10 -10 A15 15 0 0 0 -8 12 Z" fill="${f}" stroke="${L}" stroke-width="${(2.6 / s).toFixed(2)}" stroke-linejoin="round"/>`;
}

/** 다섯 잎 꽃 */
export function flower(x: number, y: number, col: string): string {
  const petals = [0, 1, 2, 3, 4]
    .map((i) => {
      const a = i * 1.2566;
      return `<circle cx="${(x + Math.sin(a) * 4).toFixed(1)}" cy="${(y - 12 - Math.cos(a) * 4).toFixed(1)}" r="3.6" fill="${col}" ${o(1.6)}/>`;
    })
    .join('');
  return `<path d="M${x} ${y} v-8" stroke="#3E8A3A" stroke-width="2.5" stroke-linecap="round"/>${petals}<circle cx="${x}" cy="${y - 12}" r="2.4" fill="#FFE14D" ${o(1.4)}/>`;
}

/** 꽃봉오리 */
export function bud(x: number, y: number): string {
  return `<path d="M${x} ${y} v-7" stroke="#3E8A3A" stroke-width="2.5" stroke-linecap="round"/><ellipse cx="${x}" cy="${y - 10}" rx="3" ry="4.5" fill="#7FD24A" ${o(1.6)}/>`;
}
