// 밤사이 마을 소식(그날 처음 열 때) 스토어 + 화면 값

import { useMemo } from 'react';

import { getSetting, setSetting, SETTING } from '../data/settings';
import { addDays, type DayKey } from '../domain/day';
import { morningNews, shouldShowNews, type NewsItem } from '../domain/news';
import { useFarm } from './farm';
import { useLedger } from './ledger';
import { useNeighbors } from './neighbors';
import { useRecords } from './records';

/** 오늘 소식을 아직 안 봤으면 true */
export async function needsMorningNews(today: DayKey): Promise<boolean> {
  return shouldShowNews(await getSetting(SETTING.newsSeenDate), today);
}

export function markNewsSeen(today: DayKey): Promise<void> {
  return setSetting(SETTING.newsSeenDate, today);
}

export function useMorningNews(today: DayKey): NewsItem[] {
  const active = useFarm((s) => s.active);
  const harvested = useFarm((s) => s.harvestedToday);
  const byDate = useRecords((s) => s.byDate);
  const neighbors = useNeighbors((s) => s.list);
  const events = useLedger((s) => s.events);
  return useMemo(() => {
    const nameOf = new Map(neighbors.map((n) => [n.id, n.name]));
    const visitors = [
      ...new Set((byDate[addDays(today, -1)]?.contacts ?? []).map((c) => nameOf.get(c.neighborId)).filter(Boolean)),
    ] as string[];
    return morningNews({ today, active, visitors, events, harvested });
  }, [active, harvested, byDate, neighbors, events, today]);
}
