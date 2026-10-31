// 구구 할매 (쉼터 NPC, 디자인 "5 쉼터 v2" 1a · "쉼터 NPC" 시안): 통통한 비둘기 할매. 모닥불가에 앉아 불 세기대로 얼었다 녹았다 한다.
// 선 #10142E · 굵은 외곽선 · 평면 채색 (이장과 같은 결). 그림 좌표는 viewBox 20 -10 190 230.
// 불 세기 3가지: 꺼짐(파랗게 떨며 땀) / 보통 / 뜨끈(볼이 빨개지고 김이 오른다).
// react-native-svg는 SMIL을 못 그려서 움직이는 것(김 · 떨림)은 guguFx로 따로 그려 화면이 투명도로 깜빡인다.

import type { FireMood } from '../../domain/fire';
import { L, o } from './svg';

export type { FireMood };

/** 그림 상자 (장면 안 배치 크기와 맞춘 viewBox) */
export const GUGU_VIEWBOX = { x: 20, y: -10, w: 190, h: 230 } as const;

const PALETTE: Record<FireMood, { body: string; belly: string; line: string; foot: string }> = {
  off: { body: '#3D6DB8', belly: '#A9D0F5', line: '#4F80C4', foot: '#A9D0F5' },
  mid: { body: '#4E5590', belly: '#BFC4F0', line: '#6E74B0', foot: '#FF9E8E' },
  hot: { body: '#C24A6E', belly: '#F5BFCB', line: '#C55C7E', foot: '#FF6F5E' },
};

/** 눈: 뜬 눈(기본) / 웃는 눈(뜨끈할 때) */
function eye(x: number, y: number, r: number, happy: boolean, look: number): string {
  if (happy) return `<path d="M${x - r} ${y + 3} Q${x} ${y - r} ${x + r} ${y + 3}" stroke="${L}" stroke-width="5" stroke-linecap="round" fill="none"/>`;
  return (
    `<circle cx="${x}" cy="${y}" r="${r}" fill="#FFFFFF" ${o(4)}/>` +
    `<circle cx="${x + look}" cy="${y + 1}" r="${r * 0.62}" fill="${L}"/>` +
    `<circle cx="${x + look - r * 0.22}" cy="${y - r * 0.2}" r="${r * 0.2}" fill="#FFFFFF"/>`
  );
}

/** 몸통 · 발 · 날개 (고개 아래). 몸 전체가 움직일 때 같이 움직이고 고개는 따로 끄덕인다 */
export function guguBaseInner(mood: FireMood): string {
  const P = PALETTE[mood];
  return (
    `<ellipse cx="112" cy="206" rx="70" ry="8" fill="#000" opacity=".18"/>` +
    `<path d="M78 200 l-6 8 M78 200 l2 9 M78 200 l8 6 M140 200 l-6 8 M140 200 l2 9 M140 200 l8 6" stroke="${P.foot}" stroke-width="5" stroke-linecap="round"/>` +
    `<path d="M176 150 l20 -14 M178 158 l24 -4 M176 166 l20 8" stroke="${L}" stroke-width="4" stroke-linecap="round"/>` +
    `<path d="M40 168 C38 128 74 116 112 118 C156 120 186 134 184 170 C182 200 150 204 112 204 C70 204 42 198 40 168Z" fill="${P.belly}" ${o(6)}/>` +
    `<path d="M138 166 q10 -10 22 -4 M144 178 q10 -10 22 -4" stroke="${P.line}" stroke-width="7" stroke-linecap="round" fill="none"/>`
  );
}

