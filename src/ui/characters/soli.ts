// 솔이 (soliIn) — design/solbit-v5.dc.html에서 이식. viewBox 0 0 200 220.

import { cropIconInner } from './crops';
import { L, o, place48 } from './svg';

/** 컨디션 표정: 지침 / 보통 / 신남 */
export type SoliMood = 'tired' | 'normal' | 'happy';

export function soliSvg(m: SoliMood): string {
  const t = m === 'tired';
  const h = m === 'happy';
  const body = '#FFF6D6';
  const foot = '#FFC98A';
  const stemD = t ? 'M100 60 C100 48 94 42 84 40' : 'M100 60 C100 48 102 40 106 32';
  const lv = t
    ? ['M86 41 C76 36 62 42 60 54 C72 56 84 50 86 41Z', 'M84 40 C86 30 80 22 70 20 C66 30 72 38 84 40Z']
    : ['M104 40 C92 28 76 28 70 36 C80 46 94 48 104 40Z', 'M106 32 C116 18 132 16 140 22 C132 34 118 38 106 32Z'];
  const flower = h
    ? [0, 1, 2, 3, 4]
        .map((i) => {
          const a = i * 1.2566;
          return `<circle cx="${(106 + Math.sin(a) * 6).toFixed(1)}" cy="${(28 - Math.cos(a) * 6).toFixed(1)}" r="5.2" fill="#FF4FA0" ${o(3)}/>`;
        })
        .join('') + `<circle cx="106" cy="28" r="3.6" fill="#FFE14D" ${o(2.4)}/>`
    : '';
  const mit = (x: number, y: number, r: number) =>
    `<ellipse cx="${x}" cy="${y}" rx="17" ry="21" transform="rotate(${r} ${x} ${y})" fill="${body}" ${o(6)}/>`;
  const back = h ? mit(36, 94, -40) : t ? mit(34, 160, 10) : mit(32, 140, 20);
  const front = h ? mit(164, 94, 40) : t ? mit(166, 160, -10) : mit(164, 140, -20);
  const sk = `stroke="${L}" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round" fill="none"`;
  const eyes = t
    ? `<path d="M67 124 L81 138 M81 124 L67 138 M119 124 L133 138 M133 124 L119 138" ${sk}/>`
    : h
      ? `<path d="M66 134 Q74 122 82 134 M118 134 Q126 122 134 134" ${sk}/>`
      : `<path d="M64 127 H84 Q84 139 74 139 Q64 139 64 127Z" fill="${L}" ${o(3)}/><path d="M116 127 H136 Q136 139 126 139 Q116 139 116 127Z" fill="${L}" ${o(3)}/><path d="M62 121 L84 123 M116 123 L138 121" stroke="${L}" stroke-width="4" stroke-linecap="round"/>`;
  const mouth = t
    ? `<path d="M92 150 Q96 146 100 150 Q104 154 108 150" stroke="${L}" stroke-width="4.5" stroke-linecap="round" fill="none"/>`
    : h
      ? `<path d="M90 142 Q100 144 110 142 Q109 157 100 157 Q91 157 90 142Z" fill="#5A2A24" ${o(4.5)}/>`
      : `<path d="M93 146 H107" stroke="${L}" stroke-width="4.5" stroke-linecap="round"/>`;
  const ghost = t
    ? `<g transform="translate(150 30)"><path d="M0 34 Q-2 6 16 4 Q34 6 32 34 L27 30 L22 35 L16 30 L10 35 L5 30 Z" fill="#FFFFFF" ${o(3.5)}/><circle cx="11" cy="17" r="2.2" fill="${L}"/><circle cx="21" cy="17" r="2.2" fill="${L}"/></g>`
    : '';
  const spark = h
    ? `<path d="M30 60 l4 10 l10 4 l-10 4 l-4 10 l-4 -10 l-10 -4 l10 -4z" fill="#FFE14D" ${o(3)}/>`
    : '';
  return (
    `<ellipse cx="100" cy="208" rx="62" ry="8" fill="#000" opacity=".25"/>` +
    `<path d="M78 196 Q76 208 84 208 Q92 208 90 196Z M110 196 Q108 208 116 208 Q124 208 122 196Z" fill="${foot}" ${o(5)}/>${back}` +
    `<path d="${stemD}" ${o(10)} fill="none"/><path d="${stemD}" stroke="#5FB04A" stroke-width="4" stroke-linecap="round" fill="none"/>` +
    `<path d="${lv[0]}" fill="#B6F35C" ${o(5)}/><path d="${lv[1]}" fill="#7FD24A" ${o(5)}/>${flower}` +
    `<ellipse cx="100" cy="130" rx="72" ry="69" fill="${body}" ${o(6)}/>${front}` +
    `<circle cx="56" cy="152" r="9" fill="#FF8E8E" opacity=".9"/><circle cx="144" cy="152" r="9" fill="#FF8E8E" opacity=".9"/>` +
    `${eyes}${mouth}${ghost}${spark}`
  );
}

/** 솔이 스킨 (design skinIn 이식). 솔이 그림 위에 겹쳐 그린다. viewBox 0 0 200 220. */
export function soliSkinSvg(id: string | null): string {
  if (id === 'hat')
    return `<ellipse cx="100" cy="68" rx="80" ry="14" fill="#F7D98A" ${o(5)}/><path d="M62 68 Q60 26 100 24 Q140 26 138 68Z" fill="#F2CD6B" ${o(5)}/><path d="M61.5 56 Q100 64 138.5 56 L138 68 Q100 76 62 68Z" fill="#FF4FA0" ${o(4)}/><path d="M76 40 l6 4 M100 32 l6 4 M120 38 l6 4" stroke="#C9A04A" stroke-width="3" stroke-linecap="round"/>`;
  if (id === 'band')
    return `<path d="M38 100 Q100 34 162 100" stroke="${L}" stroke-width="13" fill="none" stroke-linecap="round"/><path d="M38 100 Q100 34 162 100" stroke="#FF4A5E" stroke-width="7" fill="none" stroke-linecap="round"/>` +
      place48(cropIconInner('strawberry'), 42, 46, 34) + place48(cropIconInner('strawberry'), 124, 46, 34);
  if (id === 'apron')
    return `<path d="M78 162 Q100 150 122 162" stroke="${L}" stroke-width="4" fill="none"/><path d="M64 164 H136 L132 196 Q100 204 68 196Z" fill="#8E5A34" ${o(5)}/><rect x="88" y="172" width="24" height="16" rx="4" fill="#B57A4E" ${o(3)}/>` +
      place48(cropIconInner('coffee'), 91, 168, 18);
  if (id === 'mush')
    return `<path d="M162 142 L146 34" ${o(6)}/><path d="M162 142 L146 34" stroke="#FFF6D6" stroke-width="2.5" stroke-linecap="round"/><path d="M98 40 Q100 0 146 0 Q192 0 194 40 Q146 32 98 40Z" fill="#FF6B5A" ${o(5)}/><circle cx="124" cy="20" r="7" fill="#FFFFFF"/><circle cx="156" cy="12" r="5.5" fill="#FFFFFF"/><circle cx="174" cy="28" r="5" fill="#FFFFFF"/>`;
  return '';
}
