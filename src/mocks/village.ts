// 아직 데이터가 없는 탭(이웃 · 나)의 방송 목업. 단계 5에서 교체한다.

import { broadcasts, withPrefix } from '../copy/broadcasts.ko';

export const mockBroadcasts = {
  neighbors: { message: withPrefix(broadcasts.bestFriend('서연')), time: '21:40' },
  me: { message: withPrefix(broadcasts.weeklySummaryWorkHeavy), time: '21:40' },
};
