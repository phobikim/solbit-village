// 보따리 지도 (디자인 v8 15c). 실제 지도가 아니다 — 솔빛 마을을 한가운데 두고 장소를 겹치지 않게 자동 배치한다.
// 지도 API · 위치 권한 없음. 발자국 = 다녀온 곳, 깃발 = 가고 싶은 곳.

import type { Place } from './rest';

/** 핀 하나가 차지하는 지름 (지도 단위) */
export const PIN_SIZE = 40;
/** 마을 한가운데가 비는 반지름 */
export const VILLAGE_RADIUS = 56;
/** 핀 사이 최소 거리 */
export const PIN_GAP = PIN_SIZE + 12;

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

export type MapPin = { place: Place; x: number; y: number };

/**
 * 해바라기씨 배열(황금각 나선)로 놓는다. 담은 순서(createdAt, id)대로 자리가 정해져서
 * 장소가 늘어도 이미 놓인 핀은 움직이지 않고, 깃발이 발자국이 되어도 그 자리에 남는다.
 * 좌표는 마을이 (0, 0).
 */
export function layoutPins(places: readonly Place[]): MapPin[] {
  const order = [...places].sort((a, b) => a.createdAt - b.createdAt || a.id.localeCompare(b.id));
  // 반지름 r = √(R0² + c²·(i+1)): 한 고리 안 이웃 간격이 PIN_GAP 이상이 되도록 c를 잡는다
  const c = PIN_GAP * 0.95;
  return order.map((place, i) => {
    const r = Math.sqrt(VILLAGE_RADIUS * VILLAGE_RADIUS + c * c * (i + 1));
    const a = i * GOLDEN_ANGLE;
    return { place, x: Math.cos(a) * r, y: Math.sin(a) * r };
  });
}

/** 지도 안에 들어오게 줄일 배율 (핀이 가장 먼 곳까지 보이도록, 키울 일은 없다) */
export function mapScale(pins: readonly MapPin[], halfWidth: number, halfHeight: number): number {
  let sx = 1;
  let sy = 1;
  for (const p of pins) {
    sx = Math.min(sx, (halfWidth - PIN_SIZE / 2) / Math.max(1, Math.abs(p.x)));
    sy = Math.min(sy, (halfHeight - PIN_SIZE / 2) / Math.max(1, Math.abs(p.y)));
  }
  return Math.min(sx, sy);
}

/** 다녀온 경로 (점선): 마을에서 시작해 다녀온 날 순서대로 */
export function footprintPath(pins: readonly MapPin[]): { x: number; y: number }[] {
  const visited = pins
    .filter((p) => p.place.visited && p.place.visitedDate)
    .sort((a, b) => (a.place.visitedDate ?? '').localeCompare(b.place.visitedDate ?? '') || a.place.createdAt - b.place.createdAt);
  return visited.length ? [{ x: 0, y: 0 }, ...visited.map((p) => ({ x: p.x, y: p.y }))] : [];
}
