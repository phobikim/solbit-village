// 단계 2용 목업 데이터 (design/ 7a 시안 값). 단계 3~4에서 SQLite + src/domain 계산으로 교체한다.

import { broadcasts, withPrefix } from '../copy/broadcasts.ko';
import type { IndexKind } from '../domain/types';
import type { VillageSceneParams } from '../ui/characters';

export const mockVillage = {
  name: '솔빛 마을',
  tagline: '아직 망하진 않음',
  level: 7,
  xp: { current: 1280, goal: 2000 },
  broadcast: { message: withPrefix(broadcasts.neighborVisit('하준')), time: '21:40' },
  scene: {
    timeOfDay: 'night',
    weather: 'cloud',
    plots: [
      { crop: 'strawberry', stage: 3 },
      { crop: 'strawberry', stage: 3 },
      { crop: 'potato', stage: 2 },
      { crop: 'coffee', stage: 1 },
      null,
    ],
    soliMood: 'normal',
    visitors: [
      { color: '#D9C9FF', hair: 'part', heart: true },
      { color: '#C9F2A6', hair: 'beanie' },
    ],
    bannerText: '솔이 씨 사파 여행 D-7',
    lanternOn: true,
    bloom: 0.5,
  } satisfies VillageSceneParams as VillageSceneParams,
  indices: [
    { kind: 'health', value: 58, status: '구름 조금' },
    { kind: 'work', value: 86, status: '야근 중' },
    { kind: 'relation', value: 76, status: '단짝 있음' },
    { kind: 'leisure', value: 50, status: '반만 핌' },
  ] satisfies { kind: IndexKind; value: number; status: string }[],
};

export const mockBroadcasts = {
  records: { message: withPrefix(broadcasts.rainyMonth(4)), time: '21:40' },
  neighbors: { message: withPrefix(broadcasts.bestFriend('서연')), time: '21:40' },
  me: { message: withPrefix(broadcasts.weeklySummaryWorkHeavy), time: '21:40' },
};
