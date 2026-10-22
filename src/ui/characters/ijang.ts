// 꾸역 이장 (ijangIn) — design/solbit-v5.dc.html에서 이식. viewBox 0 0 200 220.
// 이장 소품 스킨은 design ijSkinIn 이식: 소품을 쓰면 확성기 · 컵을 내려놓고 두 손을 내린다 ('plain').

import { L, nest, o, star, svgBodyFont } from './svg';

/** 기본 / 시큰둥 / 방송 중 / 살짝 웃음 */
export type IjangMood = 'base' | 'meh' | 'cast' | 'smile';

const BODY = '#FFD9A8';

/** 소품을 든 오른손 (소품 위에 다시 그린다) */
const holdMit = `<ellipse cx="166" cy="162" rx="16" ry="20" transform="rotate(-10 166 162)" fill="${BODY}" ${o(6)}/>`;

/** 새마을 모자 (밀짚모자 대신 쓴다) */
const capHat =
  `<path d="M50 92 Q50 38 100 36 Q150 38 150 92Z" fill="#5FB04A" ${o(5)}/>` +
  `<path d="M54 88 Q100 98 146 88 Q160 108 100 112 Q40 108 54 88Z" fill="#3E8A3A" ${o(5)}/>` +
  `<circle cx="100" cy="62" r="13" fill="#FFE14D" ${o(4)}/>` +
  `<path d="M100 70 V60 M100 62 q-7 -1 -8 -8 q7 0 8 8z M100 62 q7 -1 8 -8 q-7 0 -8 8z" stroke="${L}" stroke-width="2.4" fill="#5FB04A" stroke-linejoin="round"/>`;

/** 이장. skin: 쓰고 있는 이장 소품 스킨 id (없으면 null) */
export function ijangSvg(m: IjangMood, skin: string | null = null): string {
  if (skin === 'tractor') return tractorSvg();
  return ijangBody(m, skin) + (skin ? propOver(skin) : '');
}

/** 트랙터: 맨손 이장이 트랙터에 앉아 있다 */
function tractorSvg(): string {
  return (
    `<ellipse cx="104" cy="214" rx="92" ry="7" fill="#000" opacity=".25"/>` +
    nest(ijangBody('base', 'tractor'), 38, -4, 100) +
    `<path d="M168 112 V70" ${o(10)}/><path d="M168 112 V70" stroke="#6A6F9E" stroke-width="5" stroke-linecap="round"/>` +
    `<circle cx="174" cy="56" r="7" fill="#9AA3C8" opacity=".7"/><circle cx="184" cy="40" r="9" fill="#9AA3C8" opacity=".5"/>` +
    `<path d="M20 160 V104 Q20 94 30 94 H112 V160Z" fill="#FF5A4A" ${o(5)}/>` +
    `<path d="M112 160 V116 Q112 108 120 108 H184 Q194 108 194 118 V160Z" fill="#FF5A4A" ${o(5)}/>` +
    `<path d="M126 122 H180 M126 134 H180" stroke="#B32A2A" stroke-width="4" stroke-linecap="round"/>` +
    `<rect x="180" y="140" width="14" height="10" rx="3" fill="#FFE14D" ${o(3)}/>` +
    `<circle cx="62" cy="172" r="40" fill="#2A2E4A" ${o(5)}/><circle cx="62" cy="172" r="18" fill="#FFE14D" ${o(4)}/><circle cx="62" cy="172" r="6" fill="${L}"/>` +
    `<circle cx="162" cy="188" r="24" fill="#2A2E4A" ${o(5)}/><circle cx="162" cy="188" r="10" fill="#FFE14D" ${o(3.5)}/>` +
    `<rect x="34" y="104" width="40" height="18" rx="6" fill="#FFFFFF" ${o(3)}/>` +
    `<text x="54" y="117" text-anchor="middle" ${svgBodyFont} font-size="11" fill="${L}">이장</text>`
  );
}

/** 이장 위에 덧그리는 소품 */
function propOver(skin: string): string {
  if (skin === 'shades')
    return (
      `<rect x="54" y="113" width="42" height="27" rx="12" fill="${L}"/><rect x="104" y="113" width="42" height="27" rx="12" fill="${L}"/>` +
      `<path d="M96 121 H104 M54 120 L38 112 M146 120 L162 112" ${o(5)}/>` +
      `<path d="M63 121 h9 M113 121 h9" stroke="#5FD8FF" stroke-width="3.5" stroke-linecap="round"/>`
    );
  if (skin === 'fan')
    return (
      `<path d="M166 160 L170 128" ${o(8)}/><path d="M166 160 L170 128" stroke="#B9825A" stroke-width="3.5" stroke-linecap="round"/>` +
      `<circle cx="172" cy="100" r="32" fill="#F2CD6B" ${o(5)}/>` +
      [0, 1, 2, 3, 4, 5]
        .map((i) => {
          const a = (i * Math.PI) / 3;
          return `<path d="M172 100 L${(172 + Math.cos(a) * 28).toFixed(1)} ${(100 + Math.sin(a) * 28).toFixed(1)}" stroke="#C9A04A" stroke-width="3" stroke-linecap="round"/>`;
        })
        .join('') +
      `<circle cx="172" cy="100" r="6" fill="#FF4FA0" ${o(3)}/>` +
      `<path d="M18 108 q-8 6 0 12 M8 100 q-10 12 0 24" stroke="#9AA3C8" stroke-width="3.5" stroke-linecap="round" fill="none"/>` +
      holdMit
    );
  if (skin === 'rod')
    return (
      `<path d="M166 168 L196 4" ${o(8)}/><path d="M166 168 L196 4" stroke="#B9825A" stroke-width="3.5" stroke-linecap="round"/>` +
      `<path d="M196 4 Q212 40 206 86" stroke="#E6E8F5" stroke-width="2" fill="none"/>` +
      `<circle cx="206" cy="94" r="8" fill="#FFFFFF" ${o(3)}/><path d="M198 94 A8 8 0 0 1 214 94Z" fill="#FF5A4A" ${o(3)}/>` +
      holdMit
    );
  if (skin === 'mic')
    return (
      `<g transform="rotate(22 166 150)"><rect x="159" y="114" width="14" height="48" rx="6" fill="#FF4FA0" ${o(4.5)}/>` +
      `<circle cx="166" cy="104" r="16" fill="#E6E8F5" ${o(5)}/><path d="M154 98 H178 M152 108 H180 M166 88 V120" stroke="#9AA3C8" stroke-width="2.4"/></g>` +
      holdMit +
      star(30, 62, 10) +
      star(186, 44, 7) +
      star(18, 104, 5) +
      `<text x="46" y="40" font-family="Fredoka" font-weight="700" font-size="26" fill="#FF8CC6">♪</text>` +
      `<text x="150" y="30" font-family="Fredoka" font-weight="700" font-size="20" fill="#5FD8FF">♫</text>`
    );
  return '';
}

function ijangBody(m: IjangMood, skin: string | null): string {
  const body = BODY;
  const plain = skin !== null;
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
  if (plain) {
    back = mit(34, 162, 10);
    front = mit(166, 162, -10);
  } else if (cast) {
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
  const strawHat =
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
    `${eyes}<path d="${brows}" stroke="${L}" stroke-width="5" stroke-linecap="round" fill="none"/>${mouth}${skin === 'cap' ? capHat : strawHat}${front}${waves}`
  );
}
