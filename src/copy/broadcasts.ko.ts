// 이장 방송 문구 모음 (SPEC 9장). 화면·도메인 코드에 문구를 하드코딩하지 않는다.
// 상황 선택 규칙은 src/domain/broadcast.ts.
// 톤: 시니컬하지만 놀리는 대상은 상황이지 사용자가 아니다. 말투는 충청도 사투리 (디자인 v6, 2026-10-22).

import { CROP_NAME } from './crops.ko';
import { EVENT_TYPE_LINE } from './labels.ko';
import { eul, iga, irang } from './josa';
import type { BroadcastSituation } from '../domain/broadcast';

/** 행사 일주일 전 방송 꼬리말 (분류별) */
const EVENT_WEEK_TAIL = {
  travel: '짐은 아직 안 쌌겄슈.',
  birth: '선물은 미리 사 두슈.',
  work: '준비는 미리 허는 거유. 아마도유.',
  meet: '약속은 지키라구 있는 거유.',
  etc: '이장이 기억허구 있슈. 장부가유.',
} as const;

export const BROADCAST_PREFIX = '아아, 이장이유.';

export const broadcasts = {
  /** 컨디션 폭풍: 개그 없이 짧게 */
  storm: '...오늘은 방송 안 해유. 푹 쉬슈. 이상.',
  /** 폭풍 + 내일 행사: 톤은 그대로, 행사 정보만 남긴다 */
  stormWithEvent: (name: string) => `...오늘은 방송 안 해유. 내일 ${name}만 기억허슈. 푹 쉬슈.`,
  morningCloudy: '오늘 날씨 흐림. 솔이 씨 얼굴두 흐림. 이상.',
  workOverheat: '밭에 또 밤새 불이 켜져 있네유. 작물두 잠은 자야 혀유.',
  neighborVisit: (name: string) => `${name} 씨가 또 놀러 왔슈. 이 집 문지방 닳겄슈.`,
  bestFriend: (name: string) => `이번 달 단짝은 ${name} 씨여유. 상품은 없슈.`,
  leisureLow: '냇가 물이 탁해졌슈. 솔이 씨가 안 놀아서 그렇대유.',
  recordOnly: '오늘 기록: 없음. 그래두 기록은 혔으니 경험치는 드려유. 이장 재량이유.',
  villageLevelUp: '마을이 커졌슈. 이장 월급은 안 올랐슈.',
  autoHarvest: (crop: string) => `밭이 꽉 차서 젤 오래된 ${eul(crop)} 대신 땄슈. 창고에 넣어놨슈.`,
  exchangeReady: (crop: string, n: number, skin: string) =>
    `${crop} ${n}개 모였슈. ${irang(skin)} 바꿀 수 있슈, 안 바꿔도 되구유.`,
  exchangeReadyAny: (n: number, skin: string) => `작물 ${n}개 모였슈. ${irang(skin)} 바꿀 수 있슈, 안 바꿔도 되구유.`,
  /** 행사 당일 */
  eventToday: (name: string, line: string) => `오늘은 ${name} 날이유. ${line}`,
  /** 행사 일주일 전 */
  eventWeek: (name: string, tail: string) => `${name} 일주일 남았슈. ${tail}`,
  /** 게시판이 빈 조용한 날 */
  boardEmpty: '게시판이 비었슈. 이장이 일을 안 한 건 아니유.',
  /** 행사 전날 — 생일·기념일 */
  eventEveAnniversary: (name: string) => `내일이 ${name}이유. 빈손으로 가지 마슈.`,
  /** 행사 전날 — 일정 · 기타 */
  eventEve: (name: string) => `내일 ${name} 있슈. 이장두 괜히 떨려유.`,
  /** 교환 직후 (바로 착용) */
  exchangeDone: (skin: string) => `${skin} 들여놓구 바로 써 봤슈. 잘 어울려유. 아마도유.`,
  ledger: '장부에 다 적어놨슈. 이장은 다 기억혀유. 장부가유.',
  storageQuiet: '창고는 잘 있슈. 쥐는 없슈. 아마도유.',
  /** 교환소 분류 탭별 이장 한마디 (디자인 9e) */
  shopLine: {
    soli: '교환은 공정혀유. 아마도요.',
    building: '건물은 환불 안 돼유. 철거는 이장이 귀찮어유.',
    ijang: '이장 꾸미기는 마을 예산이유. 여러분 작물이요.',
  },
  rainyMonth: (days: number) => `이번 달 비 온 날이 ${days}일이유. 우산은 각자 챙기슈.`,
  weeklySummaryWorkHeavy: '솔이 씨 4주 치 정리했슈. 일 하나는 열심히 혔네유, 일만.',
  /** 밤사이 자동 수확 (crops: 작물 이름들) */
  overnightHarvest: (crops: string) => `밤사이 ${eul(crops)} 따서 창고에 넣었슈. 손 하나 까딱 안 하셨슈.`,
  quiet: '오늘두 마을은 조용허유. 별일 없는 게 젤이유.',
  weeklySummary: '솔이 씨 4주 치 정리했슈. 대충 무사했슈.',
  weeklySummaryEmpty: '4주 치 정리허려 혔는디 적힌 게 별루 없슈. 천천히 허셔두 돼유.',
  neighborsQuiet: '이웃 장부는 조용허유. 조용헌 것두 평화유.',
  neighborsEmpty: '아직 이웃이 없슈. 주민등록은 이장이 알아서 허겄슈.',
  askAfter: (name: string) => `${name} 씨 안부 한 번 물어보기 좋은 날씨여유.`,
} as const;

