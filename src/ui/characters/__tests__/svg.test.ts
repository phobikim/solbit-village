import type { PlotSlot, Weather } from '../../../domain/types';
import { workColor } from '../../theme';
import { cropIconSvg } from '../crops';
import { ijangSvg } from '../ijang';
import { FACES, faceSvg, npcSvg } from '../neighbors';
import { soliSvg } from '../soli';
import { villageSceneSvg, type VillageSceneParams } from '../village';

const base: VillageSceneParams = {
  timeOfDay: 'night',
  weather: 'cloud',
  plots: [null, null, null, null, null],
  soliMood: 'normal',
  visitors: [],
  bannerText: null,
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

  it('banner only when there is an event, text escaped', () => {
    expect(villageSceneSvg(base)).not.toContain('<text');
    expect(villageSceneSvg({ ...base, bannerText: '엄마 & 아빠 <D-1>' })).toContain('엄마 &amp; 아빠 &lt;D-1&gt;');
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
