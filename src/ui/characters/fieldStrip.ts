// 밭 띠 한 칸 (장면 밖, 디자인 SPEC 11장): 흙 + 작물 성장 그림. 상태 글자는 화면에서 따로 쓴다.
// 작물 그림은 마을 장면에 있던 밭 칸 그림(plotCrop)을 그대로 쓴다.

import type { PlotSlot, TimeOfDay } from '../../domain/types';
import { plotCrop } from './crops';
import { o } from './svg';

const SOIL = {
  night: { soil: '#5A3E5E', line: '#45304A', pebble: '#6A5470' },
  day: { soil: '#C98E5E', line: '#A9714A', pebble: '#B57A4E' },
} as const;

/** 칸 그림 좌표 (너비 60 x 높이 52) */
export const FIELD_CELL = { width: 60, height: 52 } as const;

export function fieldCellSvg(slot: PlotSlot, time: TimeOfDay): string {
  const c = SOIL[time];
  const { width: W, height: H } = FIELD_CELL;
  let s = `<rect x="2" y="2" width="${W - 4}" height="${H - 4}" rx="11" fill="${c.soil}" ${o(2.6)}/><path d="M12 ${H - 12} H${W - 12}" stroke="${c.line}" stroke-width="2.6" stroke-linecap="round"/>`;
  if (slot) {
    if (slot.stage === 3) s += `<circle cx="${W / 2}" cy="20" r="22" fill="#FFE14D" opacity=".28"/>`;
    // 작물 그림(밭 흙 윗면 y=190 기준)을 칸에 맞게 키운다
    s += `<g transform="translate(${W / 2} ${H - 14}) scale(1.55) translate(0 -190)">${plotCrop(slot.crop, slot.stage, 0)}</g>`;
  } else {
    s += `<path d="M14 20 H${W - 14} M18 30 H${W - 18}" stroke="${c.line}" stroke-width="2.6" stroke-linecap="round"/><ellipse cx="${W / 2 + 10}" cy="25" rx="2.6" ry="1.8" fill="${c.pebble}"/>`;
  }
  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">${s}</svg>`;
}

