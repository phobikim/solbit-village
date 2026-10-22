// 정리하기 (디자인 v7 TURN 13): 이웃 · 대소사 지우기 문구

import { eul } from './josa';

export const TIDY = '정리';
export const TIDY_DONE = '완료';
export const DELETE_KEEP = '놔두기';
export const DELETE_GO = '지우기';

export const deleteNeighborTitle = (name: string) => `${name} 씨를 지울까유?`;
export const DELETE_NEIGHBOR_LINE = '지우면 같이 쌓은 만남 기록도 싹 사라져유. 되돌릴 수 없슈.';

export const deleteEventTitle = (name: string) => `${eul(name)} 지울까유?`;
export const DELETE_EVENT_LINE = '지우면 게시판에서두 떼유. 되돌릴 수 없슈.';
