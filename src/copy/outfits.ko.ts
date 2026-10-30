// 꾸미기(솔이 옷 · 마을 배경) 화면 제목 · 옷 이름 문구. 코드에 하드코딩하지 않는다. 이장 말풍선 · 버튼 문구는 closet.ko.ts.

import type { Slot } from '../domain/outfit';

export const CLOSET_TITLE = '꾸미기';
export const CLOSET_PREVIEW_LABEL = '솔이 미리보기';

/** 나 탭의 꾸미기 줄. 부제는 임시 문구다 ([제안]) */
export const CLOSET_ROW_TITLE = '꾸미기';
export const CLOSET_ROW_SUB = '솔이 옷 · 마을 배경';

export const SLOT_LABEL: Record<Slot, string> = {
  head: '머리',
  face: '얼굴',
  body: '몸',
  back: '등',
  hand: '손',
  feet: '발',
};

/** 칸 접근성 라벨 */
export const cellA11y = (name: string, state: { wearing?: boolean; selected?: boolean; owned: boolean; price?: string }) =>
  [name, state.wearing ? '입는 중' : '', state.selected ? '선택함' : '', state.owned ? '' : `${state.price ?? ''} 코인, 안 가짐`]
    .filter(Boolean)
    .join(', ');

export const OUTFIT_NAME: Record<string, string> = {
  'head-beanie': '비니',
  'head-catears': '고양이 귀',
  'head-wizard': '마법사 모자',
  'head-straw': '밀짚모자',
  'head-headphones': '헤드폰',
  'face-glasses': '안경',
  'face-heart': '하트',
  'face-star': '별',
  'body-hoodie': '후드티',
  'body-plaid': '체크남방',
  'body-sweater': '스웨터',
  'body-scarf': '목도리',
  'body-raincoat': '우비',
  'body-overall': '멜빵바지',
  'back-bundle': '보따리',
  'back-crossbag': '크로스백',
  'back-cape': '망토',
  'back-wings': '날개',
  'hand-umbrella': '우산',
  'hand-coffee': '커피',
  'hand-book': '책',
  'hand-balloon': '풍선',
  'feet-slippers': '슬리퍼',
  'feet-sneakers': '운동화',
  'feet-boots': '부츠',
};
