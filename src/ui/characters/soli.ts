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

/** 솔이 뒤에 그리는 스킨 (배낭). 없으면 '' */
export function soliSkinBackSvg(id: string | null): string {
  if (id === 'pack')
    return (
      `<path d="M76 34 Q76 14 100 14 Q124 14 124 34" stroke="${L}" stroke-width="13" stroke-linecap="round" fill="none"/><path d="M76 34 Q76 14 100 14 Q124 14 124 34" stroke="#A8EB5A" stroke-width="6" stroke-linecap="round" fill="none"/>` +
      `<rect x="18" y="32" width="164" height="168" rx="46" fill="#FF8A5C" ${o(5)}/><path d="M24 84 Q100 58 176 84" stroke="${L}" stroke-width="4" fill="none"/>` +
      `<rect x="2" y="118" width="30" height="58" rx="12" fill="#FF6B5A" ${o(4.5)}/><rect x="168" y="118" width="30" height="58" rx="12" fill="#FF6B5A" ${o(4.5)}/>`
    );
  return '';
}

/** 스킨을 입은 솔이 (뒤 · 몸 · 앞 순서) */
export function soliWithSkinSvg(m: SoliMood, id: string | null): string {
  return soliSkinBackSvg(id) + soliSvg(m) + soliSkinSvg(id);
}

/** 솔이 스킨 (design skinIn 이식). 솔이 그림 위에 겹쳐 그린다 (시안 미리보기는 보통 표정). viewBox 0 0 200 220. */
export function soliSkinSvg(id: string | null): string {
  if (id === 'hat')
    return `<ellipse cx="100" cy="68" rx="80" ry="14" fill="#F7D98A" ${o(5)}/><path d="M62 68 Q60 26 100 24 Q140 26 138 68Z" fill="#F2CD6B" ${o(5)}/><path d="M61.5 56 Q100 64 138.5 56 L138 68 Q100 76 62 68Z" fill="#FF4FA0" ${o(4)}/><path d="M76 40 l6 4 M100 32 l6 4 M120 38 l6 4" stroke="#C9A04A" stroke-width="3" stroke-linecap="round"/>`;
  if (id === 'band')
    return `<path d="M38 100 Q100 34 162 100" stroke="${L}" stroke-width="13" fill="none" stroke-linecap="round"/><path d="M38 100 Q100 34 162 100" stroke="#FF4A5E" stroke-width="7" fill="none" stroke-linecap="round"/>` +
      place48(cropIconInner('strawberry'), 42, 46, 34) + place48(cropIconInner('strawberry'), 124, 46, 34);
  if (id === 'glasses')
    return `<circle cx="73" cy="130" r="25" fill="none" ${o(6)}/><circle cx="127" cy="130" r="25" fill="none" ${o(6)}/><path d="M97 126 Q100 121 103 126 M48 126 L30 118 M152 126 L170 118" stroke="${L}" stroke-width="6" stroke-linecap="round" fill="none"/>`;
  if (id === 'pj')
    return (
      `<path d="M40 104 Q42 48 94 40 Q126 34 144 20 Q152 52 160 104 Q130 80 100 80 Q70 80 40 104Z" fill="#C49BFF" ${o(5)}/>` +
      `<path d="M40 102 Q100 70 160 102" stroke="${L}" stroke-width="13" stroke-linecap="round" fill="none"/><path d="M40 102 Q100 70 160 102" stroke="#FFFFFF" stroke-width="7" stroke-linecap="round" fill="none"/>` +
      `<circle cx="145" cy="19" r="11" fill="#FFFFFF" ${o(4.5)}/><path d="M48 128 H34 M152 128 H166" ${o(5)}/>` +
      `<rect x="48" y="113" width="104" height="32" rx="16" fill="#5A63A8" ${o(5)}/><path d="M62 128 Q74 137 86 128 M114 128 Q126 137 138 128" stroke="#FFE14D" stroke-width="4" stroke-linecap="round" fill="none"/>`
    );
  if (id === 'rain')
    return (
      `<path d="M32 124 Q26 50 100 46 Q174 50 168 124 Q162 90 100 86 Q38 90 32 124Z" fill="#FFE14D" ${o(5)}/><path d="M60 64 Q76 54 92 52" stroke="#FFF6D6" stroke-width="5" stroke-linecap="round" fill="none"/>` +
      `<rect x="54" y="180" width="32" height="30" rx="9" fill="#FFC23C" ${o(5)}/><rect x="114" y="180" width="32" height="30" rx="9" fill="#FFC23C" ${o(5)}/><path d="M54 190 H86 M114 190 H146" stroke="${L}" stroke-width="3"/>`
    );
  if (id === 'phones')
    return (
      `<path d="M34 114 Q100 20 166 114" stroke="${L}" stroke-width="15" stroke-linecap="round" fill="none"/><path d="M34 114 Q100 20 166 114" stroke="#5FD8FF" stroke-width="8" stroke-linecap="round" fill="none"/>` +
      `<rect x="18" y="96" width="28" height="42" rx="13" fill="#FF4FA0" ${o(5)}/><rect x="154" y="96" width="28" height="42" rx="13" fill="#FF4FA0" ${o(5)}/>` +
      `<path d="M32 136 Q38 168 74 166" stroke="${L}" stroke-width="5" stroke-linecap="round" fill="none"/><circle cx="78" cy="166" r="7" fill="${L}"/>`
    );
  if (id === 'ice')
    return `<g transform="translate(4 50)"><rect x="158" y="72" width="10" height="26" rx="4" fill="#E8B070" ${o(3.5)}/><path d="M146 40 Q146 20 163 20 Q180 20 180 40 V76 Q180 82 174 82 H152 Q146 82 146 76Z" fill="#7FE0D0" ${o(5)}/><path d="M146 52 H180" stroke="${L}" stroke-width="3" /><path d="M146 40 Q146 20 163 20 Q180 20 180 40 V52 H146Z" fill="#FF8CC6" ${o(5)}/><circle cx="174" cy="24" r="7" fill="#1E2558"/><path d="M154 60 v12 M162 60 v8" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" opacity=".8"/><path d="M178 82 q2 8 0 10" stroke="#7FE0D0" stroke-width="4" stroke-linecap="round" fill="none"/></g>`;
  if (id === 'net')
    return `<g transform="translate(40 40)"><path d="M126 106 L138 -4" ${o(7)}/><path d="M126 106 L138 -4" stroke="#E8B070" stroke-width="3" stroke-linecap="round"/><path d="M114 -14 Q112 24 140 30 Q160 26 162 -10" fill="#FFFFFF" fill-opacity=".55" ${o(4)}/><path d="M124 -6 Q126 18 138 26 M138 -10 Q140 14 140 28 M150 -8 Q152 12 148 26 M116 4 Q138 10 160 4 M118 16 Q138 22 156 16" stroke="${L}" stroke-width="2" fill="none" opacity=".55"/><ellipse cx="138" cy="-12" rx="25" ry="9" fill="none" ${o(5)}/><ellipse cx="138" cy="-12" rx="25" ry="9" fill="none" stroke="#5FD8FF" stroke-width="2.5"/></g>`;
  return '';
}
