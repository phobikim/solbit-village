// 솔이네 옷장 화면 문구. 코드에 하드코딩하지 않는다.

import type { Slot } from '../domain/outfit';

/** 이장 방송 */
export const OUTFIT_BROADCAST = '오늘은 뭘 입을 거유?';

export const OUTFIT_GO = '이대로 가기';
export const OUTFIT_STRIP = '전부 벗기';

export const SLOT_LABEL: Record<Slot, string> = {
  head: '머리',
  face: '얼굴',
  body: '몸',
  back: '등',
  hand: '손',
  feet: '발',
};

/** 슬롯의 "없음" 칸 (그 슬롯을 벗는다) */
export const OUTFIT_NONE = '없음';
/** 아직 없는 옷 칸의 접근성 라벨 뒤에 붙는다 */
export const OUTFIT_LOCKED_SUFFIX = ', 잠김';
export const OUTFIT_PAGE = '페이지';
export const OUTFIT_PREVIEW_LABEL = '솔이 미리보기';

export const OUTFIT_NAME: Record<string, string> = {
  'head-headphones': '회색 헤드폰',
  'head-straw': '밀짚모자',
  'head-beanie': '비니',
  'head-wizard': '마법사 모자',
  'head-catears': '고양이 귀 머리띠',
  'face-glasses': '동그란 안경',
  'face-heart': '하트 선글라스',
  'face-star': '별 스티커',
  'body-scarf': '스카프',
  'body-overall': '멜빵 오버올',
  'body-raincoat': '노란 우비',
  'body-sweater': '줄무늬 스웨터',
  'body-hoodie': '후드티',
  'body-plaid': '체크남방',
  'back-wings': '작은 천사 날개',
  'back-cape': '망토',
  'back-crossbag': '크로스백',
  'back-bundle': '보따리',
  'hand-coffee': '커피컵',
  'hand-umbrella': '접힌 우산',
  'hand-balloon': '풍선',
  'hand-book': '작은 책',
  'feet-boots': '노란 장화',
  'feet-sneakers': '핑크 스니커즈',
  'feet-slippers': '털 슬리퍼',
};

export const DEV_OUTFIT_TITLE = '개발자 · 복장 고르기';
export const DEV_OUTFIT_SUB = '아침 세 번째 화면 확인용';
