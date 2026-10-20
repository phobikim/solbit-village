// 작은 아이콘 — design/solbit-v5.dc.html의 wIcon(날씨), banSvg(현수막) 이식 + 탭·지수 카드 아이콘.

import type { IndexKind, Weather } from '../../domain/types';
import { L } from './svg';

/** 날씨 아이콘 24x24 (달력·범례용) */
export function weatherIconSvg(k: Weather): string {
  const cl = 'M6 18h11a4 4 0 0 0 .5-8A5.5 5.5 0 0 0 7 11.2 3.4 3.4 0 0 0 6 18z';
  const sun = (x: number, y: number, r: number) =>
    `<circle cx="${x}" cy="${y}" r="${r}" fill="#FFE14D"/>` +
    [0, 1, 2, 3, 4, 5, 6, 7]
      .map((i) => {
        const a = (i * Math.PI) / 4;
        return `<path d="M${(x + Math.cos(a) * (r + 2)).toFixed(1)} ${(y + Math.sin(a) * (r + 2)).toFixed(1)} L${(x + Math.cos(a) * (r + 4)).toFixed(1)} ${(y + Math.sin(a) * (r + 4)).toFixed(1)}" stroke="#FFE14D" stroke-width="1.8" stroke-linecap="round"/>`;
      })
      .join('');
  const b =
    k === 'sun'
      ? sun(12, 12, 4.6)
      : k === 'cloud'
        ? sun(15, 8, 3.4) + `<path d="${cl}" fill="#E4E8FF" transform="translate(-1 1)"/>`
        : k === 'over'
          ? `<path d="${cl}" fill="#8F96CC"/>`
          : k === 'rain'
            ? `<path d="${cl}" fill="#8F96CC" transform="translate(0 -3)"/><path d="M8 18l-1.2 3M12 18l-1.2 3M16 18l-1.2 3" stroke="#5FD8FF" stroke-width="2" stroke-linecap="round"/>`
            : `<path d="${cl}" fill="#5A5F94" transform="translate(0 -3)"/><path d="M12.5 14 L9.5 18.5 H12 L10.5 23 L15 17.5 H12.5 L14 14Z" fill="#FFE14D"/>`;
  return `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">${b}</svg>`;
}

/** 현수막 아이콘 24x24 (장부·달력용) */
export function bannerIconSvg(col: string, pole = '#C9CEF5'): string {
  return `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M3.5 3v19M20.5 3v19" stroke="${pole}" stroke-width="2.6" stroke-linecap="round"/><path d="M3.5 6 Q12 7.5 20.5 6 V13 Q12 14.5 3.5 13Z" fill="${col}" stroke="${L}" stroke-width="2" stroke-linejoin="round"/><path d="M7 9.8 H17" stroke="${L}" stroke-width="1.6" stroke-linecap="round" opacity=".55"/></svg>`;
}

/** 지수 카드 가운데 아이콘 (24x24, fill = 영역 색) */
export function indexIconSvg(k: IndexKind, col: string, bg: string): string {
  const b =
    k === 'health'
      ? `<path d="M7 19h10a4 4 0 0 0 .6-8A6 6 0 0 0 6.2 12.6 3.3 3.3 0 0 0 7 19z"/>`
      : k === 'work'
        ? `<path d="M12 13C12 8 8.5 6 4 6c0 4.5 3.5 7 8 7z"/><path d="M12 11c0-3.6 3-6 7-6 0 3.6-3 6-7 6z"/><rect x="10.8" y="10" width="2.4" height="11" rx="1.2"/>`
        : k === 'relation'
          ? `<circle cx="9" cy="8" r="3.4"/><path d="M3 20a6 6 0 0 1 12 0z"/><circle cx="17" cy="9" r="2.6"/><path d="M15.6 13.4A4.6 4.6 0 0 1 21 20h-4.6a7 7 0 0 0-.8-6.6z"/>`
          : `<circle cx="12" cy="6.5" r="3.3"/><circle cx="17.2" cy="10.3" r="3.3"/><circle cx="15.2" cy="16.4" r="3.3"/><circle cx="8.8" cy="16.4" r="3.3"/><circle cx="6.8" cy="10.3" r="3.3"/><circle cx="12" cy="12" r="2.4" fill="${bg}"/>`;
  return `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="${col}">${b}</svg>`;
}

export type TabIcon = 'village' | 'records' | 'neighbors' | 'me';

/** 하단 탭 아이콘 (선 아이콘) */
export function tabIconSvg(k: TabIcon, col: string): string {
  const b =
    k === 'village'
      ? `<path d="M4 11l8-6 8 6v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z"/><path d="M10 20v-5h4v5"/>`
      : k === 'records'
        ? `<rect x="5" y="4" width="14" height="16" rx="4"/><path d="M9 9h6M9 13h4"/>`
        : k === 'neighbors'
          ? `<circle cx="9" cy="8" r="3"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0"/><circle cx="17" cy="9" r="2.4"/><path d="M15.5 13.6A4.5 4.5 0 0 1 21 18"/>`
          : `<circle cx="12" cy="9" r="3.5"/><path d="M5.5 20a6.5 6.5 0 0 1 13 0"/>`;
  return `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="${col}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${b}</svg>`;
}

/** 방송 확성기 */
export function megaphoneSvg(col: string): string {
  return `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="${col}"><path d="M3 9h3l10-6v18L6 15H3z"/></svg>`;
}
