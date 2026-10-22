import { SKINS } from '../../../domain/harvest';
import type { PlotSlot, Weather } from '../../../domain/types';
import { workColor } from '../../theme';
import { cropIconSvg } from '../crops';
import { ijangSvg } from '../ijang';
import { FACES, faceSvg, npcSvg } from '../neighbors';
import { buildingSvg } from '../skins';
import { soliSkinBackSvg, soliSkinSvg, soliSvg } from '../soli';
import { villageSceneSvg, type VillageSceneParams } from '../village';

const base: VillageSceneParams = {
  timeOfDay: 'night',
  weather: 'cloud',
  plots: [null, null, null, null, null],
  soliMood: 'normal',
  visitors: [],
  board: [],
  boardToday: false,
  lanternOn: false,
  bloom: 0,
};

const bad = /NaN|undefined|\[object/;

describe('character svg', () => {
  it.each(['tired', 'normal', 'happy'] as const)('soli %s', (m) => {
    expect(soliSvg(m)).not.toMatch(bad);
  });

  it.each(['base', 'meh', 'cast', 'smile'] as const)('ijang %s', (m) => {
    expect(ijangSvg(m)).not.toMatch(bad);
  });

  it.each(SKINS.map((s) => [s.id, s.category] as const))('skin %s (%s)', (id, category) => {
    const art =
      category === 'soli' ? soliSkinBackSvg(id) + soliSkinSvg(id) : category === 'building' ? buildingSvg(id) : ijangSvg('base', id);
    expect(art.length).toBeGreaterThan(50);
    expect(art).not.toMatch(bad);
  });

  it('neighbors', () => {
    expect(npcSvg('#FFB3C7', 'bun', true)).not.toMatch(bad);
    expect(FACES).toHaveLength(12);
    FACES.forEach((f) => expect(faceSvg(f)).not.toMatch(bad));
  });

  it('crop icons', () => {
    (['sunflower', 'strawberry', 'coffee', 'mushroom', 'potato'] as const).forEach((k) =>
      expect(cropIconSvg(k)).not.toMatch(bad),
    );
  });
});

describe('village scene', () => {
  it.each(['sun', 'cloud', 'over', 'rain', 'storm'] satisfies Weather[])('weather %s', (weather) => {
    for (const timeOfDay of ['day', 'night'] as const) {
      expect(villageSceneSvg({ ...base, weather, timeOfDay })).not.toMatch(bad);
    }
  });

  it('draws every crop at every stage', () => {
    const plots: PlotSlot[] = [
      { crop: 'sunflower', stage: 3 },
      { crop: 'strawberry', stage: 3 },
      { crop: 'coffee', stage: 2 },
      { crop: 'mushroom', stage: 3 },
      { crop: 'potato', stage: 1 },
    ];
    expect(villageSceneSvg({ ...base, plots })).not.toMatch(bad);
  });

  it('board: 빈 게시판 쪽지 / 쪽지 이름 이스케이프 · 길면 말줄임 / 오늘 도장', () => {
    expect(villageSceneSvg(base)).toContain('붙일 게 없슈.');
    const one = villageSceneSvg({ ...base, board: [{ type: 'birth', dday: 'D-1', name: '엄마&아빠' }] });
    expect(one).toContain('엄마&amp;아빠');
    expect(one).not.toContain('붙일 게 없슈.');
    expect(villageSceneSvg({ ...base, board: [{ type: 'travel', dday: 'D-7', name: '아주아주긴여행이름' }] })).toContain('아주아주긴…');
    expect(villageSceneSvg({ ...base, board: [{ type: 'travel', dday: 'D-DAY', name: 'x' }], boardToday: true })).toContain('오늘!');
  });

  it('fit mode anchors to the ground', () => {
    expect(villageSceneSvg(base, 'meet')).toContain('preserveAspectRatio="xMidYMax meet"');
  });
});

describe('workColor', () => {
  it('goes from yellow to red as work rises', () => {
    expect(workColor(0)).toBe('#FFC23C');
    expect(workColor(100)).toBe('#FF5A4A');
  });
});
