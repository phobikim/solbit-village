// 디자인 토큰 (design/ 6e 기준). 색·폰트·간격은 여기서만 정의한다.

export const colors = {
  night: '#141A3E',
  nightOuter: '#0D1130',
  card: '#232B60',
  cardSub: '#1E2558',
  track: '#2E3775',
  barTrack: '#2A3270',
  day: '#EAF6FF',
  line: '#10142E',
  text: '#FFFFFF',
  textSub: '#C9CEF5',
  textMuted: '#8F96CC',
  tabInactive: '#7D84B8',
  pink: '#FF4FA0',
  pinkShadow: '#B32A6E',
  pinkSoft: '#FF8CC6',
  yellow: '#FFE14D',
  health: '#5FD8FF',
  workLow: '#FFC23C',
  workMid: '#FF9A3C',
  workHigh: '#FF5A4A',
  relation: '#A8EB5A',
  leisure: '#C49BFF',
} as const;

/** 일 지수는 높을수록 빨강 쪽 (#FFC23C → #FF5A4A) */
export function workColor(value: number): string {
  const t = Math.min(1, Math.max(0, value / 100));
  const from = [0xff, 0xc2, 0x3c];
  const to = [0xff, 0x5a, 0x4a];
  const c = from.map((f, i) => Math.round(f + (to[i] - f) * t));
  return `#${c.map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase()}`;
}

// RN은 커스텀 폰트의 굵기를 fontWeight로 고를 수 없어 굵기별로 이름을 따로 둔다.
export const fonts = {
  title: 'BagelFatOne',
  body: 'NanumSquareRound',
  bodyBold: 'NanumSquareRoundB',
  bodyHeavy: 'NanumSquareRoundEB',
  number: 'Fredoka-SemiBold',
  numberBold: 'Fredoka-Bold',
  sfx: 'Gaegu-Bold',
} as const;

export const fontFiles = {
  [fonts.title]: require('../../assets/fonts/BagelFatOne-Regular.ttf'),
  [fonts.body]: require('../../assets/fonts/NanumSquareRoundR.ttf'),
  [fonts.bodyBold]: require('../../assets/fonts/NanumSquareRoundB.ttf'),
  [fonts.bodyHeavy]: require('../../assets/fonts/NanumSquareRoundEB.ttf'),
  [fonts.number]: require('../../assets/fonts/Fredoka-SemiBold.ttf'),
  [fonts.numberBold]: require('../../assets/fonts/Fredoka-Bold.ttf'),
  [fonts.sfx]: require('../../assets/fonts/Gaegu-Bold.ttf'),
};

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
} as const;

export const radius = {
  card: 22,
  scene: 28,
  index: 20,
  pill: 999,
} as const;
