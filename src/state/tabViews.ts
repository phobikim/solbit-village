// 이웃 탭(7c) · 나 탭(7d)에 그릴 값. 스토어 + 도메인 규칙으로 만들고, 화면은 그리기만 한다.

import { useMemo } from 'react';

import { broadcasts, withPrefix } from '../copy/broadcasts.ko';
import { TREND_LABEL } from '../copy/labels.ko';
import type { Relation } from '../copy/labels.ko';
import { addDays, dayKeyOf, type DayKey, yearMonthOf } from '../domain/day';
import { harvestProgress, type HarvestProgress } from '../domain/harvest';
import { TREND_WEEKS, trendBand, weeklyTrend, type IndexNeighbor } from '../domain/indices';
import { bestFriendOf, closenessOf, closenessRatio, monthContactCount, type Closeness } from '../domain/neighbors';
import type { IndexKind } from '../domain/types';
import { isUnlocked, levelFromXp, UNLOCK_LEVEL } from '../domain/village';
import { upcomingEvents } from '../domain/events';
import { equippedSkin, exchangeableSkins } from '../domain/harvest';
import { useFarm } from './farm';
import { useLedger, useSkins } from './ledger';
import { useNeighbors } from './neighbors';
import { useRecords } from './records';

// ── 7c 이웃 ─────────────────────────────────────────────────────────────

export type NeighborRow = {
  id: string;
  name: string;
  relation: Relation;
  face: number;
  color: number;
  closeness: Closeness;
  monthCount: number;
  bestFriend: boolean;
};

export type NeighborsView = {
  /** 가까운 순 (가까움 · 보통 · 뜸함) */
  listed: (NeighborRow & { closeness: Exclude<Closeness, 'askAfter'> })[];
  /** 안부 묻기 좋은 이웃 */
  askAfter: NeighborRow[];
  total: number;
  broadcast: string;
};

export function useNeighborsView(today: DayKey): NeighborsView {
  const list = useNeighbors((s) => s.list);
  const byDate = useRecords((s) => s.byDate);
  return useMemo(() => {
    const month = yearMonthOf(today);
    const bestId = bestFriendOf(byDate, month);
    const rows = list
      .map((n) => {
        const ratio = closenessRatio(n.frequency, n.lastContact, dayKeyOf(new Date(n.createdAt)), today);
        return {
          ratio,
          row: {
            id: n.id,
            name: n.name,
            relation: n.relation,
            face: n.face,
            color: n.color,
            closeness: closenessOf(ratio),
            monthCount: monthContactCount(byDate, month, n.id),
            bestFriend: n.id === bestId,
          } satisfies NeighborRow,
        };
      })
      .sort((a, b) => Number(b.row.bestFriend) - Number(a.row.bestFriend) || a.ratio - b.ratio);
    const listed = rows
      .map((r) => r.row)
      .filter((r): r is NeighborsView['listed'][number] => r.closeness !== 'askAfter');
    const askAfter = rows.map((r) => r.row).filter((r) => r.closeness === 'askAfter');
    const best = rows.find((r) => r.row.bestFriend)?.row;
    const broadcast = !list.length
      ? withPrefix(broadcasts.neighborsEmpty)
      : best
        ? withPrefix(broadcasts.bestFriend(best.name))
        : withPrefix(broadcasts.neighborsQuiet);
    return { listed, askAfter, total: list.length, broadcast };
  }, [list, byDate, today]);
}

// ── 7d 나 ───────────────────────────────────────────────────────────────

export type MeView = {
  harvest: HarvestProgress;
  recordDays: number;
  storedCrops: number;
  trendRange: { from: DayKey; to: DayKey };
  trends: { kind: IndexKind; values: (number | null)[]; summary: string }[];
  villageLevel: number;
  patternsLocked: boolean;
  patternsUnlockLevel: number;
  upcomingEvents: number;
  canExchange: boolean;
  soliSkin: string | null;
  broadcast: string;
};

/** 최근 4주 추세 계산에 필요한 기록 범위 */
export function meRange(today: DayKey): { from: DayKey; to: DayKey } {
  return { from: addDays(today, -(7 * TREND_WEEKS + 7)), to: today };
}

export function useMeView(today: DayKey): MeView {
  const byDate = useRecords((s) => s.byDate);
  const list = useNeighbors((s) => s.list);
  const farm = useFarm();
  const events = useLedger((s) => s.events);
  const owned = useSkins((s) => s.owned);
  const equipped = useSkins((s) => s.equipped);
  return useMemo(() => {
    const neighbors: IndexNeighbor[] = list.map((n) => ({ id: n.id, frequency: n.frequency, lastContact: n.lastContact }));
    const kinds: IndexKind[] = ['health', 'work', 'relation', 'leisure'];
    const trends = kinds.map((kind) => {
      const values = weeklyTrend(kind, byDate, neighbors, today);
      return { kind, values, summary: TREND_LABEL[trendBand(values)] };
    });
    const bands = Object.fromEntries(kinds.map((k, i) => [k, trendBand(trends[i].values)]));
    const villageLevel = levelFromXp(farm.totalXp).level;
    const broadcast =
      Object.values(bands).every((b) => b === 'unknown')
        ? withPrefix(broadcasts.weeklySummaryEmpty)
        : (bands.work === 'up' || bands.work === 'slightlyUp') && !['up', 'slightlyUp'].includes(bands.leisure)
          ? withPrefix(broadcasts.weeklySummaryWorkHeavy)
          : withPrefix(broadcasts.weeklySummary);
    return {
      harvest: harvestProgress(farm.totalHarvested),
      recordDays: farm.recordDays,
      storedCrops: Object.values(farm.inventory).reduce((a, n) => a + (n ?? 0), 0),
      trendRange: { from: addDays(today, -7 * TREND_WEEKS + 1), to: today },
      trends,
      villageLevel,
      patternsLocked: !isUnlocked('patterns', villageLevel),
      patternsUnlockLevel: UNLOCK_LEVEL.patterns,
      upcomingEvents: upcomingEvents(events, today).length,
      canExchange: exchangeableSkins(farm.inventory, owned).length > 0,
      soliSkin: equippedSkin('soli', equipped),
      broadcast,
    };
  }, [byDate, list, farm, today, events, owned, equipped]);
}
