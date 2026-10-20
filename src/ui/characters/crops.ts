// 작물 그림 — design/solbit-v5.dc.html의 cropIn(48x48 아이콘)과
// village3()의 밭 속 작물(straw / potato / coffee) 이식. 새싹·자라는 중 단계는 시안 스타일에 맞춰 추가.

import type { CropKind, CropStage } from '../../domain/types';
import { L, o, place48, star } from './svg';

/** cropIn의 o(w): 기본 외곽선과 같다 */
const ow = (w: number) => o(w);

/** 48x48 작물 아이콘 (창고·결과 화면용) */
export function cropIconInner(k: CropKind): string {
  if (k === 'sunflower')
    return (
      `<path d="M24 30 V45" stroke="${L}" stroke-width="5" stroke-linecap="round"/><path d="M24 30 V45" stroke="#5FB04A" stroke-width="2" stroke-linecap="round"/><path d="M24 40 q-8 -1 -10 -8 q8 0 10 8z" fill="#7FD24A" ${ow(2)}/>` +
      [...Array(10)]
        .map((_, i) => {
          const a = (i * Math.PI) / 5;
          return `<circle cx="${(24 + Math.cos(a) * 11).toFixed(1)}" cy="${(19 + Math.sin(a) * 11).toFixed(1)}" r="5" fill="#FFE14D" ${ow(2)}/>`;
        })
        .join('') +
      `<circle cx="24" cy="19" r="8" fill="#7A4A2A" ${ow(2.4)}/><circle cx="21" cy="17" r="1.2" fill="#C98E5E"/><circle cx="26" cy="21" r="1.2" fill="#C98E5E"/>`
    );
  if (k === 'strawberry')
    return (
      `<path d="M10 18 Q24 10 38 18 Q39 33 24 43 Q9 33 10 18Z" fill="#FF4A5E" ${ow(2.5)}/>` +
      [
        [17, 23],
        [24, 21],
        [31, 23],
        [20, 30],
        [28, 30],
        [24, 37],
      ]
        .map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="1.2" ry="1.7" fill="#FFE14D"/>`)
        .join('') +
      `<path d="M13 16 L18 8 L24 13 L30 8 L35 16 Q24 21 13 16Z" fill="#7FD24A" ${ow(2.2)}/>`
    );
  if (k === 'coffee')
    return `<g transform="rotate(-20 17 27)"><ellipse cx="17" cy="27" rx="9" ry="12" fill="#7A4A2A" ${ow(2.5)}/><path d="M17 16 Q13 27 17 38" stroke="#C98E5E" stroke-width="2.2" fill="none" stroke-linecap="round"/></g><g transform="rotate(18 32 22)"><ellipse cx="32" cy="22" rx="8" ry="11" fill="#8E5A34" ${ow(2.5)}/><path d="M32 12 Q28 22 32 32" stroke="#C98E5E" stroke-width="2.2" fill="none" stroke-linecap="round"/></g>`;
  if (k === 'mushroom')
    return `<path d="M17 25 H31 L30 41 Q24 44 18 41Z" fill="#FFF6D6" ${ow(2.5)}/><path d="M5 27 Q6 7 24 7 Q42 7 43 27 Q24 31 5 27Z" fill="#FF6B5A" ${ow(2.5)}/><circle cx="16" cy="17" r="3" fill="#FFFFFF"/><circle cx="29" cy="13" r="2.4" fill="#FFFFFF"/><circle cx="34" cy="21" r="2" fill="#FFFFFF"/>`;
  return `<path d="M9 27 Q7 14 22 12 Q38 10 40 24 Q42 38 26 40 Q11 40 9 27Z" fill="#D9A866" ${ow(2.5)}/><ellipse cx="18" cy="22" rx="1.8" ry="1.2" fill="#A8743A"/><ellipse cx="29" cy="19" rx="1.6" ry="1.1" fill="#A8743A"/><ellipse cx="26" cy="31" rx="1.8" ry="1.2" fill="#A8743A"/><path d="M14 30 q4 3 8 2" stroke="#F0CC8E" stroke-width="2" stroke-linecap="round" fill="none"/>`;
}

export function cropIconSvg(k: CropKind): string {
  return `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">${cropIconInner(k)}</svg>`;
}

// ── 밭 속 작물 (village 씬 좌표계, 밭 흙 윗면 y≈190) ───────────────────

const berry = (x: number, y: number) =>
  `<path d="M${x - 3.6} ${y - 2} Q${x} ${y - 5} ${x + 3.6} ${y - 2} Q${x + 3} ${y + 4} ${x} ${y + 5} Q${x - 3} ${y + 4} ${x - 3.6} ${y - 2}Z" fill="#FF4A5E" ${o(1.6)}/><circle cx="${x - 1}" cy="${y}" r=".8" fill="#FFE14D"/><circle cx="${x + 1.2}" cy="${y + 2}" r=".8" fill="#FFE14D"/>`;

const ripe: Record<CropKind, (cx: number) => string> = {
  strawberry: (cx) =>
    `<path d="M${cx} 190 q-9 -2 -10 -12 q9 0 10 12z M${cx} 190 q9 -2 10 -12 q-9 0 -10 12z" fill="#7FD24A" ${o(1.8)}/>` +
    berry(cx - 5, 185) +
    berry(cx + 5, 186) +
    berry(cx, 178) +
    star(cx + 9, 170, 4.5) +
    star(cx - 9, 173, 2.6),
  potato: (cx) =>
    `<ellipse cx="${cx - 5}" cy="199" rx="4.2" ry="3" fill="#D9A866" ${o(1.6)}/><path d="M${cx} 191 V182" stroke="${L}" stroke-width="3.5" stroke-linecap="round"/><circle cx="${cx - 5}" cy="183" r="5" fill="#4FA83A" ${o(1.8)}/><circle cx="${cx + 5}" cy="184" r="4.6" fill="#5FBF3A" ${o(1.8)}/><circle cx="${cx}" cy="177" r="5.4" fill="#5FBF3A" ${o(1.8)}/>`,
  coffee: (cx) =>
    `<ellipse cx="${cx}" cy="191" rx="4.4" ry="3.2" fill="#7A4A2A" ${o(1.6)}/><path d="M${cx} 188.6 V193.4" stroke="${L}" stroke-width="1.2"/><path d="M${cx} 188 V181" stroke="${L}" stroke-width="3.5" stroke-linecap="round"/><path d="M${cx} 188 V181" stroke="#5FB04A" stroke-width="1.6" stroke-linecap="round"/><path d="M${cx} 182 q-6 -1 -7 -7 q6 0 7 7z M${cx} 182 q6 -1 7 -7 q-6 0 -7 7z" fill="#B6F35C" ${o(1.6)}/>`,
  // 아이콘 줄기 끝(y=45)이 흙 윗면에 닿도록 배치
  sunflower: (cx) => place48(cropIconInner('sunflower'), cx - 12, 168.5, 24),
  mushroom: (cx) => place48(cropIconInner('mushroom'), cx - 10, 173.5, 20),
};

/** 1일차 새싹 */
const sprout = (cx: number) =>
  `<path d="M${cx} 191 V186" stroke="${L}" stroke-width="3" stroke-linecap="round"/><path d="M${cx} 191 V186" stroke="#5FB04A" stroke-width="1.4" stroke-linecap="round"/><path d="M${cx} 187 q-5 -1 -6 -5 q5 0 6 5z M${cx} 187 q5 -1 6 -5 q-5 0 -6 5z" fill="#B6F35C" ${o(1.4)}/>`;

/** 2일차 자라는 중 */
const growing = (cx: number) =>
  `<path d="M${cx} 191 V180" stroke="${L}" stroke-width="3.5" stroke-linecap="round"/><path d="M${cx} 191 V180" stroke="#5FB04A" stroke-width="1.6" stroke-linecap="round"/><path d="M${cx} 188 q-8 -1 -9 -8 q8 0 9 8z M${cx} 182 q7 -1 8 -8 q-7 0 -8 8z" fill="#7FD24A" ${o(1.6)}/><path d="M${cx} 181 q-5 -1 -6 -6 q5 0 6 6z" fill="#B6F35C" ${o(1.4)}/>`;

/** 밭 한 칸의 작물 (cx: 칸 중심 x) */
export function plotCrop(crop: CropKind, stage: CropStage, cx: number): string {
  if (stage === 1) return sprout(cx);
  if (stage === 2) return growing(cx);
  return ripe[crop](cx);
}
