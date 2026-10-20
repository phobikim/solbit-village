// 화면에 반복해서 쓰는 짧은 이름표. 방송 문구는 broadcasts.ko.ts.

import type { LeisureBand, RelationBand, WorkBand } from '../domain/indices';
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
 * 가까움 단계 이름. 낮은 단계도 경고처럼 보이지 않게 쓴다 (CLAUDE.md 규칙 6).
 * 단계 계산식은 SPEC 7장 [미정].
 */
export const CLOSENESS_LABEL = {
  close: '가까움',
  normal: '보통',
  sometimes: '가끔',
} as const;

export type Closeness = keyof typeof CLOSENESS_LABEL;

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
