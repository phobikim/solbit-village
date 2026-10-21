// 마을 탭(7a)에 그릴 값을 스토어 + 도메인 규칙으로 만든다. 화면은 이 결과를 그리기만 한다.

import { useMemo } from 'react';

import { broadcastText } from '../copy/broadcasts.ko';
import {
  HEALTH_STATUS,
  INDEX_EMPTY,
  LEISURE_STATUS,
  RELATION_NO_NEIGHBORS,
  RELATION_STATUS,
  WORK_STATUS,
} from '../copy/labels.ko';
import { selectBroadcast } from '../domain/broadcast';
import { fieldSlots } from '../domain/crops';
import { addDays, timeOfDayAt, type DayKey, yearMonthOf } from '../domain/day';
import {
  computeIndices,
  INDEX_WINDOW_DAYS,
  leisureBand,
  relationBand,
  WORK_OVERHEAT,
  workBand,
  type Frequency,
} from '../domain/indices';
import { bestFriendOf, villageVisitors, visitedFromYesterday } from '../domain/neighbors';
import { recordHeadline } from '../domain/records';
import type { Condition, DayRecord, IndexKind } from '../domain/types';
import { levelFromXp, type LevelProgress } from '../domain/village';
import { WEATHER_WINDOW_DAYS, weatherNow } from '../domain/weather';
import type { SoliMood, VillageSceneParams } from '../ui/characters';
import { boardEvents, eventsInAWeek, eventsToday, eventsTomorrow } from '../domain/events';
import { equippedSkin, exchangeableSkins, exchangeHint } from '../domain/harvest';
import { dDayLabel } from '../domain/day';
import { useFarm } from './farm';
import { useLedger, useSkins } from './ledger';
import { useNeighbors } from './neighbors';
import { useRecords } from './records';

const MOOD: Record<Condition, SoliMood> = { 1: 'tired', 2: 'normal', 3: 'happy' };

/** 마을 화면이 읽어야 하는 기록 범위 (지수 7일 · 이웃 방문 14일 · 이번 달 단짝) */
export function villageRange(today: DayKey): { from: DayKey; to: DayKey } {
  const monthStart = `${today.slice(0, 8)}01`;
  const lookback = addDays(today, -Math.max(INDEX_WINDOW_DAYS, WEATHER_WINDOW_DAYS, 14));
  return { from: monthStart < lookback ? monthStart : lookback, to: today };
}

export type IndexCardView = { kind: IndexKind; value: number | null; status: string };

export type VillageView = {
  level: LevelProgress;
  broadcast: string;
  scene: VillageSceneParams;
  indices: IndexCardView[];
  recordedToday: boolean;
};

export function useVillageView(today: DayKey, now: Date): VillageView {
  const byDate = useRecords((s) => s.byDate);
  const neighbors = useNeighbors((s) => s.list);
  const farm = useFarm();
  const events = useLedger((s) => s.events);
  const owned = useSkins((s) => s.owned);
  const equipped = useSkins((s) => s.equipped);

  return useMemo(() => {
    const conditionByDay: Record<DayKey, Condition> = Object.fromEntries(
      Object.values(byDate).map((r) => [r.date, r.condition]),
    );
    const weather = weatherNow(today, conditionByDay);
    const todayRec: DayRecord | undefined = byDate[today];
    const latest = todayRec ?? byDate[addDays(today, -1)] ?? byDate[addDays(today, -2)];

    const indexNeighbors = neighbors.map((n) => ({
      id: n.id,
      frequency: n.frequency as Frequency,
      lastContact: n.lastContact,
    }));
    const idx = computeIndices(byDate, indexNeighbors, today);

    const nameOf = new Map(neighbors.map((n) => [n.id, n]));
    const bestId = bestFriendOf(byDate, yearMonthOf(today));
    const best = bestId ? nameOf.get(bestId) ?? null : null;
    const visitorIds = villageVisitors(byDate, today, new Set(nameOf.keys()));
    const visitors = visitorIds.map((id) => ({ face: nameOf.get(id)!.face, heart: id === bestId }));
    const fromYesterday = visitorIds.find((id) => visitedFromYesterday(byDate, today, id));

    const level = levelFromXp(farm.totalXp);
    const levelBefore = levelFromXp(farm.totalXp - farm.xpGainedToday).level;

    let recent = 0;
    for (let i = 0; i < INDEX_WINDOW_DAYS; i++) if (byDate[addDays(today, -i)]) recent++;

    const onBoard = boardEvents(events, today);
    const todays = eventsToday(events, today)[0];
    const eve = eventsTomorrow(events, today)[0];
    const week = eventsInAWeek(events, today)[0];
    const canExchange = exchangeableSkins(farm.inventory, owned)[0];

    const situation = selectBroadcast({
      weather,
      eventToday: todays ? { name: todays.name, type: todays.type } : null,
      eventTomorrow: eve ? { name: eve.name, type: eve.type } : null,
      eventInAWeek: week ? { name: week.name, type: week.type } : null,
      boardEmpty: onBoard.length === 0,
      exchangeReady: canExchange ? exchangeHint(canExchange, farm.inventory) : null,
      leveledUpToday: level.level > levelBefore,
      autoHarvestedToday: farm.autoHarvestedToday,
      visitorFromYesterday: fromYesterday ? nameOf.get(fromYesterday)!.name : null,
      workIndex: idx.work,
      leisureIndex: idx.leisure,
      recentRecordCount: recent,
      todayRecordOnly: !!todayRec && !recordHeadline(todayRec) && todayRec.contacts.length === 0,
      bestFriendName: best?.name ?? null,
      harvestedToday: farm.harvestedToday,
    });

    const scene: VillageSceneParams = {
      timeOfDay: timeOfDayAt(now),
      weather: weather ?? 'cloud',
      plots: fieldSlots(farm.active, today),
      soliMood: latest ? MOOD[latest.condition] : 'normal',
      visitors,
      soliSkin: equippedSkin('soli', equipped),
      building: equippedSkin('building', equipped),
      board: onBoard.map((e) => ({ type: e.type, dday: dDayLabel(e.date, today), name: e.name })),
      boardToday: onBoard[0]?.date === today,
      lanternOn: latest?.work === 3 || (idx.work !== null && idx.work >= WORK_OVERHEAT),
      bloom: (idx.leisure ?? 0) / 100,
    };

    const indices: IndexCardView[] = [
      { kind: 'health', value: idx.health, status: weather ? HEALTH_STATUS[weather] : INDEX_EMPTY },
      { kind: 'work', value: idx.work, status: idx.work === null ? INDEX_EMPTY : WORK_STATUS[workBand(idx.work)] },
      {
        kind: 'relation',
        value: idx.relation,
        status:
          idx.relation === null
            ? neighbors.length
              ? INDEX_EMPTY
              : RELATION_NO_NEIGHBORS
            : RELATION_STATUS[relationBand(idx.relation, !!best)],
      },
      {
        kind: 'leisure',
        value: idx.leisure,
        status: idx.leisure === null ? INDEX_EMPTY : LEISURE_STATUS[leisureBand(idx.leisure)],
      },
    ];

    return {
      level,
      broadcast: broadcastText(situation),
      scene,
      indices,
      recordedToday: !!todayRec,
    };
  }, [byDate, neighbors, farm, today, now, events, owned, equipped]);
}
