// 행사 분류 아이콘 5종 — design/solbit-v5.dc.html의 catIn 이식 (디자인 11a). viewBox 0 0 48 48.
// 큰 버전(88px 등)은 흰 줄무늬까지, 작은 버전(24px 이하)은 덩어리만 그린다.

import type { EventType } from '../../domain/events';
import { EVENT_TYPE_COLOR } from '../../copy/labels.ko';
import { L } from './svg';

export function eventIconInner(k: EventType, small: boolean): string {
  const w = small ? 4 : 3;
  const C = EVENT_TYPE_COLOR[k];
  const W = '#FFFFFF';
  const o = `stroke="${L}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
  const o2 = `stroke="${L}" stroke-width="${(w * 0.8).toFixed(1)}" stroke-linejoin="round" stroke-linecap="round"`;
  const dl = (d: string, c = L, sw = 2.6) => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${sw}" stroke-linecap="round"/>`;

  if (k === 'travel')
    return (
      `<path d="M18 13V8.5Q18 5 21.5 5h5Q30 5 30 8.5V13" fill="none" ${o}/><circle cx="16" cy="43" r="3.4" fill="${L}"/><circle cx="32" cy="43" r="3.4" fill="${L}"/><rect x="9" y="12" width="30" height="29" rx="8" fill="${C}" ${o}/>` +
      (small ? dl('M24 19v15', L, 3.4) : dl('M19 19v15M29 19v15') + dl('M13.5 18v5', W))
    );
  if (k === 'birth')
    return (
      `<path d="M5 42H43" ${o}/><rect x="9" y="27" width="30" height="15" rx="5" fill="${C}" ${o}/><rect x="14" y="16" width="20" height="12" rx="4.5" fill="${C}" ${o}/>` +
      (small ? '' : dl('M15.5 21q2.6 3.6 5.2 0t5.2 0t5.2 0', W, 3) + dl('M10.5 32q2.8 3.6 5.6 0t5.6 0t5.6 0t5.6 0', W, 3)) +
      `<rect x="21.8" y="8" width="4.4" height="8.5" rx="1.6" fill="${W}" ${o2}/><path d="M24 1.6Q27.8 5.4 24 8Q20.2 5.4 24 1.6Z" fill="#FFE14D" ${o2}/>`
    );
  if (k === 'work')
    return (
      `<path d="M18 14V10.5Q18 7 21.5 7h5Q30 7 30 10.5V14" fill="none" ${o}/><rect x="5" y="14" width="38" height="26" rx="8" fill="${C}" ${o}/>` +
      (small ? '' : dl('M6 25.5Q24 30 42 25.5')) +
      `<rect x="20" y="23" width="8" height="7" rx="2.2" fill="${W}" ${o2}/>` +
      (small ? '' : dl('M10 19v4', W))
    );
  if (k === 'meet') {
    const cup = (x: number, hx: string, rot: number, cx: number) =>
      `<g transform="rotate(${rot} ${cx} 30)"><path d="${hx}" fill="none" ${o}/><path d="M${x} 19H${x + 19}V30Q${x + 19} 39 ${x + 9.5} 39Q${x} 39 ${x} 30Z" fill="${C}" ${o}/>${small ? '' : dl(`M${x + 3.5} 23.5H${x + 15.5}`, W, 2.8)}</g>`;
    return (
      cup(4, 'M4 24Q-1 24 -1 28Q-1 32 4 32', -12, 14) +
      cup(25, 'M44 24Q49 24 49 28Q49 32 44 32', 12, 34) +
      (small ? '' : dl('M24 5v5M17.5 7.5l2.5 3.5M30.5 7.5l-2.5 3.5'))
    );
  }
  // 기타: 압정
  return `<g transform="rotate(25 24 24)"><path d="M24 31V45" stroke="${L}" stroke-width="${w}" stroke-linecap="round"/><path d="M12 31Q12 24.5 19 23H29Q36 24.5 36 31Z" fill="${C}" ${o}/><rect x="19" y="12" width="10" height="11.5" fill="${C}" ${o}/><rect x="14" y="5" width="20" height="8" rx="4" fill="${C}" ${o}/>${small ? '' : dl('M18 9h5', W) + dl('M15.5 27.5q1-2 3-2.5', W)}</g>`;
}

export function eventIconSvg(k: EventType, small: boolean): string {
  return `<svg viewBox="-2 0 52 48" xmlns="http://www.w3.org/2000/svg">${eventIconInner(k, small)}</svg>`;
}
