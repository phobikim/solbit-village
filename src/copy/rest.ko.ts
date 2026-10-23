// 쉼터 문구 (디자인 v6 12c · 12d). 이장 말투는 충청도 사투리.

import { WEATHER_NAME } from './labels.ko';
import type { FireBand, RestSize, RestTagKind } from '../domain/fire';
import type { LeisureBand } from '../domain/indices';
import type { Weather } from '../domain/types';

/** 쉼터 방송 (withPrefix로 "아아, 이장이유."를 붙여 쓴다). 불 상태에 따라 바뀐다. */
export const REST_BROADCAST: Record<FireBand | 'none', string> = {
  none: '모닥불이 아직 안 피었슈. 장작 하나만 던져 보슈.',
  blaze: '모닥불이 활활 타유. 이장도 쬐러 왔슈.',
  burning: '모닥불 잘 타네유. 이대로만 쉬슈.',
  dying: '모닥불이 사그라들어유. 장작 하나만 넣어유.',
  out: '모닥불이 꺼져가유. 장작 좀 갖다 넣어유.',
};
/** 지도 방송 */
export const MAP_BROADCAST = '발자국은 다녀온 데, 깃발은 갈 데유.';


/** 2 → 이틀째 … (열흘 넘으면 숫자) */
const NTH = ['', '하루', '이틀', '사흘', '나흘', '닷새', '엿새', '이레', '여드레', '아흐레', '열흘'];
export const dayNth = (n: number) => `${NTH[n] ?? `${n}일`}째`;

/** 지침 신호 '일' 칸: 이틀 넘게 갈려나갔으면 며칠째, 아니면 일 상태 */
export const signalWork = (streak: number, status: string) => (streak >= 2 ? `${dayNth(streak)} 갈려나감` : status);

const SKY: Partial<Record<Weather, string>> = { over: '하늘은 흐리구', rain: '하늘은 비 오구', storm: '하늘은 폭풍 치구' };

/** 지침 신호 '쉼' (신호는 쉼 20 이하에서만 켜져 봉오리 · 잎만 남음뿐) */
const REST_PHRASE: Partial<Record<LeisureBand, string>> = { dying: '쉼은 사그라들구', out: '쉼은 꺼져가구' };

/** 지침 신호 이장 말풍선 */
export function signalLine(streak: number, weather: Weather, rest: LeisureBand): string {
  const work = streak >= 2 ? `일은 ${dayNth(streak)} 갈려나가구` : '일은 넘치구';
  return `${work}, ${REST_PHRASE[rest] ?? '쉼은 모자라구'}, ${SKY[weather] ?? `하늘은 ${WEATHER_NAME[weather]}이구`}. 이장이 보기엔 좀 쉬어야겄슈.`;
}

/** 마지막 쉼: 오늘 · 어제 · N일 전 */
export function lastRestLabel(daysAgo: number | null): string {
  if (daysAgo === null) return '아직 없음';
  return daysAgo === 0 ? '오늘' : daysAgo === 1 ? '어제' : `${daysAgo}일 전`;
}

const MONTHS = ['', '한 달', '두 달', '석 달', '넉 달'];
/** 얼마나 됐나: 오늘 / N일 / N주 / 석 달 / N년 (말 끝에 붙는 "지 ~ 됐슈"의 ~ 부분) */
export function spanLabel(days: number): string {
  if (days === 0) return '오늘';
  if (days < 7) return `${days}일`;
  if (days < 30) return `${Math.floor(days / 7)}주`;
  if (days < 365) {
    const m = Math.floor(days / 30);
    return MONTHS[m] ?? `${m}달`;
  }
  return `${Math.floor(days / 365)}년`;
}

/** 담아둔 지 얼마나: 오늘 담음 / 담아둔 지 N일 … */
export function keptLabel(days: number): string {
  return days === 0 ? '오늘 담음' : `담아둔 지 ${spanLabel(days)}`;
}

/** 깃발 꽂은 지 얼마나 (지도 15c) */
export const flagAgeLabel = (days: number) => (days === 0 ? '오늘 꽂음' : `깃발 꽂은 지 ${spanLabel(days)}`);
/** 오래된 깃발 말풍선 (디자인 15c) */
export const flagOldLine = (days: number) => `깃발이 ${spanLabel(days)}째 펄럭이는디. 바람 빠지기 전에 가봐유.`;

/** 다녀온 곳: 3박 4일 / 당일치기 */
export const tripLength = (nights: number) => (nights === 0 ? '당일치기' : `${nights}박 ${nights + 1}일`);

export const yearAgoLine = (place: string) => `1년 전 오늘, 솔이 씨는 ${place}에 있었슈. 이장은 마을에 있었구유.`;

/** 쉼 상태 카드 7칸 (월 ~ 일) */
export const WEEK_LABELS = ['월', '화', '수', '목', '금', '토', '일'] as const;
export const lastRestLine = (label: string) => `마지막 쉼 ${label}`;
export const visitCountLabel = (n: number) => `${n}번 감`;

