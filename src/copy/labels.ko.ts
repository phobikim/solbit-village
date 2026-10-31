// 화면에 반복해서 쓰는 짧은 이름표. 방송 문구는 broadcasts.ko.ts.

import type { LeisureBand, RelationBand, TrendBand, WorkBand } from '../domain/indices';
import type { Weather } from '../domain/types';

export const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'] as const;

export const WEATHER_NAME: Record<Weather, string> = {
  sun: '맑음',
  cloud: '구름',
  over: '흐림',
  rain: '비',
  storm: '폭풍',
};

/** 일 강도 1~3 */
export const WORK_LABEL: Record<1 | 2 | 3, string> = {
  1: '살살',
  2: '보통',
  3: '갈려나감',
};

export type Relation = 'family' | 'friend' | 'coworker' | 'etc';

export const RELATION_LABEL: Record<Relation, string> = {
  family: '가족',
  friend: '친구',
  coworker: '동료',
  etc: '기타',
};

/**
 * 가까움 단계 이름 (SPEC 7장). 규칙은 src/domain/neighbors.ts.
 * '안부 묻기 좋은 이웃'은 목록 맨 아래 따로 둔다.
 */
export const CLOSENESS_LABEL = {
  close: '가까움',
  normal: '보통',
  distant: '뜸함',
} as const;


// ── 지수 카드 상태 문구 (단계는 src/domain/indices.ts) ─────────────────


export const HEALTH_STATUS: Record<Weather, string> = {
  sun: '맑음',
  cloud: '구름 조금',
  over: '흐림',
  rain: '비 옴',
  storm: '폭풍',
};

export const WORK_STATUS: Record<WorkBand, string> = {
  easy: '여유',
  normal: '보통',
  busy: '바쁨',
  overtime: '야근 중',
};

export const RELATION_STATUS: Record<RelationBand, string> = {
  bestFriend: '단짝 있음',
  lively: '북적북적',
  normal: '보통',
  quiet: '조용함',
};

/** 쉼 상태(모닥불): 메인 지수 카드 · 쉼터 · 나 탭이 같이 쓴다 (디자인 v8 TURN 15, 경계값은 fire.ts fireBand) */
export const LEISURE_STATUS: Record<LeisureBand, string> = {
  blaze: '활활',
  burning: '타오름',
  dying: '사그라듦',
  out: '꺼져감',
};

/** 지수를 계산할 기록이 없을 때 */
export const INDEX_EMPTY = '기록 전';
/** 관계 지수: 등록한 이웃이 없을 때 */
export const RELATION_NO_NEIGHBORS = '이웃 없음';

export const VILLAGE_NAME = '솔빛 마을';

export const TREND_LABEL: Record<TrendBand, string> = {
  up: '계속 오름',
  slightlyUp: '조금 오름',
  flat: '그대로',
  slightlyDown: '살짝 하락',
  down: '하락',
  unknown: '기록 부족',
};

export const ASK_AFTER_TITLE = '안부 묻기 좋은 이웃';

export const FREQUENCY_LABEL = { often: '자주', sometimes: '가끔', rarely: '드물게' } as const;

/** 행사 분류 이름 (디자인 11a) */
export const EVENT_TYPE_LABEL = { travel: '여행', birth: '생일', work: '업무', meet: '약속', etc: '기타' } as const;
/** 달력 범례용 짧은 이름 (디자인 7b) */
export const EVENT_TYPE_SHORT = { travel: '여행', birth: '생일', work: '업무', meet: '약속', etc: '기타' } as const;
/** 분류 색 (아이콘 · 칩) */
export const EVENT_TYPE_COLOR = {
  travel: '#C49BFF',
  birth: '#FF4FA0',
  work: '#FFC23C',
  meet: '#A8EB5A',
  etc: '#5FD8FF',
} as const;
/** 게시판 쪽지 종이 색 */
export const EVENT_PAPER_COLOR = { travel: '#EBDDFF', birth: '#FFD6E9', work: '#FFEDBF', meet: '#E5F8CC', etc: '#D3F4FF' } as const;
/** 행사 등록 시트의 이장 한마디 (분류별) */
export const EVENT_TYPE_LINE = {
  travel: '다녀오슈. 마을은 이장이 지켜유, 대충유.',
  birth: '빈손으로 가지 마슈.',
  work: '일은 일이구 밭은 밭이유.',
  meet: '늦지 마슈. 이장은 늦어유.',
  etc: '적어두면 이장이 기억혀유. 장부가유.',
} as const;
/** 기록 시트: 일한 날 / 쉬는 날 (디자인 14a · 14b) */
export const DAY_TYPE_LABEL = { work: '일한 날', rest: '쉬는 날' } as const;
export const recordCopy = {
  weekendRest: (dow: string) => `${dow}요일이라 쉬는 날로 골라놨슈. 연차도 여기유.`,
  memoPlaceholder: '오늘 어땠슈? 한 줄이면 돼유',
  more: '더 적고 싶으면',
  workHint: '일했다면 적어두세유. 안 적으면 일 0으로 쳐유.',
  contactsHint: '얘기 나눈 이웃을 눌러유.',
  leisureHint: '뭐 했는지 눌러유.',
  sizeAsk: '얼마나 쉬었슈?',
  sizeIdle: '쉰 걸 고르면 얼마나 쉬었는지도 정해유.',
  needWork: '컨디션과 일 강도만 고르면 됩니다.',
  needRest: '컨디션만 고르면 됩니다.',
};
/** 기록 카드: 쉬는 날에 일 강도를 안 적었을 때 */
export const REST_DAY_LABEL = '쉬는 날';
/** 장부 · 대소사가 비었을 때 */
export const LEDGER_EMPTY = '게시판에 붙은 쪽지가 없습니다. + 로 행사를 적어 두세요.';

export const SKIN_CATEGORY_LABEL = { soli: '솔이', building: '마을 건물', ijang: '이장 소품' } as const;
