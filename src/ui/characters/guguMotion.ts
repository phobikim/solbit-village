// 구구 할매 움직임 (디자인 "5 쉼터 v2" 1a 개정): 불 세기대로 얼었다 녹았다 한다. 시안의 animateTransform / animate 값 그대로.
//  - 꺼짐: 몸이 덜덜 떨린다(0.25초에 좌우 2) · 눈을 깜빡인다
//  - 보통: 몸이 둥실(2.6초, 위로 3) · 고개를 두 번 끄덕이고 쉰다(5초) · 눈을 깜빡인다
//  - 뜨끈: 몸이 느리게 좌우로 흔들(4초, ±3도) · 고개가 살짝 기울었다 돌아온다(4초, 4도)
// react-native-svg는 SMIL을 못 그려서 GuguActor가 이 값으로 몸통 · 고개 · 눈꺼풀을 따로 움직인다. 길이는 viewBox 단위, 각도는 도.

import type { FireMood } from '../../domain/fire';

export type Track = {
  /** 한 바퀴 시간(ms) */
  duration: number;
  /** 0 ~ 1 구간 (키 시간) */
  input: readonly number[];
  /** 키마다의 값 */
  output: readonly number[];
};

export type GuguMotion = {
  body: { kind: 'translateX' | 'translateY' | 'rotate'; track: Track };
  /** 고개 끄덕임 (각도). 없으면 가만히 */
  head: Track | null;
  /** 눈꺼풀 투명도 (0 = 열림, 1 = 감음). 웃는 눈이면 없다 */
  blink: Track | null;
};

export function guguMotion(mood: FireMood): GuguMotion {
  const blink: Track = { duration: 4000, input: [0, 0.9, 0.94, 0.98, 1], output: [0, 0, 1, 0, 0] };
  if (mood === 'off') {
    return { body: { kind: 'translateX', track: { duration: 250, input: [0, 0.33, 0.66, 1], output: [0, -2, 2, 0] } }, head: null, blink };
  }
  if (mood === 'hot') {
    return {
      body: { kind: 'rotate', track: { duration: 4000, input: [0, 0.25, 0.5, 0.75, 1], output: [0, -3, 0, 3, 0] } },
      head: { duration: 4000, input: [0, 0.5, 1], output: [0, 4, 0] },
      blink: null,
    };
  }
  return {
    body: { kind: 'translateY', track: { duration: 2600, input: [0, 0.5, 1], output: [0, -3, 0] } },
    head: { duration: 5000, input: [0, 0.6, 0.7, 0.8, 0.9, 1], output: [0, 0, -6, 0, -6, 0] },
    blink,
  };
}
