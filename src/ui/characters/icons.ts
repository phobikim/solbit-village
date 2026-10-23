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
          : `<path d="M12 2.5C15.2 6.4 18 9 18 13.6A6 6 0 0 1 6 13.6C6 11 7.4 9.3 8.8 7.6 9.3 9.4 10.2 10 10.8 10 11.4 7.6 10.8 5 12 2.5z"/><path d="M12 20.6a3.2 3.2 0 0 1-3.2-3.2c0-1.7 1.5-2.6 3.2-4.4 1.7 1.8 3.2 2.7 3.2 4.4a3.2 3.2 0 0 1-3.2 3.2z" fill="${bg}"/>`;
  return `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="${col}">${b}</svg>`;
}

export type TabIcon = 'village' | 'records' | 'neighbors' | 'rest' | 'me';

/** 하단 탭 아이콘 (선 아이콘) */
export function tabIconSvg(k: TabIcon, col: string, strokeWidth = 2.4): string {
  const b =
    k === 'village'
      ? `<path d="M4 11l8-6 8 6v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z"/><path d="M10 20v-5h4v5"/>`
      : k === 'records'
        ? `<rect x="5" y="3.5" width="14" height="17" rx="2.5"/><path d="M9 3.5v17M12.5 8.5h3M12.5 12h3"/>`
        : k === 'neighbors'
          ? `<circle cx="9" cy="8" r="3"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0"/><circle cx="17" cy="9" r="2.4"/><path d="M15.5 13.6A4.5 4.5 0 0 1 21 18"/>`
          : k === 'rest'
            ? `<path d="M2.5 10.5Q8 9.5 12 4q4 5.5 9.5 6.5"/><path d="M5 10.5h14M7 10.5V20M17 10.5V20M4.5 20h15"/>`
            : `<circle cx="12" cy="9" r="3.5"/><path d="M5.5 20a6.5 6.5 0 0 1 13 0"/>`;
  return `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="${col}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round">${b}</svg>`;
}

export type MenuIcon = 'storage' | 'locked' | 'settings';

/** 나 탭 메뉴 아이콘 (7d) */
export function menuIconSvg(k: MenuIcon, col: string): string {
  switch (k) {
    case 'storage':
      return `<svg viewBox="0 0 26 26" xmlns="http://www.w3.org/2000/svg"><circle cx="8" cy="10" r="3.4" fill="#FF8A5C" stroke="${L}" stroke-width="1.6"/><circle cx="13" cy="9" r="3.4" fill="#FFFFFF" stroke="${L}" stroke-width="1.6"/><circle cx="18" cy="10" r="3.4" fill="#A8EB5A" stroke="${L}" stroke-width="1.6"/><rect x="3" y="11" width="20" height="12" rx="3" fill="#E8B070" stroke="${L}" stroke-width="2"/><path d="M6 17h14" stroke="#B57A3E" stroke-width="1.8"/></svg>`;
    case 'locked':
      return `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="${col}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="10" rx="3" fill="${col}"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>`;
    case 'settings':
      return `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="${col}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 2.8v2.6M12 18.6v2.6M2.8 12h2.6M18.6 12h2.6M5.5 5.5l1.8 1.8M16.7 16.7l1.8 1.8M5.5 18.5l1.8-1.8M16.7 7.3l1.8-1.8"/></svg>`;
  }
}

/** 방송 확성기 */
export function megaphoneSvg(col: string): string {
  return `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="${col}"><path d="M3 9h3l10-6v18L6 15H3z"/></svg>`;
}
