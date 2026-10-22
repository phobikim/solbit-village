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

export const LEISURE_STATUS: Record<LeisureBand, string> = {
  full: '활짝 핌',
  half: '반만 핌',
  bud: '봉오리',
  none: '아직 봉오리',
};

/** 지수를 계산할 기록이 없을 때 */
export const INDEX_EMPTY = '기록 전';
/** 관계 지수: 등록한 이웃이 없을 때 */
export const RELATION_NO_NEIGHBORS = '이웃 없음';

export const VILLAGE_NAME = '솔빛 마을';
export const VILLAGE_TAGLINE = '아직 망하진 않음';

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
export const EVENT_TYPE_LABEL = { travel: '여행', birth: '생일·기념일', work: '업무', meet: '약속', etc: '기타' } as const;
/** 달력 범례용 짧은 이름 (디자인 7b) */
export const EVENT_TYPE_SHORT = { travel: '여행', birth: '생일', work: '업무', meet: '약속', etc: '기타' } as const;
/** 분류 색 (아이콘 · 칩) — 성취는 장부 '지나간 일' 표시 */
export const EVENT_TYPE_COLOR = {
  travel: '#C49BFF',
  birth: '#FF4FA0',
  work: '#FFC23C',
  meet: '#A8EB5A',
  etc: '#5FD8FF',
  achievement: '#FFE14D',
} as const;
/** 게시판 쪽지 종이 색 */
export const EVENT_PAPER_COLOR = { travel: '#EBDDFF', birth: '#FFD6E9', work: '#FFEDBF', meet: '#E5F8CC', etc: '#D3F4FF' } as const;
/** 행사 등록 시트의 이장 한마디 (분류별) */
export const EVENT_TYPE_LINE = {
  travel: '다녀오세요. 마을은 이장이 지킵니다. 대충요.',
  birth: '빈손으로 가지 마세요.',
  work: '일은 일이고 밭은 밭입니다.',
  meet: '늦지 마세요. 이장은 늦습니다.',
  etc: '적어두면 이장이 기억합니다. 장부가요.',
} as const;
export const ACHIEVEMENT_LABEL = '성취';

export const SKIN_CATEGORY_LABEL = { soli: '솔이', building: '마을 건물', ijang: '이장 소품' } as const;
