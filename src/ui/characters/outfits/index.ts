// 솔이네 옷장 그림 모음: 아이템 id → SVG 문자열, 칸 썸네일 배치.
// 어떤 아이템이 있는지 · 어떤 순서로 겹치는지는 src/domain/outfit.ts 가 정한다.

import { BACK_ART } from './back';
import { BODY_ART } from './body';
import { FACE_ART } from './face';
import { FEET_ART } from './feet';
import { HAND_ART } from './hand';
import { HEAD_ART } from './head';
import type { OutfitArt } from './types';

export type { OutfitArt };

export const OUTFIT_ART: Readonly<Record<string, OutfitArt>> = {
  ...HEAD_ART,
  ...FACE_ART,
  ...BODY_ART,
  ...BACK_ART,
  ...HAND_ART,
  ...FEET_ART,
};

/** 아이템이 차지하는 영역 [x, y, 너비, 높이] — viewBox(0 -20 200 240) 좌표. 시안 26c~g의 값 */
const BBOX: Readonly<Record<string, readonly [number, number, number, number]>> = {
  'head-headphones': [12, 14, 176, 134],
  'head-straw': [10, 14, 180, 92],
  'head-beanie': [26, 14, 148, 102],
  'head-wizard': [24, -18, 152, 118],
  'head-catears': [26, 14, 148, 98],
  'face-glasses': [24, 110, 152, 42],
  'face-heart': [24, 106, 152, 46],
  'face-star': [128, 135, 36, 36],
  'body-scarf': [14, 140, 172, 86],
  'body-overall': [14, 140, 172, 70],
  'body-raincoat': [8, 108, 184, 102],
  'body-sweater': [8, 108, 184, 102],
  'body-hoodie': [8, 108, 184, 102],
  'body-plaid': [8, 108, 184, 102],
  'back-wings': [0, 76, 200, 74],
  'back-cape': [8, 124, 184, 100],
  'back-crossbag': [22, 84, 156, 114],
  'back-bundle': [4, 62, 192, 138],
  'hand-coffee': [146, 114, 48, 64],
  'hand-umbrella': [146, 118, 50, 100],
  'hand-balloon': [146, 4, 54, 160],
  'hand-book': [146, 130, 46, 54],
  'feet-boots': [66, 176, 68, 42],
  'feet-sneakers': [66, 190, 68, 28],
  'feet-slippers': [64, 190, 72, 28],
};

/** 캔버스 안에서 그림을 놓는 자리: left · top은 캔버스(200×240) 왼쪽 위 모서리의 위치, width는 캔버스를 그릴 너비 */
export type CanvasBox = { left: number; top: number; width: number; height: number };

const r1 = (n: number) => Math.round(n * 10) / 10;

/**
 * 칸 썸네일(size × size): 미니 솔이 + 아이템이 한 정사각형에 들어오게 하는 자리 (시안 26c~f).
 * 솔이 몸(높이 약 0.9 × size)과 아이템 영역이 모두 들어오도록 줄이고 가운데에 놓는다.
 */
export function dressedThumbBox(itemId: string, size: number): CanvasBox {
  const [bx, by, bw, bh] = BBOX[itemId] ?? [14, 14, 172, 196];
  const x0 = Math.min(14, bx);
  const y0 = Math.min(14, by);
  const x1 = Math.max(186, bx + bw);
  const y1 = Math.max(210, by + bh);
  const uw = x1 - x0;
  const uh = y1 - y0;
  const s = Math.min((size * 0.9) / 196, (size * 0.96) / uw, (size * 0.96) / uh);
  return {
    left: r1(-x0 * s + (size - uw * s) / 2),
    top: r1(-(y0 + 20) * s + (size - uh * s) / 2),
    width: r1(200 * s),
    height: r1(240 * s),
  };
}

/** 잠긴 칸의 실루엣: 아이템만 (솔이 없이) 크게 (시안 26g 시트와 같은 계산) */
export function itemThumbBox(itemId: string, size: number): CanvasBox {
  const [x, y, w, h] = BBOX[itemId] ?? [14, 14, 172, 196];
  const s = Math.min((size * (w > h * 1.6 ? 1.05 : 0.88)) / w, (size * 0.88) / h, 1.3);
  return {
    left: r1(-x * s + (size - w * s) / 2),
    top: r1(-(y + 20) * s + (size - h * s) / 2),
    width: r1(200 * s),
    height: r1(240 * s),
  };
}
