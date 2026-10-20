// 상황 → 이장 방송 선택 (SPEC 9장). 문구는 copy/broadcasts.ko.ts, 여기서는 어떤 상황인지만 고른다.
// 컨디션 폭풍이면 개그 없이 짧게 (CLAUDE.md 규칙 7).

import { LEISURE_LOW, WORK_OVERHEAT } from './indices';
import type { CropKind, Weather } from './types';

export type BroadcastSituation =
  | { kind: 'storm' }
  | { kind: 'villageLevelUp' }
  | { kind: 'autoHarvest'; crop: CropKind }
  | { kind: 'neighborVisit'; name: string }
  | { kind: 'workOverheat' }
  | { kind: 'leisureLow' }
  | { kind: 'recordOnly' }
  | { kind: 'cloudy' }
  | { kind: 'bestFriend'; name: string }
  | { kind: 'ripe'; count: number }
  | { kind: 'quiet' };

export type BroadcastContext = {
  weather: Weather | null;
  leveledUpToday: boolean;
  autoHarvestedToday: CropKind | null;
  /** 어제 연락해서 오늘 놀러 온 이웃 이름 */
  visitorFromYesterday: string | null;
  workIndex: number | null;
  leisureIndex: number | null;
  /** 최근 7일 기록 수 (여가 부족은 기록이 어느 정도 있을 때만) */
  recentRecordCount: number;
  /** 오늘 기록이 있고, 성취·연락·여가·메모가 하나도 없음 */
  todayRecordOnly: boolean;
  bestFriendName: string | null;
  ripeCount: number;
};

/** 위에서부터 먼저 맞는 상황 하나 */
export function selectBroadcast(c: BroadcastContext): BroadcastSituation {
  if (c.weather === 'storm') return { kind: 'storm' };
  if (c.leveledUpToday) return { kind: 'villageLevelUp' };
  if (c.autoHarvestedToday) return { kind: 'autoHarvest', crop: c.autoHarvestedToday };
  if (c.visitorFromYesterday) return { kind: 'neighborVisit', name: c.visitorFromYesterday };
  if (c.workIndex !== null && c.workIndex >= WORK_OVERHEAT) return { kind: 'workOverheat' };
  if (c.leisureIndex !== null && c.leisureIndex <= LEISURE_LOW && c.recentRecordCount >= 3) return { kind: 'leisureLow' };
  if (c.todayRecordOnly) return { kind: 'recordOnly' };
  if (c.ripeCount > 0) return { kind: 'ripe', count: c.ripeCount };
  if (c.weather === 'over' || c.weather === 'rain') return { kind: 'cloudy' };
  if (c.bestFriendName) return { kind: 'bestFriend', name: c.bestFriendName };
  return { kind: 'quiet' };
}
