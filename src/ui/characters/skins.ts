// 마을 건물 스킨 그림 (design bldIn 이식). viewBox 0 0 200 220.
// 솔이 스킨은 soli.ts의 soliSkinSvg, 이장 소품은 ijang.ts의 ijangSvg(…, skinId).

import { L, o, svgBodyFont } from './svg';

const ground = `<ellipse cx="100" cy="206" rx="86" ry="8" fill="#000" opacity=".25"/>`;
const text = (x: number, y: number, t: string, size: number) =>
  `<text x="${x}" y="${y}" text-anchor="middle" ${svgBodyFont} font-size="${size}" fill="${L}">${t}</text>`;

/** 마을 건물 스킨: 메인 마을 냇가 오른쪽 언덕에 놓인다 */
export function buildingSvg(id: string): string {
  if (id === 'roof')
    return (
      ground +
      `<rect x="40" y="104" width="120" height="98" rx="8" fill="#7A5446" ${o(5)}/>` +
      `<path d="M22 112 L100 42 L178 112Z" fill="#5FD8FF" ${o(5)}/>` +
      `<path d="M46 96 L100 50 M70 104 L106 70" stroke="#BFEFFF" stroke-width="4" stroke-linecap="round"/>` +
      `<rect x="56" y="138" width="30" height="64" rx="5" fill="#B9825A" ${o(4)}/><circle cx="80" cy="172" r="3" fill="${L}"/>` +
      `<rect x="102" y="128" width="42" height="32" rx="5" fill="#FFE14D" ${o(4)}/><path d="M123 128 V160 M102 144 H144" stroke="${L}" stroke-width="3"/>` +
      `<path d="M100 42 C100 30 104 26 108 22" stroke="${L}" stroke-width="6" stroke-linecap="round" fill="none"/>` +
      `<path d="M107 23 C101 14 90 14 86 20 C91 26 101 27 107 23Z M108 22 C114 13 125 12 129 16 C125 24 114 25 108 22Z" fill="#B6F35C" ${o(3)}/>`
    );
  if (id === 'post')
    return (
      ground +
      `<rect x="54" y="190" width="92" height="16" rx="5" fill="#6A6F9E" ${o(4.5)}/>` +
      `<path d="M64 192 V100 Q64 58 100 58 Q136 58 136 100 V192Z" fill="#FF5A4A" ${o(5)}/>` +
      `<path d="M76 76 Q88 66 102 66" stroke="#FFA49A" stroke-width="5" stroke-linecap="round" fill="none"/>` +
      `<rect x="78" y="98" width="44" height="9" rx="4.5" fill="${L}"/>` +
      `<rect x="78" y="126" width="44" height="28" rx="5" fill="#FFFFFF" ${o(3.5)}/>` +
      text(100, 145, '우편', 13)
    );
  if (id === 'scarecrow')
    return (
      ground +
      `<path d="M100 92 V206" ${o(10)}/><path d="M100 92 V206" stroke="#B9825A" stroke-width="5" stroke-linecap="round"/>` +
      `<path d="M26 122 H174" ${o(9)}/><path d="M26 122 H174" stroke="#B9825A" stroke-width="4" stroke-linecap="round"/>` +
      `<path d="M58 110 H142 L134 176 H66Z" fill="#5FD8FF" ${o(5)}/>` +
      `<rect x="104" y="138" width="18" height="16" rx="3" fill="#FF8CC6" ${o(3)}/>` +
      `<path d="M20 122 l-8 -6 M20 122 l-9 3 M20 122 l-6 9 M180 122 l8 -6 M180 122 l9 3 M180 122 l6 9 M90 176 l-4 12 M100 176 v13 M110 176 l4 12" stroke="#E8C24A" stroke-width="4" stroke-linecap="round"/>` +
      `<circle cx="100" cy="76" r="30" fill="#E8C98A" ${o(5)}/>` +
      `<path d="M84 70 l8 8 M92 70 l-8 8 M108 70 l8 8 M116 70 l-8 8" stroke="${L}" stroke-width="4" stroke-linecap="round"/>` +
      `<path d="M88 92 h24" stroke="${L}" stroke-width="3.5" stroke-dasharray="4 3" stroke-linecap="round"/>` +
      `<ellipse cx="100" cy="52" rx="48" ry="9" fill="#F7D98A" ${o(4.5)}/>` +
      `<path d="M76 52 Q76 26 100 26 Q124 26 124 52Z" fill="#F2CD6B" ${o(4.5)}/>`
    );
  if (id === 'barn')
    return (
      ground +
      `<path d="M28 202 V104 L100 54 L172 104 V202Z" fill="#FF6B5A" ${o(5)}/>` +
      `<path d="M20 108 L100 50 L180 108" fill="none" stroke="${L}" stroke-width="12" stroke-linejoin="round" stroke-linecap="round"/>` +
      `<path d="M20 108 L100 50 L180 108" fill="none" stroke="#FFF6D6" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"/>` +
      `<rect x="86" y="80" width="28" height="22" rx="4" fill="#FFE14D" ${o(4)}/>` +
      `<rect x="64" y="130" width="72" height="72" rx="4" fill="#FFF6D6" ${o(4.5)}/>` +
      `<path d="M68 134 L132 198 M132 134 L68 198" stroke="#FF6B5A" stroke-width="7" stroke-linecap="round"/>` +
      `<path d="M146 206 Q140 172 156 166 H176 Q192 172 186 206Z" fill="#E8C98A" ${o(4.5)}/>` +
      `<path d="M156 166 Q166 158 176 166" ${o(4)}/>` +
      text(166, 194, '씨앗', 11)
    );
  if (id === 'store')
    return (
      ground +
      `<rect x="26" y="78" width="148" height="124" rx="8" fill="#E6E8F5" ${o(5)}/>` +
      `<rect x="56" y="44" width="88" height="28" rx="8" fill="#A8EB5A" ${o(4.5)}/>` +
      text(100, 65, '24시', 17) +
      `<path d="M58 72 V78 M142 72 V78" ${o(4)}/>` +
      [0, 1, 2, 3, 4, 5]
        .map((i) => `<path d="M${(18 + i * 27.3).toFixed(1)} 84 h27.3 v18 q-13.6 10 -27.3 0z" fill="${i % 2 ? '#FFFFFF' : '#FF4FA0'}" ${o(3.5)}/>`)
        .join('') +
      `<rect x="38" y="116" width="76" height="60" rx="5" fill="#5FD8FF" ${o(4)}/>` +
      `<path d="M50 128 l14 -8 M50 144 l26 -16" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round"/>` +
      `<rect x="124" y="114" width="38" height="88" rx="5" fill="#BFEFFF" ${o(4)}/>` +
      `<path d="M143 114 V202" stroke="${L}" stroke-width="3"/>`
    );
  return '';
}