/** 고개 쪽: 목 · 목도리 · 더듬이 · 눈 · 부리 · 표정 꾸밈 (회전 중심 = HEAD_PIVOT) */
export function guguHeadInner(mood: FireMood): string {
  const P = PALETTE[mood];
  const happy = mood === 'hot';
  const extra =
    mood === 'hot'
      ? `<ellipse cx="60" cy="60" rx="9" ry="5.5" fill="#FF3B4E" opacity=".75"/><ellipse cx="108" cy="60" rx="9" ry="5.5" fill="#FF3B4E" opacity=".75"/>`
      : mood === 'off'
        ? `<path d="M84 74 q-4 7 0 11 q4 -4 0 -11z" fill="#BDEBFF" ${o(2.5)}/>` +
          `<path d="M30 150 l-10 -3 M28 166 l-10 1 M28 180 l-9 5 M194 150 l10 -3 M196 166 l10 1 M194 180 l9 5" stroke="#BDEBFF" stroke-width="4" stroke-linecap="round"/>` +
          `<path d="M54 68 q6 -3 0 -6 M114 68 q-6 -3 0 -6" stroke="#BDEBFF" stroke-width="3.5" stroke-linecap="round" fill="none"/>`
        : '';
  return (
    `<path d="M58 150 L52 46 C50 22 70 12 84 12 C100 12 112 24 110 46 L112 146 Z" fill="${P.body}" ${o(6)}/>` +
    `<path d="M56 140 q7 10 14 0 q7 10 14 0 q7 10 14 0 q7 10 14 0" fill="none" stroke="${L}" stroke-width="4" stroke-linecap="round"/>` +
    `<path d="M54 112 Q84 126 112 112 L112 128 Q84 142 54 128Z" fill="#FF4FA0" ${o(4)}/><path d="M100 124 l10 26 l12 -6 l-8 -22Z" fill="#FF4FA0" ${o(4)}/>` +
    `<path d="M78 12 l-4 -10 M86 12 l4 -11" stroke="${L}" stroke-width="3.5" stroke-linecap="round"/>` +
    eye(68, 44, 11, happy, 2) +
    eye(98, 44, 11, happy, 2) +
    `<ellipse cx="84" cy="64" rx="6" ry="8" fill="${P.foot}" ${o(3.5)}/>` +
    extra
  );
}

/** 눈꺼풀 (눈 깜빡임): 뜬 눈일 때만. 웃는 눈(뜨끈)은 깜빡이지 않는다. 몸 색 타원이 눈을 덮는다 */
export function guguLidsInner(mood: FireMood): string | null {
  if (mood === 'hot') return null;
  const lid = (x: number) => `<ellipse cx="${x}" cy="44" rx="12.5" ry="12.5" fill="${PALETTE[mood].body}" stroke="${L}" stroke-width="3"/>`;
  return lid(68) + lid(98);
}

/** 고개가 끄덕이는 중심 (viewBox 좌표) · 몸이 흔들리는 중심 */
export const GUGU_HEAD_PIVOT = { x: 84, y: 140 } as const;
export const GUGU_BODY_PIVOT = { x: 112, y: 206 } as const;

/** 움직이지 않는 그림 한 장 (좌표계: viewBox 20 -10 190 230) — 몸통 + 고개 */
export function guguInner(mood: FireMood): string {
  return guguBaseInner(mood) + guguHeadInner(mood);
}

/** 깜빡이는 것: 뜨끈할 때 머리에서 오르는 김 세 줄. 없으면 null */
export function guguFxInner(mood: FireMood): string | null {
  if (mood !== 'hot') return null;
  return [66, 84, 102].map((x) => `<path d="M${x} 4 q-7 -9 0 -18 q7 -9 0 -18" stroke="#FFFFFF" stroke-width="5" stroke-linecap="round" fill="none" opacity=".85"/>`).join('');
}

/** 구구 할매만 단독으로 (viewBox 20 -10 190 230) */
export function guguSvg(mood: FireMood): string {
  const v = GUGU_VIEWBOX;
  return `<svg viewBox="${v.x} ${v.y} ${v.w} ${v.h}" xmlns="http://www.w3.org/2000/svg">${guguInner(mood)}${guguFxInner(mood) ?? ''}</svg>`;
}