/** 이장 한마디 (방송 라인이 아닌 말풍선) */
export const ijangLines = {
  sheetNew: '대충 적어도 돼유. 이장도 대충 읽어유.',
  sheetEdit: '고쳐두 돼유. 이미 심은 작물은 그대루유.',
  sheetTooOld: '그날 기록은 인제 장부에 굳었슈. 7일 지난 기록은 못 고쳐유.',
  sheetNoBackfill: '일주일 넘은 빈칸은 그대루 둬유. 비어 있어두 괜찮어유.',
  sheetBackfill: '빈 날 채우시는구먼유. 씨앗은 오늘 밭에 심어 드려유.',
  noNeighbors: '아직 등록헌 이웃이 없슈. 이웃 탭에서 등록허면 여기 떠유.',
  neighborNew: '새 이웃이유? 주민등록은 이장이 알아서 허겄슈.',
  neighborEdit: '고칠 게 있으면 고치슈. 이장은 못 본 척허겄슈.',
  neighborArchiveConfirm: '목록에서만 내려유. 지난 기록은 그대루 남어유.',
} as const;

/** 폭풍 방송은 "아아, 이장이유." 머리말 없이 그대로 쓴다 */
export function withPrefix(body: string): string {
  return body === broadcasts.storm ? body : `${BROADCAST_PREFIX} ${body}`;
}

/** 상황 → 방송 문구 (머리말 포함) */
export function broadcastText(s: BroadcastSituation): string {
  switch (s.kind) {
    case 'storm':
      return s.eventTomorrow ? broadcasts.stormWithEvent(s.eventTomorrow) : broadcasts.storm;
    case 'eventToday':
      return withPrefix(broadcasts.eventToday(s.name, EVENT_TYPE_LINE[s.type]));
    case 'eventEve':
      return withPrefix(s.type === 'birth' ? broadcasts.eventEveAnniversary(s.name) : broadcasts.eventEve(s.name));
    case 'eventWeek':
      return withPrefix(broadcasts.eventWeek(s.name, EVENT_WEEK_TAIL[s.type]));
    case 'exchangeReady':
      return withPrefix(
        s.crop ? broadcasts.exchangeReady(CROP_NAME[s.crop], s.count, s.skin) : broadcasts.exchangeReadyAny(s.count, s.skin),
      );
    case 'villageLevelUp':
      return withPrefix(broadcasts.villageLevelUp);
    case 'overnightHarvest':
      return withPrefix(broadcasts.overnightHarvest([...new Set(s.crops)].map((c) => CROP_NAME[c]).join(', ')));
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
    case 'cloudy':
      return withPrefix(broadcasts.morningCloudy);
    case 'bestFriend':
      return withPrefix(broadcasts.bestFriend(s.name));
    case 'quiet':
      return withPrefix(s.boardEmpty ? broadcasts.boardEmpty : broadcasts.quiet);
  }
}
