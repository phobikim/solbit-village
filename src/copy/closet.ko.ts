// 옷장 탭의 이장 말풍선 · 하단 액션 버튼 · 미리보기 칩 문구. 코드에 하드코딩하지 않는다.

/** 이장 말풍선 */
export const BUBBLE_DEFAULT = '오늘은 뭘 입어 보시려유?';
export const BUBBLE_NOT_OWNED = '돈 모은 만큼만 사유.';
export const BUBBLE_BOUGHT = '잘 어울리네유.';

/** 미리보기 카드의 "원래대로" 칩 */
export const PREVIEW_RESET = '원래대로';

export const ACTION_BUY = (price: string) => `구매하기 · ${price}`;
export const ACTION_SHORT = (lack: string) => `코인이 모자라요 · -${lack}`;
export const ACTION_EQUIP = '갈아입기';
export const ACTION_EQUIPPED = '착용 중';
export const ACTION_TAKE_OFF = '벗기';
