// 아침 흐름 화면 문구. 코드에 하드코딩하지 않는다.

import type { DayType } from '../domain/morning';

export const MORNING_TITLE = '아침 준비';
/** 발자국 2칸 + 깃발 (하루 → 마을). 하루 고르기가 1단계 */
export const MORNING_STEP_LABEL = '3단계 중 2단계';

/** 오늘 하루 고르기 화면 이장 방송 (질문 한 가지뿐 — 컨디션은 묻지 않는다) */
export const DAY_PICK_BROADCAST = '오늘은 일하는 날이유, 노는 날이유?';

export const DAY_SECTION = '오늘은';
/** "마을 Lv.7" 칩 */
export const villageLevelChip = (level: number) => `마을 Lv.${level}`;

export const DAY_LABEL: Record<DayType, string> = {
  work: '일',
  play: '놀기',
};

/** 선택 카드 보상 줄: 라벨 + 앞에 + 붙인 숫자 */
export const DAY_REWARD_LABEL: Record<DayType, string> = {
  work: '월급',
  play: '흥',
};
export const rewardValue = (n: number) => `+${n}`;

/** 오늘의 보상 카드 (디자인 TURN 29 개정): 하루를 고르기 전에는 "골라보슈 · ?" */
export const TODAY_REWARD = '오늘의 보상';
export const REWARD_UNPICKED_LABEL = '골라보슈';
export const REWARD_UNPICKED_VALUE = '?';
/** 카드 오른쪽 칸: 보상은 저녁 기록을 저장할 때 지급 */
export const REWARD_PAYOUT = ['저녁 기록', '저장 시 지급'] as const;
export const REWARD_CARD_A11Y = (label: string, value: string) => `오늘의 보상, ${label} ${value}. 저녁 기록을 저장하면 지급`;

export const MORNING_NEXT = '다음';
export const MORNING_LATER = '나중에 할래유';
export const SOLI_ALT = '솔이';

export const DEV_DAY_TITLE = '개발자 · 오늘 하루 고르기';
export const DEV_DAY_SUB = '깨우기 → 하루 고르기 → 마을 확인용';
