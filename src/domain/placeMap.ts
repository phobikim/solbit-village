// 보따리 지도 섬 배치 (디자인 TURN 34 i · j · k). 실제 지도가 아니다 — 솔빛 섬 위에 가고 싶은 곳(깃발)만 놓는다.
// 지도 API · 위치 권한 없음. 다녀온 곳은 지도에 놓지 않는다 (visited=false 장소만 배치한다).
//
// 규칙
//  - 가운데 솔빛 섬에는 깃발이 5곳까지 놓인다.
//  - 큰 섬이 차면 작은 섬이 생기고, 작은 섬 하나에는 1~2곳이 놓인다.
//  - 작은 섬이 여럿이면 오른쪽 위 → 왼쪽 아래 순서로 큰 섬을 둘러 생긴다.
//  - 담은 순서(createdAt, id)대로 자리가 정해진다. 장소가 늘어도 이미 놓인 깃발은 움직이지 않는다
//    (깃발이 다녀온 곳이 되어 지도에서 빠져도 뒤 깃발의 자리는 다시 계산되지만, 순서만 당겨질 뿐 섬을 옮겨 다니지는 않는다).
// 좌표는 도면 단위(366 x 400) — 화면이 칸 너비에 맞춰 줄인다.

import { daysBetween, type DayKey } from './day';
import type { VillageEvent } from './events';
import { FLAG_OLD_DAYS, keptDays, scheduledDate, type Place } from './rest';

/** 도면 크기 (시안 34i의 칸 366 x 400) */
export const MAP_SIZE = { w: 366, h: 400 } as const;

/** 큰 섬(솔빛 섬) 깃발 자리 5곳 */
export const BIG_ISLAND_SLOTS: readonly (readonly [number, number])[] = [
  [128, 152],
  [248, 146],
  [100, 252],
  [270, 254],
  [188, 306],
];
export const BIG_ISLAND_CAP = BIG_ISLAND_SLOTS.length;
/** 작은 섬 하나에 놓이는 깃발 수 */
export const SMALL_ISLAND_CAP = 2;

/**
 * 작은 섬 자리 (섬 중심). 앞의 둘(오른쪽 위, 왼쪽 아래)은 시안 34j · 34k.
 * TODO(사용자 확인): 시안에 3개째 이후 자리와 상한이 없다. 임시로 오른쪽 아래, 왼쪽 위까지 4자리만 만들고
 * 그 뒤 깃발은 지도에 놓지 않는다 (MapLayout.overflow). 상한을 정해 주세요.
 */
export const SMALL_ISLANDS: readonly { cx: number; cy: number }[] = [
  { cx: 296, cy: 62 },
  { cx: 70, cy: 350 },
  { cx: 296, cy: 350 },
  { cx: 70, cy: 62 },
];
export const SMALL_ISLAND_MAX = SMALL_ISLANDS.length;
/** 지도에 놓을 수 있는 깃발 수 */
export const MAP_CAPACITY = BIG_ISLAND_CAP + SMALL_ISLAND_CAP * SMALL_ISLAND_MAX;

/**
 * 작은 섬 안 깃발 자리 두 곳 (섬 중심 기준).
 * 시안 34j는 한 곳일 때 가운데에 놓지만, 둘째가 들어와도 첫 깃발이 움직이지 않게 처음부터 두 자리 중 하나에 놓는다.
 */
export const SMALL_SLOT_OFFSETS: readonly (readonly [number, number])[] = [
  [-22, 8],
  [22, 6],
];

/** 섬 번호: -1 = 큰 섬, 0 ~ = 작은 섬 (SMALL_ISLANDS 순서) */
export type MapPin = { place: Place; x: number; y: number; island: number };
export type MapIsland = { index: number; cx: number; cy: number; count: number; fresh: boolean };
export type MapLayout = {
  pins: MapPin[];
  /** 생긴 작은 섬 */
  islands: MapIsland[];
  /** 자리가 없어 지도에 못 놓은 깃발 (작은 섬 4개가 다 찼을 때) */
  overflow: Place[];
};

/** 담은 순서 */
const byAdded = (a: Place, b: Place) => a.createdAt - b.createdAt || a.id.localeCompare(b.id);

/**
 * 가고 싶은 곳(깃발)을 섬 위에 놓는다. 다녀온 곳은 대상이 아니다.
 * 새로 생긴 섬(fresh): 가장 나중에 담은 깃발이 혼자 새 작은 섬에 놓였을 때 그 섬.
 */
export function layoutIslands(places: readonly Place[]): MapLayout {
  const flags = places.filter((p) => !p.visited).sort(byAdded);
  const pins: MapPin[] = [];
  const counts: number[] = [];
  const overflow: Place[] = [];

  flags.forEach((place, i) => {
    if (i < BIG_ISLAND_CAP) {
      const [x, y] = BIG_ISLAND_SLOTS[i];
      pins.push({ place, x, y, island: -1 });
      return;
    }
    const k = i - BIG_ISLAND_CAP;
    const island = Math.floor(k / SMALL_ISLAND_CAP);
    if (island >= SMALL_ISLAND_MAX) {
      overflow.push(place);
      return;
    }
    const slot = k % SMALL_ISLAND_CAP;
    const { cx, cy } = SMALL_ISLANDS[island];
    const [dx, dy] = SMALL_SLOT_OFFSETS[slot];
    pins.push({ place, x: cx + dx, y: cy + dy, island });
    counts[island] = (counts[island] ?? 0) + 1;
  });

  const last = pins[pins.length - 1];
  const islands = counts.map((count, index): MapIsland => ({
    index,
    ...SMALL_ISLANDS[index],
    count,
    fresh: !!last && last.island === index && count === 1,
  }));
  return { pins, islands, overflow };
}

// ── 깃발 종류 (디자인 B안 핀 깃발) ──────────────────────────────────────

/** 가고 싶은 곳(분홍) / 이장이 미는 곳(노랑) / 날짜 잡은 곳(D-day 배지) */
export type FlagKind = 'want' | 'ijang' | 'date';

/** 이장이 미는 곳: 오래 담아둔(FLAG_OLD_DAYS 이상) 가장 오래된 깃발 — 날짜가 잡히지 않은 것만 */
export function pushedFlag(places: readonly Place[], today: DayKey): Place | null {
  const oldest = places.filter((p) => !p.visited && !p.eventId).sort(byAdded)[0];
  return oldest && keptDays(oldest, today) >= FLAG_OLD_DAYS ? oldest : null;
}

/** 깃발 하나의 종류와 (날짜 잡은 곳이면) 날짜 */
export function flagInfo(
  place: Place,
  events: readonly VillageEvent[],
  pushedId: string | null,
  today: DayKey,
): { kind: FlagKind; date: DayKey | null; days: number | null } {
  const date = scheduledDate(place, events, today);
  if (date) return { kind: 'date', date, days: daysBetween(today, date) };
  return { kind: place.id === pushedId ? 'ijang' : 'want', date: null, days: null };
}
