// 마을 보상표 시트 문구. 코드에 하드코딩하지 않는다.
// 보상은 확정된 금액처럼 쓴다 — "확률" · "랜덤" 표현 없음.

import type { UnlockId } from '../domain/villageUnlocks';

export const REWARD_SHEET_TITLE = '마을 보상표';
export const REWARD_SHEET_CLOSE = '닫기';
export const REWARD_MILESTONE = '특별 보상';

export const rewardLevelTitle = (level: number) => `마을 Lv.${level}`;
export const rewardNextLabel = (level: number) => `Lv.${level + 1}까지`;
/** 진행 바 접근성 라벨 (숫자 수치 없이 레벨만) */
export const rewardProgressA11y = (level: number) => `마을 Lv.${level + 1}까지 가는 중`;
export const rewardRowLabel = (level: number) => `Lv.${level}`;

export const REWARD_COIN_LABEL = '월급';
export const REWARD_ENERGY_LABEL = '기력';
export const REWARD_PAST = '지난 레벨';
export const REWARD_CURRENT = '지금 레벨';
export const REWARD_FUTURE = '아직 잠겨 있어요';

export const UNLOCK_NAME: Record<UnlockId, string> = {
  house: '솔이네 집',
  pond: '연못',
  laundry: '빨래터',
  windmill: '풍차',
  plazaOutfit: '마을 광장 + 새 옷',
  jar: '장독대',
  well: '우물',
  orchard: '과수원',
  mill: '방앗간',
  festivalOutfit: '마을 축제 + 새 옷',
  pavilion: '정자',
  observatory: '별 관측대',
};

/** 표에 없는 레벨(Lv.13~)에서 해금 칸에 쓰는 문구 */
export const UNLOCK_NONE = '새 소식을 기다려유';

/** 보상표 줄 접근성 라벨: "Lv.7, 월급 160, 기력 +12, 우물, 지금 레벨" */
export const rewardRowA11y = (level: number, salary: number, energy: number, unlock: string, status: string) =>
  `Lv.${level}, ${REWARD_COIN_LABEL} ${salary}, ${REWARD_ENERGY_LABEL} +${energy}, ${unlock}, ${status}`;
