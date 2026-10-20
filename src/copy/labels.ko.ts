// 화면에 반복해서 쓰는 짧은 이름표. 방송 문구는 broadcasts.ko.ts.

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
