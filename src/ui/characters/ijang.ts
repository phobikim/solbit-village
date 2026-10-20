// 꾸역 이장 (ijangIn) — design/solbit-v5.dc.html에서 이식. viewBox 0 0 200 220.

import { L, o, svgBodyFont } from './svg';

/** 기본 / 시큰둥 / 방송 중 / 살짝 웃음 */
export type IjangMood = 'base' | 'meh' | 'cast' | 'smile';

export function ijangSvg(m: IjangMood): string {
  const body = '#FFD9A8';
  const cast = m === 'cast';
  const meh = m === 'meh';
  const sm = m === 'smile';
  const mit = (x: number, y: number, r: number) =>
    `<ellipse cx="${x}" cy="${y}" rx="16" ry="20" transform="rotate(${r} ${x} ${y})" fill="${body}" ${o(6)}/>`;
  const mega = (x: number, y: number, r: number, s: number) =>
    `<g transform="translate(${x} ${y}) rotate(${r}) scale(${s})"><rect x="-10" y="-7" width="12" height="14" rx="3" fill="${L}"/><path d="M0 -9 L48 -26 Q56 0 48 26 L0 9Z" fill="#F4F6FB" ${o(5)}/><ellipse cx="49" cy="0" rx="7" ry="26" fill="#FF4FA0" ${o(5)}/><rect x="10" y="8" width="9" height="18" rx="3" fill="#FFE14D" ${o(4)}/></g>`;
  const cup = (x: number, y: number) =>
    `<g transform="translate(${x} ${y})"><path d="M0 0 H24 L21 32 Q12 35 3 32Z" fill="#FFFFFF" ${o(4.5)}/><path d="M1.6 11 H22.4 L21.6 21 H2.4Z" fill="#F0A93A"/><path d="M0 0 H24 L21 32 Q12 35 3 32Z" fill="none" ${o(4.5)}/><path d="M8 -6 Q4 -12 9 -18 M16 -6 Q12 -12 17 -18" stroke="#9AA3C8" stroke-width="3" stroke-linecap="round" fill="none"/></g>`;
  let back: string;
  let front: string;
  if (cast) {
    back = cup(10, 128) + mit(28, 164, 10);
    front = mega(108, 152, -8, 1.05) + mit(126, 178, -10);
  } else if (meh) {
    back = mit(34, 162, 10);
    front = cup(150, 106) + mit(164, 140, -30);
  } else {
    back = mega(30, 148, 100, 0.8) + mit(34, 158, 10);
    front = cup(146, 124) + mit(160, 160, -20);
  }
  const lid = meh ? 130 : 127;
  const dp = meh ? 7 : 12;
  const eyes =
    [76, 124]
      .map(
        (x) =>
          `<path d="M${x - 9} ${lid} Q${x} ${lid + dp} ${x + 9} ${lid}Z" fill="${L}" ${o(2)}/><path d="M${x - 13} ${lid} H${x + 13}" stroke="${L}" stroke-width="5" stroke-linecap="round"/>`,
      )
      .join('') +
    (meh
      ? `<path d="M66 143 Q76 147 86 143 M114 143 Q124 147 134 143" stroke="${L}" stroke-width="2.6" stroke-linecap="round" fill="none" opacity=".5"/>`
      : '');
  const brows = meh
    ? 'M62 117 L88 118 M112 113 L138 107'
    : cast
      ? 'M62 110 L88 116 M112 116 L138 110'
      : sm
        ? 'M62 116 Q75 111 88 116 M112 116 Q125 111 138 116'
        : 'M62 114 L88 117 M112 117 L138 114';
  const mouth = cast
    ? `<ellipse cx="96" cy="161" rx="6" ry="7" fill="#5A2A24" ${o(3.5)}/>`
    : `<path d="${meh ? 'M88 163 Q100 155 112 161' : sm ? 'M91 158 Q100 166 109 158' : 'M90 161 Q100 158 110 161'}" stroke="${L}" stroke-width="4.5" stroke-linecap="round" fill="none"/>`;
  const hat =
    `<g ${meh ? 'transform="rotate(-9 100 86)"' : ''}><ellipse cx="100" cy="88" rx="88" ry="16" fill="#F7D98A" ${o(5)}/>` +
    `<path d="M58 88 Q56 42 100 40 Q144 42 142 88Z" fill="#F2CD6B" ${o(5)}/>` +
    `<path d="M57.5 76 Q100 84 142.5 76 L142 88 Q100 96 58 88Z" fill="#FF4FA0" ${o(4)}/>` +
    `<path d="M72 58 l6 4 M94 50 l6 4 M118 54 l6 4 M30 90 l6 3 M160 90 l6 -3" stroke="#C9A04A" stroke-width="3" stroke-linecap="round"/></g>`;
  const waves = cast
    ? `<path d="M178 116 Q192 140 180 166 M192 104 Q210 140 194 178" stroke="#FFE14D" stroke-width="5" stroke-linecap="round" fill="none"/>`
    : '';
  const cheek = sm ? 0.95 : 0.45;
  return (
    `<ellipse cx="100" cy="210" rx="60" ry="8" fill="#000" opacity=".25"/>` +
    `<ellipse cx="78" cy="206" rx="18" ry="7" fill="#5FD8FF" ${o(4.5)}/><ellipse cx="122" cy="206" rx="18" ry="7" fill="#5FD8FF" ${o(4.5)}/>` +
    `<path d="M68 204 Q78 194 88 204 M112 204 Q122 194 132 204" stroke="${L}" stroke-width="9" stroke-linecap="round" fill="none"/>` +
    `<path d="M68 204 Q78 194 88 204 M112 204 Q122 194 132 204" stroke="#FF4FA0" stroke-width="4" stroke-linecap="round" fill="none"/>` +
    `${back}<ellipse cx="100" cy="136" rx="66" ry="64" fill="${body}" ${o(6)}/>` +
    `<rect x="52" y="170" width="34" height="16" rx="5" fill="#FFFFFF" ${o(3)}/>` +
    `<text x="69" y="182" text-anchor="middle" ${svgBodyFont} font-size="10" fill="${L}">이장</text>` +
    `<circle cx="58" cy="150" r="8" fill="#FF9E8E" opacity="${cheek}"/><circle cx="142" cy="150" r="8" fill="#FF9E8E" opacity="${cheek}"/>` +
    `<path d="M84 150 Q92 144 100 149 Q108 144 116 150 Q108 155 100 151 Q92 155 84 150Z" fill="#6A4A3A" ${o(2.5)}/>` +
    `${eyes}<path d="${brows}" stroke="${L}" stroke-width="5" stroke-linecap="round" fill="none"/>${mouth}${hat}${front}${waves}`
  );
}
