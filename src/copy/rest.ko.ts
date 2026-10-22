// 쉼터 문구 (디자인 v6 12c · 12d). 이장 말투는 충청도 사투리.

import { WEATHER_NAME } from './labels.ko';
import type { LeisureBand } from '../domain/indices';
import type { PlaceDuration } from '../domain/rest';
import type { Weather } from '../domain/types';

export const REST_BROADCAST = '쉬는 것도 일이유. 근디 이건 월급 안 나와유.';

/** 쉼터의 쉼 지수 상태 (마을 지수 카드의 꽃 이름과 따로) */
export const REST_LEVEL: Record<LeisureBand, string> = {
  full: '가득 참',
  half: '반쯤 참',
  bud: '바닥',
  none: '텅 빔',
};

export const PLACE_DURATION_LABEL: Record<PlaceDuration, string> = { short: '30분', half: '반나절', weekend: '주말' };

/** 2 → 이틀째 … (열흘 넘으면 숫자) */
const NTH = ['', '하루', '이틀', '사흘', '나흘', '닷새', '엿새', '이레', '여드레', '아흐레', '열흘'];
export const dayNth = (n: number) => `${NTH[n] ?? `${n}일`}째`;

/** 지침 신호 '일' 칸: 이틀 넘게 갈려나갔으면 며칠째, 아니면 일 상태 */
export const signalWork = (streak: number, status: string) => (streak >= 2 ? `${dayNth(streak)} 갈려나감` : status);

const SKY: Partial<Record<Weather, string>> = { over: '하늘은 흐리구', rain: '하늘은 비 오구', storm: '하늘은 폭풍 치구' };

/** 지침 신호 이장 말풍선 */
export function signalLine(streak: number, weather: Weather): string {
  const work = streak >= 2 ? `일은 ${dayNth(streak)} 갈려나가구` : '일은 넘치구';
  return `${work}, 쉼은 바닥이구, ${SKY[weather] ?? `하늘은 ${WEATHER_NAME[weather]}이구`}. 이장이 보기엔 좀 쉬어야겄슈.`;
}

/** 마지막 쉼: 오늘 · 어제 · N일 전 */
export function lastRestLabel(daysAgo: number | null): string {
  if (daysAgo === null) return '아직 없음';
  return daysAgo === 0 ? '오늘' : daysAgo === 1 ? '어제' : `${daysAgo}일 전`;
}

const MONTHS = ['', '한 달', '두 달', '석 달', '넉 달'];
/** 담아둔 지 얼마나: 오늘 / N일 / N주 / 석 달 / N년 */
export function keptLabel(days: number): string {
  if (days === 0) return '오늘 담음';
  if (days < 7) return `담아둔 지 ${days}일`;
  if (days < 30) return `담아둔 지 ${Math.floor(days / 7)}주`;
  if (days < 365) {
    const m = Math.floor(days / 30);
    return `담아둔 지 ${MONTHS[m] ?? `${m}달`}`;
  }
  return `담아둔 지 ${Math.floor(days / 365)}년`;
}

/** 다녀온 곳: 3박 4일 / 당일치기 */
export const tripLength = (nights: number) => (nights === 0 ? '당일치기' : `${nights}박 ${nights + 1}일`);

export const yearAgoLine = (place: string) => `1년 전 오늘, 솔이 씨는 ${place}에 있었슈. 이장은 마을에 있었구유.`;

export const restCopy = {
  signalTitle: '지침 신호',
  signalSub: '일·쉼이 겹쳤어요',
  suggestTitle: '오늘의 쉼 제안',
  suggestEmpty: '보따리에 가고 싶은 곳을 담아두면, 여기서 이장이 골라 드려유.',
  bundleTitle: '보따리',
  seeAll: '전체 보기 ›',
  wish: '가고 싶은 곳',
  visited: '다녀온 곳',
  scheduled: '날짜 잡힘',
  schedule: '날짜 잡기',
  wishEmpty: '아직 담아둔 곳이 없슈. 보따리 전체 보기에서 + 로 가고 싶은 곳을 담아 보슈.',
  visitedEmpty: '다녀온 곳을 적어두면 1년 뒤에 이장이 꺼내 드려유.',
  yearAgoTitle: '1년 전 오늘',
  placeNew: '보따리에 담을 곳 적어 주슈. 언제 갈진 몰라두 일단 담아유.',
  placeEdit: '고칠 거 있으면 고치슈.',
};