export const restCopy = {
  signalTitle: '지침 신호',
  signalSub: '일·쉼이 겹쳤어요',
  suggestTitle: '오늘의 쉼 제안',
  statusTitle: '쉼 상태',
  add: '+ 남기기',
  wish: '가고 싶은 곳',
  visited: '다녀온 곳',
  filterAll: '전체',
  visitedBtn: '다녀왔슈',
  wishAgainBtn: '또 가고 싶슈',
  wishAgainDone: '가고 싶은 곳에 다시 담았슈.',
  wishAgainExists: '가고 싶은 곳에 이미 있슈.',
  scheduled: '날짜 잡힘',
  schedule: '날짜 잡기',
  wishEmpty: '아직 담아둔 곳이 없슈. + 남기기로 가고 싶은 곳을 담아 보슈.',
  wishFilterEmpty: '이 시간으로 갈 데는 아직 없슈.',
  visitedEmpty: '다녀온 곳을 적어두면 쉰 날로 쳐 드려유.',
  yearAgoTitle: '1년 전 오늘',
  placeNew: '가고 싶은 데 적어 주슈. 언제 갈진 몰라두 일단 담아유.',
  visitedNew: '다녀온 데 적어두슈. 다녀온 날은 쉰 날로 쳐 드려유.',
  scheduleNow: '언제 가실 거유? 날짜랑 몇 박인지 알려 주슈. 대소사에 올려 둘게유.',
  visitNow: '다녀오셨슈? 언제, 며칠 갔는지만 알려 주슈.',
  placeEdit: '고칠 거 있으면 고치슈.',
};

// ── 모닥불 (디자인 v8 15a) ──────────────────────────────────────────────

/** 불 상태 문구 (카드 큰 글씨) */
export const FIRE_LINE: Record<FireBand | 'none', string> = {
  none: '아직 불이 안 붙었슈',
  blaze: '불이 활활 타올라유',
  burning: '불이 잘 타고 있슈',
  dying: '불이 사그라들었슈',
  out: '불이 꺼져가유',
};
/** "쉼 지수 24 · 장작 안 들어온 지 4일" 뒤쪽 */
export const sinceFireLabel = (days: number | null) =>
  days === null ? '아직 장작이 없슈' : days === 0 ? '오늘 장작이 들어왔슈' : `장작 안 들어온 지 ${days}일`;

export const SIZE_LABEL: Record<RestSize, string> = { twig: '잔가지', firewood: '장작', log: '통나무' };
export const SIZE_HINT: Record<RestSize, string> = { twig: '한두 시간', firewood: '반나절', log: '하루 꼬박' };
export const TAG_KIND_LABEL: Record<RestTagKind, string> = { activity: '활동', neighbor: '이웃', place: '장소', etc: '기타' };

/** 쪽지 제안 (15a) */
export const noteCopy = {
  header: '보따리에서 꺼냄',
  intro: '불 꺼지기 전에 하나 던져봐유. 이장이 쪽지 하나 써놨슈.',
  other: '다른 쪽지',
  /** 마지막 쪽지까지 다 봤을 때 */
  noMore: '쪽지는 이게 다유. 내일 또 써 놓을게유.',
  /** 깃발이 하나도 없을 때 */
  empty: '보따리에 가고 싶은 곳이 없슈. 지도에서 깃발 하나 꽂아 보슈.',
};
const kept = (name: string, days: number) => (days === 0 ? `${name} 오늘 담은 곳이유.` : `${name} 담아둔 지 ${spanLabel(days)} 됐슈.`);
export const noteLine = (name: string, days: number, weekWord: string, dayName: string) =>
  `${kept(name, days)} ${weekWord} ${dayName} 비어 있던디, 어뗘유?`;
export const noteNoFreeDay = (name: string, days: number) => `${kept(name, days)} 주말은 일정이 찼으니 한가한 날 보슈.`;
export const noteButton = (dayName: string) => `${dayName}에 찜`;
export const DAY_NAME: Record<number, string> = { 6: '토요일', 0: '일요일' };

/** 장작 던지기 (15b) */
export const throwCopy = {
  title: '장작 던지기',
  bubble: '말하듯 한 줄 적어유. 이장이 태그로 알아들을게유.',
  prompt: '뭐 하고 쉬었슈?',
  placeholder: '예: 퇴근하고 서연이랑 한강 걷다가 떡볶이 먹음',
  recognized: '이장이 알아들은 거 · 틀리면 빼유',
  noTags: '아직 못 알아들었슈. 글을 더 적거나 + 장소로 넣어 보슈.',
  howLong: '얼마나 쉬었슈?',
  addPlace: '+ 장소',
  addPlaceHolder: '장소 이름',
  footprint: (name: string) => `${name}, 지도에 발자국 찍어둘게유`,
  footprintMany: (names: string[]) => `${names.join(' · ')}, 지도에 발자국 찍어둘게유`,
  throwBtn: '불에 던지기',
  throwing: '던지는 중…',
  need: '한 줄을 적어야 던질 수 있슈.',
  thrown: '타닥타닥. 장작 들어갔슈.',
};

/** 보따리 지도 (15c) */
export const mapCopy = {
  title: '보따리 지도',
  village: '솔빛 마을',
  footprints: '발자국',
  flags: '깃발',
  mapRow: (feet: number, flags: number) => `발자국 ${feet} · 깃발 ${flags}`,
  empty: '아직 비었슈. + 깃발로 갈 데를 꽂거나, 다녀온 데를 남겨 보슈.',
  addFlag: '+ 깃발',
  addFoot: '+ 발자국',
  pick: '핀을 눌러 보슈.',
  scheduleBtn: '날짜 잡기',
  scheduledTag: '날짜 잡힘',
  visitedBtn: '다녀왔슈',
  wishAgainBtn: '또 가고 싶슈',
};
