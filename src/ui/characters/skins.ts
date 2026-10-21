// 스킨 그림 — 시안 캐릭터 스타일(선 #10142E, 둥근 외곽선, viewBox 0 0 200 220)로 새로 그림.
// 솔이 스킨은 soli.ts의 soliSkinSvg, 이장 소품은 ijang.ts의 IjangProps.

import { L, o } from './svg';

/** 마을 건물 스킨: 마을 앞마당 왼쪽에 놓인다 */
export function buildingSvg(id: string): string {
  if (id === 'scarecrow')
    return (
      `<ellipse cx="100" cy="210" rx="46" ry="7" fill="#000" opacity=".25"/>` +
      // 기둥과 팔
      `<path d="M100 208 V96" ${o(12)}/><path d="M100 208 V96" stroke="#B9825A" stroke-width="6" stroke-linecap="round"/>` +
      `<path d="M30 118 H170" ${o(12)}/><path d="M30 118 H170" stroke="#B9825A" stroke-width="6" stroke-linecap="round"/>` +
      // 옷 (덧댄 천)
      `<path d="M60 106 H140 L148 170 Q100 182 52 170Z" fill="#5FD8FF" ${o(5)}/>` +
      `<rect x="70" y="128" width="20" height="18" rx="3" fill="#FFE14D" ${o(3)}/><path d="M74 132 l12 10 M86 132 l-12 10" stroke="${L}" stroke-width="2" stroke-linecap="round"/>` +
      `<path d="M120 150 h16" stroke="${L}" stroke-width="3" stroke-linecap="round" stroke-dasharray="3 4"/>` +
      // 지푸라기 손
      `<path d="M28 112 l-14 -6 M28 118 h-16 M28 124 l-14 6 M172 112 l14 -6 M172 118 h16 M172 124 l14 6" stroke="#E0B84A" stroke-width="4" stroke-linecap="round"/>` +
      // 자루 얼굴
      `<circle cx="100" cy="74" r="32" fill="#F2D6A2" ${o(5)}/>` +
      `<path d="M86 70 l8 8 M94 70 l-8 8 M106 70 l8 8 M114 70 l-8 8" stroke="${L}" stroke-width="3.5" stroke-linecap="round"/>` +
      `<path d="M88 88 Q100 94 112 88" stroke="${L}" stroke-width="3.5" stroke-linecap="round" fill="none" stroke-dasharray="2 4"/>` +
      // 밀짚모자
      `<ellipse cx="100" cy="48" rx="50" ry="10" fill="#F7D98A" ${o(4.5)}/><path d="M74 48 Q72 18 100 16 Q128 18 126 48Z" fill="#F2CD6B" ${o(4.5)}/><path d="M73.6 40 Q100 46 126.4 40 L126 48 Q100 54 74 48Z" fill="#FF4FA0" ${o(3.5)}/>`
    );
  if (id === 'mailbox')
    return (
      `<ellipse cx="100" cy="210" rx="40" ry="7" fill="#000" opacity=".25"/>` +
      `<path d="M100 208 V140" ${o(14)}/><path d="M100 208 V140" stroke="#B9825A" stroke-width="7" stroke-linecap="round"/>` +
      // 빨간 통 (둥근 지붕)
      `<path d="M52 140 V92 Q52 56 100 56 Q148 56 148 92 V140Z" fill="#FF4A5E" ${o(6)}/>` +
      `<path d="M62 92 Q62 66 100 66" stroke="#FFFFFF" stroke-width="5" stroke-linecap="round" fill="none" opacity=".45"/>` +
      // 투입구 · 글씨판
      `<rect x="74" y="88" width="52" height="9" rx="4.5" fill="${L}"/>` +
      `<rect x="80" y="108" width="40" height="20" rx="5" fill="#FFF6D6" ${o(3)}/><path d="M88 118 h24" stroke="#FF4A5E" stroke-width="3" stroke-linecap="round"/>` +
      // 깃발
      `<path d="M148 100 H164 V70" ${o(5)} fill="none"/><path d="M164 70 L186 78 L164 86Z" fill="#FFE14D" ${o(3.5)}/>`
    );
  if (id === 'jars') {
    const jar = (cx: number, base: number, w: number, h: number, c: string) =>
      `<path d="M${cx - w * 0.32} ${base - h} Q${cx - w * 0.62} ${base - h * 0.62} ${cx - w * 0.5} ${base - h * 0.2} Q${cx - w * 0.42} ${base} ${cx} ${base} Q${cx + w * 0.42} ${base} ${cx + w * 0.5} ${base - h * 0.2} Q${cx + w * 0.62} ${base - h * 0.62} ${cx + w * 0.32} ${base - h}Z" fill="${c}" ${o(5)}/>` +
      `<path d="M${cx - w * 0.42} ${base - h * 0.55} Q${cx} ${base - h * 0.47} ${cx + w * 0.42} ${base - h * 0.55}" stroke="#4A2A1E" stroke-width="3" fill="none" opacity=".5"/>` +
      `<ellipse cx="${cx}" cy="${base - h}" rx="${w * 0.36}" ry="${w * 0.1}" fill="#5A3A2A" ${o(4)}/>` +
      `<ellipse cx="${cx}" cy="${base - h - w * 0.06}" rx="${w * 0.28}" ry="${w * 0.08}" fill="#8A5A3E" ${o(3.5)}/>`;
    return (
      `<ellipse cx="100" cy="210" rx="86" ry="8" fill="#000" opacity=".25"/>` +
      // 돌 받침
      `<path d="M14 206 Q14 186 34 186 H166 Q186 186 186 206Z" fill="#B8BCD8" ${o(5)}/><path d="M50 196 h18 M92 200 h22 M138 194 h16" stroke="#8F96CC" stroke-width="3" stroke-linecap="round"/>` +
      jar(56, 188, 62, 70, '#8E5A34') +
      jar(146, 188, 54, 58, '#7A4A2A') +
      jar(102, 190, 74, 92, '#9A6238')
    );
  }
  return '';
}
