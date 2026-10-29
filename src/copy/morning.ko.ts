// 아침 흐름 화면 문구. 코드에 하드코딩하지 않는다.

import type { DayType, MorningCondition } from '../domain/morning';

export const MORNING_TITLE = '아침 준비';
/** 발자국 3칸 중 지금 몇 번째인지 (하루 → 복장 → 마을) */
export const MORNING_STEP_LABEL = {
  1: '하루, 복장, 마을 중 1단계',
  2: '하루, 복장, 마을 중 2단계',
} as const;

/** 오늘 하루 고르기 화면 이장 방송 (일반 문구는 BROADCAST_PREFIX 없이 그대로) */
export const DAY_PICK_BROADCAST = {
  ask: '오늘은 무슨 날이고, 몸은 어떠유?',
  /** 컨디션 폭풍: 개그 없이 짧게 */
  storm: '...오늘은 푹 쉬어유.',
} as const;

export const DAY_SECTION = '오늘은';
export const CONDITION_SECTION = '몸은';

export const DAY_LABEL: Record<DayType, string> = {
  work: '일',
  rest: '쉼',
  play: '놀기',
};

export const CONDITION_LABEL: Record<MorningCondition, string> = {
  sunny: '맑음',
  partly: '구름 조금',
  cloudy: '흐림',
  rain: '비',
  storm: '폭풍',
};

export const MORNING_NEXT = '다음';
export const MORNING_LATER = '나중에 할래유';
export const SOLI_ALT = '솔이';

export const DEV_DAY_TITLE = '개발자 · 오늘 하루 고르기';
export const DEV_DAY_SUB = '아침 두 번째 화면 확인용';
