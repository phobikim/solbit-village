import { guguBaseInner, guguFxInner, guguHeadInner, guguInner, guguLidsInner, guguSvg } from '../gugu';
import { guguMotion } from '../guguMotion';
import { dayWoodSvg } from '../restIcons';
import { restSceneFxSvg, restSceneSvg } from '../restScene';
import { TAB_ICONS } from '../tabIcons';

const bad = /NaN|undefined|\[object/;
const MOODS = ['off', 'mid', 'hot'] as const;

describe('구구 할매 (쉼터 NPC)', () => {
  it('불 세기 3가지가 모두 그려진다 · 몸 색이 다르다', () => {
    const bodies = MOODS.map((m) => guguSvg(m));
    for (const s of bodies) expect(s).not.toMatch(bad);
    expect(new Set(bodies).size).toBe(3);
    expect(bodies[0]).toContain('#3D6DB8'); // 꺼짐: 파랗게
    expect(bodies[1]).toContain('#4E5590');
    expect(bodies[2]).toContain('#C24A6E'); // 뜨끈: 발갛게
  });
  it('꺼지면 땀 · 떨림, 뜨끈하면 볼이 빨갛고 웃는 눈 + 김', () => {
    expect(guguSvg('off')).toContain('#BDEBFF');
    expect(guguSvg('hot')).toContain('#FF3B4E');
    expect(guguSvg('hot')).not.toContain('r="11" fill="#FFFFFF"'); // 웃는 눈은 동그란 눈이 아니다
    expect(guguFxInner('hot')).toContain('M66 4');
    expect(guguFxInner('mid')).toBeNull();
    expect(guguFxInner('off')).toBeNull();
  });
});

describe('구구 할매 움직임 (디자인 5 쉼터 v2 개정)', () => {
  it('몸통 + 고개로 나뉜 그림이 한 장 그림과 같다 (끄덕임은 고개만)', () => {
    for (const m of MOODS) {
      expect(guguInner(m)).toBe(guguBaseInner(m) + guguHeadInner(m));
      expect(guguBaseInner(m)).not.toContain('#FF4FA0'); // 목도리는 고개 쪽
      expect(guguHeadInner(m)).toContain('#FF4FA0');
    }
  });
  it('눈꺼풀: 뜬 눈(꺼짐 · 보통)만, 웃는 눈(뜨끈)은 없다', () => {
    expect(guguLidsInner('off')).toContain('#3D6DB8');
    expect(guguLidsInner('mid')).toContain('#4E5590');
    expect(guguLidsInner('hot')).toBeNull();
  });
  it('꺼짐: 0.25초 떨림 + 깜빡임 / 보통: 둥실 2.6초 + 끄덕 5초 + 깜빡임 / 뜨끈: 흔들 4초 + 기울임 4초', () => {
    const off = guguMotion('off');
    expect(off.body).toMatchObject({ kind: 'translateX', track: { duration: 250, output: [0, -2, 2, 0] } });
    expect(off.head).toBeNull();
    expect(off.blink?.duration).toBe(4000);
    const mid = guguMotion('mid');
    expect(mid.body).toMatchObject({ kind: 'translateY', track: { duration: 2600, output: [0, -3, 0] } });
    expect(mid.head).toMatchObject({ duration: 5000, output: [0, 0, -6, 0, -6, 0] });
    const hot = guguMotion('hot');
    expect(hot.body).toMatchObject({ kind: 'rotate', track: { duration: 4000, output: [0, -3, 0, 3, 0] } });
    expect(hot.head).toMatchObject({ duration: 4000, output: [0, 4, 0] });
    expect(hot.blink).toBeNull();
  });
  it('모든 키는 입력 0 ~ 1이 오름차순이고 값 개수가 같다', () => {
    for (const m of MOODS) {
      const g = guguMotion(m);
      for (const t of [g.body.track, g.head, g.blink]) {
        if (!t) continue;
        expect(t.input).toHaveLength(t.output.length);
        expect(t.input[0]).toBe(0);
        expect(t.input[t.input.length - 1]).toBe(1);
        expect([...t.input]).toEqual([...t.input].sort((a, b) => a - b));
      }
    }
  });
});

describe('쉼터 풍경 (디자인 1a)', () => {
  it('366 x 280 칸에 밤하늘 · 불 · 구구 할매가 그려진다', () => {
    for (const m of MOODS) {
      const s = restSceneSvg(m);
      expect(s).not.toMatch(bad);
      expect(s).toContain('viewBox="0 0 366 280"');
      expect(s).toContain('#0F1636'); // 밤하늘
      expect(s).not.toContain('#FF4FA0'); // 구구 할매는 따로 움직여서 풍경 그림에는 없다
    }
  });
  it('불이 꺼지면 불꽃 대신 연기 · 차가운 통나무, 뜨끈하면 불이 더 크다', () => {
    const off = restSceneSvg('off');
    expect(off).not.toContain('#FF9A3C');
    expect(off).toContain('#3A3F6B');
    expect(restSceneSvg('mid')).toContain('#FF9A3C');
    const scale = (s: string) => Number(/scale\(([\d.]+)\)">\s*<path d="M20 2C/.exec(s)?.[1] ?? 0);
    expect(scale(restSceneSvg('hot'))).toBeGreaterThan(scale(restSceneSvg('mid')));
  });
  it('깜빡이는 층: 꺼지면 없고, 뜨끈하면 할매 김까지', () => {
    expect(restSceneFxSvg('off')).toBeNull();
    expect(restSceneFxSvg('mid')).toContain('#FFE14D');
    expect(restSceneFxSvg('mid')).not.toContain('M66 4');
    expect(restSceneFxSvg('hot')).toContain('M66 4');
  });
});

describe('요일 칸 장작 그림', () => {
  it('잔가지 · 장작 · 통나무 · 빈 칸', () => {
    for (const k of ['twig', 'firewood', 'log', 'empty'] as const) expect(dayWoodSvg(k)).not.toMatch(bad);
    expect(dayWoodSvg('log')).toContain('#7A4A2E');
    expect(dayWoodSvg('empty')).toContain('stroke-dasharray');
  });
});

describe('하단 바 아이콘 (시트 9)', () => {
  it('탭 5개 모두 컬러 아이콘이 있고, 글자 없이 그림만이다', () => {
    expect(Object.keys(TAB_ICONS).sort()).toEqual(['me', 'neighbors', 'records', 'rest', 'village']);
    for (const paths of Object.values(TAB_ICONS)) {
      expect(paths.length).toBeGreaterThanOrEqual(4);
      expect(paths.some((p) => p.fill !== 'none' && p.fill !== '#10142E')).toBe(true);
      for (const p of paths) expect(p.d).toMatch(/^M/);
    }
  });
  it('쉼터는 모닥불(주황 불꽃 + 통나무), 마을은 초가집(노랑 지붕)', () => {
    expect(TAB_ICONS.rest[0].fill).toBe('#FF9A3C');
    expect(TAB_ICONS.rest.filter((p) => p.fill === '#B0703F')).toHaveLength(2);
    expect(TAB_ICONS.village.some((p) => p.fill === '#FFC23C')).toBe(true);
  });
});
