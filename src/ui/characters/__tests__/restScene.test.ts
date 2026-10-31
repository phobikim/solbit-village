import { guguFxInner, guguSvg } from '../gugu';
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

describe('쉼터 풍경 (디자인 1a)', () => {
  it('366 x 280 칸에 밤하늘 · 불 · 구구 할매가 그려진다', () => {
    for (const m of MOODS) {
      const s = restSceneSvg(m);
      expect(s).not.toMatch(bad);
      expect(s).toContain('viewBox="0 0 366 280"');
      expect(s).toContain('#0F1636'); // 밤하늘
      expect(s).toContain('#FF4FA0'); // 할매 목도리
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
