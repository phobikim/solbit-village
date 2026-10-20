// 이웃 캐릭터 — design/solbit-v5.dc.html의 npcIn(마을·목록용)과 faceIn(등록용 얼굴 12종) 이식.
// viewBox 0 0 200 220.

import { L, o } from './svg';

// ── npcIn: 몸 색 + 머리 모양 ────────────────────────────────────────────

export type NpcHair = 'bob' | 'cap' | 'perm' | 'part' | 'beanie' | 'bun';

export function npcSvg(col: string, kind: NpcHair, sad = false): string {
  const before = kind === 'bun' ? `<circle cx="100" cy="56" r="22" fill="#3A2A2A" ${o(5)}/>` : '';
  const hair =
    kind === 'bob'
      ? `<path d="M30 124 Q26 58 100 56 Q174 58 170 124 Q152 94 100 94 Q48 94 30 124Z" fill="#4A2F3A" ${o(5)}/>`
      : kind === 'cap'
        ? `<path d="M40 102 Q44 58 100 56 Q156 58 160 102Z" fill="#A8EB5A" ${o(5)}/><path d="M152 98 Q188 96 194 106 Q172 112 152 106Z" fill="#A8EB5A" ${o(5)}/>`
        : kind === 'perm'
          ? [44, 64, 86, 114, 136, 156]
              .map((x, i) => `<circle cx="${x}" cy="${[96, 74, 62, 62, 74, 96][i]}" r="17" fill="#D9DCEB" ${o(4.5)}/>`)
              .join('')
          : kind === 'part'
            ? `<path d="M32 118 Q30 56 100 56 Q170 56 168 118 Q150 86 104 84 L100 96 L94 84 Q50 88 32 118Z" fill="#2A2238" ${o(5)}/>`
            : kind === 'beanie'
              ? `<path d="M40 104 Q42 52 100 52 Q158 52 160 104Z" fill="#5FD8FF" ${o(5)}/><rect x="36" y="96" width="128" height="18" rx="9" fill="#5FD8FF" ${o(5)}/><circle cx="100" cy="46" r="11" fill="#FFFFFF" ${o(4)}/>`
              : '';
  const eyes = sad
    ? `<path d="M68 134 Q76 128 84 134 M116 134 Q124 128 132 134" stroke="${L}" stroke-width="6" stroke-linecap="round" fill="none"/>`
    : `<circle cx="76" cy="132" r="7" fill="${L}"/><circle cx="124" cy="132" r="7" fill="${L}"/>`;
  const mouth = sad
    ? `<path d="M90 160 Q100 152 110 160" stroke="${L}" stroke-width="5" stroke-linecap="round" fill="none"/>`
    : `<path d="M88 152 Q100 164 112 152" stroke="${L}" stroke-width="5" stroke-linecap="round" fill="none"/>`;
  return (
    `${before}<ellipse cx="100" cy="130" rx="70" ry="66" fill="${col}" ${o(6)}/>${hair}` +
    `<circle cx="56" cy="152" r="9" fill="#FF8E8E" opacity=".8"/><circle cx="144" cy="152" r="9" fill="#FF8E8E" opacity=".8"/>` +
    `${eyes}${mouth}` +
    `<ellipse cx="70" cy="184" rx="15" ry="12" fill="${col}" ${o(5)}/><ellipse cx="130" cy="184" rx="15" ry="12" fill="${col}" ${o(5)}/>`
  );
}

// ── faceIn: 이웃 등록(9f) 얼굴 12종 ─────────────────────────────────────

export type FaceSpec = {
  hair: 'short' | 'long' | 'curly' | 'bun' | 'bald' | 'beanie' | 'straw' | 'cap' | 'pig' | 'perm' | 'grandpa';
  hc?: string;
  skin?: string;
  beard?: boolean;
  mus?: boolean;
  glasses?: boolean;
  kid?: boolean;
};

/** neighbor.face (0-11) */
export const FACES: readonly FaceSpec[] = [
  { hair: 'short' },
  { hair: 'long', hc: '#5A3A2A' },
  { hair: 'curly', hc: '#7A4A2A' },
  { hair: 'bun', hc: '#2A2238' },
  { hair: 'bald', beard: true, hc: '#4A3A30', skin: '#F6D3AE' },
  { hair: 'beanie' },
  { hair: 'straw', skin: '#F6D3AE' },
  { hair: 'cap' },
  { hair: 'short', hc: '#2A2238', glasses: true },
  { hair: 'pig', hc: '#5A3A2A', kid: true },
  { hair: 'perm', glasses: true },
  { hair: 'grandpa', glasses: true, mus: true, skin: '#F6D3AE' },
];

/** neighbor.color (0-5) 배경색 */
export const NEIGHBOR_COLORS: readonly string[] = ['#FF8CC6', '#FFE14D', '#A8EB5A', '#5FD8FF', '#C49BFF', '#FF9A3C'];

