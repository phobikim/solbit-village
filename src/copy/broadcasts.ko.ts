// 이장 방송 문구 모음 (SPEC 9장). 화면·도메인 코드에 문구를 하드코딩하지 않는다.
// 상황 선택 규칙은 src/domain/broadcast.ts.
// 톤: 시니컬하지만 놀리는 대상은 상황이지 사용자가 아니다.

import { CROP_NAME } from './crops.ko';
import { eul, iga } from './josa';
import type { BroadcastSituation } from '../domain/broadcast';

export const BROADCAST_PREFIX = '아아, 이장입니다.';

export const broadcasts = {
  /** 컨디션 폭풍: 개그 없이 짧게 */
  storm: '...오늘은 방송 안 합니다. 푹 쉬세요. 이상.',
  morningCloudy: '오늘 날씨 흐림. 솔이 씨 얼굴도 흐림. 이상.',
  workOverheat: '밭에 또 밤새 불이 켜져 있네요. 작물도 잠은 자야 됩니다.',
  neighborVisit: (name: string) => `${name} 씨가 또 놀러 왔습니다. 이 집 문지방 닳겠습니다.`,
  bestFriend: (name: string) => `이번 달 단짝은 ${name} 씨입니다. 상품은 없습니다.`,
  leisureLow: '냇가 물이 탁해졌습니다. 솔이 씨가 안 놀아서 그렇답니다.',
  recordOnly: '오늘 기록: 없음. 그래도 기록은 했으니 경험치는 드립니다. 이장 재량입니다.',
  villageLevelUp: '마을이 커졌습니다. 이장 월급은 안 올랐습니다.',
  autoHarvest: (crop: string) => `밭이 꽉 차서 제일 오래된 ${eul(crop)} 대신 땄습니다. 창고에 넣어놨습니다.`,
  exchangeReady: (crop: string, n: number, skin: string) =>
    `${iga(crop)} ${n}개 모였습니다. ${skin}랑 바꿀 수 있습니다. 안 바꿔도 되고요.`,
  eventEve: (name: string) => `내일이 ${name} 씨 생신입니다. 빈손으로 가지 마세요.`,
  rainyMonth: (days: number) => `이번 달 비 온 날이 ${days}일입니다. 우산은 각자 챙기세요.`,
  weeklySummaryWorkHeavy: '솔이 씨 4주 치 정리했습니다. 일만 열심히 하셨네요.',
  ripe: (n: number) => `밭에 다 익은 작물이 ${n}개 있습니다. 안 따도 안 시듭니다. 그냥 알려드립니다.`,
  quiet: '오늘도 마을은 조용합니다. 별일 없는 게 제일입니다.',
  weeklySummary: '솔이 씨 4주 치 정리했습니다. 대체로 무사했습니다.',
  weeklySummaryEmpty: '4주 치 정리하려 했는데 적힌 게 별로 없습니다. 천천히 하셔도 됩니다.',
  neighborsQuiet: '이웃 장부는 조용합니다. 조용한 것도 평화입니다.',
  neighborsEmpty: '아직 이웃이 없습니다. 주민등록은 이장이 알아서 하겠습니다.',
  askAfter: (name: string) => `${name} 씨 안부 한 번 물어보기 좋은 날씨네요.`,
} as const;

/** 이장 한마디 (방송 라인이 아닌 말풍선) */
export const ijangLines = {
  sheetNew: '대충 적어도 됩니다. 이장도 대충 읽습니다.',
  sheetEdit: '고쳐도 됩니다. 이미 심은 작물은 그대로입니다.',
  sheetTooOld: '그날 기록은 이제 장부에 굳었습니다. 7일 지난 기록은 못 고칩니다.',
  sheetNoBackfill: '지난날 빈칸은 비워 둡니다. 오늘 것만 적으시면 됩니다.',
  noNeighbors: '아직 등록한 이웃이 없습니다. 이웃 탭에서 등록하면 여기 뜹니다.',
} as const;

/** 폭풍 방송은 "아아, 이장입니다." 머리말 없이 그대로 쓴다 */
export function withPrefix(body: string): string {
  return body === broadcasts.storm ? body : `${BROADCAST_PREFIX} ${body}`;
}

/** 상황 → 방송 문구 (머리말 포함) */
export function broadcastText(s: BroadcastSituation): string {
  switch (s.kind) {
    case 'storm':
      return broadcasts.storm;
    case 'villageLevelUp':
      return withPrefix(broadcasts.villageLevelUp);
    case 'autoHarvest':
      return withPrefix(broadcasts.autoHarvest(CROP_NAME[s.crop]));
    case 'neighborVisit':
      return withPrefix(broadcasts.neighborVisit(s.name));
    case 'workOverheat':
      return withPrefix(broadcasts.workOverheat);
    case 'leisureLow':
      return withPrefix(broadcasts.leisureLow);
    case 'recordOnly':
      return withPrefix(broadcasts.recordOnly);
    case 'ripe':
      return withPrefix(broadcasts.ripe(s.count));
    case 'cloudy':
      return withPrefix(broadcasts.morningCloudy);
    case 'bestFriend':
      return withPrefix(broadcasts.bestFriend(s.name));
    case 'quiet':
      return withPrefix(broadcasts.quiet);
  }
}
