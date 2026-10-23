// 도메인 공용 타입. 규칙(계산)은 단계 4에서 각 모듈(crops.ts, weather.ts …)에 둔다.

/** 작물 5종 (SPEC 5장). 모두 같은 등급. */
export type CropKind = 'sunflower' | 'strawberry' | 'coffee' | 'mushroom' | 'potato';

/** 1일차 새싹 → 2일차 자라는 중 → 3일차 다 익음 */
export type CropStage = 1 | 2 | 3;

/** 밭 한 칸. 빈 칸은 null. 밭은 5칸. */
export type PlotSlot = { crop: CropKind; stage: CropStage } | null;

/** 날씨 5단계 (SPEC 3장) */
export type Weather = 'sun' | 'cloud' | 'over' | 'rain' | 'storm';

/** 컨디션 3단계: 1 지침 / 2 보통 / 3 신남 */
export type Condition = 1 | 2 | 3;

/** 시간대는 배경색으로만 표현 (낮/밤 전환 시각은 SPEC 미정) */
export type TimeOfDay = 'day' | 'night';

export type IndexKind = 'health' | 'work' | 'relation' | 'leisure';

/** 일 강도 1~3 */
export type WorkLevel = 1 | 2 | 3;

export type ContactMethod = 'call' | 'meet' | 'message';

export type Contact = { neighborId: string; method: ContactMethod };

/** 일한 날 / 쉬는 날 (디자인 v7 TURN 14, 2026-10-23) */
export type DayType = 'work' | 'rest';

/** 하루 기록 (SPEC 4장). date는 day.ts 기준 'YYYY-MM-DD'. */
export type DayRecord = {
  date: string;
  condition: Condition;
  dayType: DayType;
  /** 일 강도. 일한 날은 필수, 쉬는 날은 적을 때만 (없으면 null) */
  work: WorkLevel | null;
  /** 오늘의 성취 (선택, 장부로 감) */
  achievement: string | null;
  memo: string | null;
  /** 여가 칩 이름 (기본 칩 + 직접 입력) */
  leisure: string[];
  contacts: Contact[];
  createdAt: number;
  updatedAt: number;
};
