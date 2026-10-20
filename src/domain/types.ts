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