export function faceSvg(f: FaceSpec): string {
  const sk = f.skin || '#FFE6C8';
  const hc = f.hc || '#3A2A2A';
  const H = f.hair;
  let pre = '';
  let top = '';
  if (H === 'long')
    pre += `<path d="M30 120 Q24 56 100 54 Q176 56 170 120 L174 192 Q158 202 142 192 L146 128 H54 L58 192 Q42 202 26 192Z" fill="${hc}" ${o(5)}/>`;
  if (H === 'bun') pre += `<circle cx="100" cy="50" r="22" fill="${hc}" ${o(5)}/>`;
  if (H === 'pig')
    pre += `<circle cx="28" cy="104" r="20" fill="${hc}" ${o(5)}/><circle cx="172" cy="104" r="20" fill="${hc}" ${o(5)}/><circle cx="44" cy="96" r="6" fill="#FF4FA0" ${o(3)}/><circle cx="156" cy="96" r="6" fill="#FF4FA0" ${o(3)}/>`;
  const fringe = `<path d="M34 118 Q30 58 100 58 Q170 58 166 118 Q150 90 100 94 Q50 90 34 118Z" fill="${hc}" ${o(5)}/>`;
  const curls = (col: string, r: number) =>
    [
      [44, 102],
      [56, 78],
      [78, 64],
      [100, 60],
      [122, 64],
      [144, 78],
      [156, 102],
    ]
      .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${col}" ${o(4.5)}/>`)
      .join('');
  const shine = `<path d="M74 80 Q88 72 104 74" stroke="#FFFFFF" stroke-width="5" stroke-linecap="round" fill="none" opacity=".75"/>`;
  if (H === 'short')
    top = `<path d="M32 122 Q28 58 100 56 Q172 58 168 122 Q158 90 128 86 Q104 100 74 86 Q42 92 32 122Z" fill="${hc}" ${o(5)}/>`;
  else if (H === 'long' || H === 'bun' || H === 'pig') top = fringe;
  else if (H === 'curly') top = curls(hc, 18);
  else if (H === 'perm') top = curls('#D9DCEB', 17);
  else if (H === 'bald') top = shine;
  else if (H === 'grandpa')
    top = `<path d="M31 134 Q26 100 46 90 Q52 110 47 132Z M169 134 Q174 100 154 90 Q148 110 153 132Z" fill="#E4E6F0" ${o(4)}/>` + shine;
  else if (H === 'beanie')
    top = `<path d="M40 104 Q42 52 100 52 Q158 52 160 104Z" fill="#5FD8FF" ${o(5)}/><rect x="36" y="96" width="128" height="18" rx="9" fill="#5FD8FF" ${o(5)}/><circle cx="100" cy="46" r="11" fill="#FFFFFF" ${o(4)}/>`;
  else if (H === 'cap')
    top = `<path d="M40 102 Q44 58 100 56 Q156 58 160 102Z" fill="#FF8A5C" ${o(5)}/><path d="M152 98 Q188 96 194 106 Q172 112 152 106Z" fill="#FF8A5C" ${o(5)}/>`;
  else if (H === 'straw')
    top = `<ellipse cx="100" cy="94" rx="86" ry="15" fill="#F7D98A" ${o(5)}/><path d="M60 94 Q58 48 100 46 Q142 48 140 94Z" fill="#F2CD6B" ${o(5)}/><path d="M59.5 82 Q100 90 140.5 82 L140 94 Q100 102 60 94Z" fill="#A8EB5A" ${o(4)}/>`;
  const er = f.kid ? 9 : 7;
  let face =
    `<circle cx="56" cy="152" r="9" fill="#FF8E8E" opacity=".8"/><circle cx="144" cy="152" r="9" fill="#FF8E8E" opacity=".8"/>` +
    `<circle cx="76" cy="132" r="${er}" fill="${L}"/><circle cx="124" cy="132" r="${er}" fill="${L}"/>` +
    (f.kid ? `<circle cx="79" cy="129" r="3" fill="#FFFFFF"/><circle cx="127" cy="129" r="3" fill="#FFFFFF"/>` : '');
  if (f.glasses)
    face += `<circle cx="76" cy="132" r="17" fill="#FFFFFF" fill-opacity=".25" stroke="${L}" stroke-width="4.5"/><circle cx="124" cy="132" r="17" fill="#FFFFFF" fill-opacity=".25" stroke="${L}" stroke-width="4.5"/><path d="M93 130 Q100 125 107 130" stroke="${L}" stroke-width="4" fill="none"/>`;
  if (f.beard)
    face += `<path d="M44 146 Q52 198 100 200 Q148 198 156 146 Q140 170 120 163 Q100 172 80 163 Q60 170 44 146Z" fill="${hc}" ${o(5)}/><path d="M90 170 Q100 176 110 170" stroke="${sk}" stroke-width="4.5" stroke-linecap="round" fill="none"/>`;
  else if (f.mus)
    face += `<path d="M80 154 Q90 144 100 151 Q110 144 120 154 Q110 160 100 155 Q90 160 80 154Z" fill="#E4E6F0" ${o(3)}/><path d="M92 167 Q100 172 108 167" stroke="${L}" stroke-width="4.5" stroke-linecap="round" fill="none"/>`;
  else face += `<path d="M88 154 Q100 166 112 154" stroke="${L}" stroke-width="5" stroke-linecap="round" fill="none"/>`;
  return (
    `${pre}<ellipse cx="100" cy="130" rx="70" ry="66" fill="${sk}" ${o(6)}/>${face}` +
    `<ellipse cx="70" cy="186" rx="15" ry="12" fill="${sk}" ${o(5)}/><ellipse cx="130" cy="186" rx="15" ry="12" fill="${sk}" ${o(5)}/>${top}`
  );
}
