import { MAIN_ISLAND, placeMapSvg, type MapArtPin, type MapArtInput } from '../placeMapArt';
import { fireHeight, fireSvg } from '../restIcons';

const bad = /NaN|undefined|\[object/;

const pin = (id: string, name: string, x: number, y: number, over: Partial<MapArtPin> = {}): MapArtPin => ({ id, name, x, y, visited: false, pushed: false, ...over });
const base = (over: Partial<MapArtInput> = {}): MapArtInput => ({
  w: 356,
  h: 400,
  center: { x: 178, y: 200 },
  pins: [],
  trail: [],
  filter: 'all',
  selectedId: null,
  ...over,
});
const pins = [
  pin('a', '한강', 180, 130, { visited: true }),
  pin('b', '담양', 150, 290, { visited: true }),
  pin('c', '제주', 70, 340, { visited: true }),
  pin('d', '사파', 40, 90),
  pin('e', '속초', 240, 150),
  pin('f', '교토', 310, 300, { pushed: true }),
];
const trail = [{ x: 178, y: 200 }, { x: 70, y: 340 }, { x: 150, y: 290 }, { x: 180, y: 130 }];

describe('보따리 지도 그림 (15d 밤바다 위 솔빛 섬)', () => {
  it('핀이 없어도 그려진다 (섬 · 마을 · 나침반 · 범례)', () => {
    const svg = placeMapSvg(base());
    expect(svg).not.toMatch(bad);
    expect(svg).toContain('viewBox="0 0 356.0 400.0"');
    expect(svg).toContain('솔빛 마을');
    expect(svg).toContain('다녀옴');
    expect(svg).toContain('갈 데');
  });

  it('핀 이름이 모두 나온다 · 이름의 &는 이스케이프', () => {
    const svg = placeMapSvg(base({ pins: [...pins, pin('g', '엄마&아빠', 120, 60)], trail }));
    expect(svg).not.toMatch(bad);
    for (const n of ['한강', '담양', '제주', '사파', '속초', '교토']) expect(svg).toContain(n);
    expect(svg).toContain('엄마&amp;아빠');
  });

  it('필터: 발자국만 / 깃발만', () => {
    const foot = placeMapSvg(base({ pins, trail, filter: 'foot' }));
    expect(foot).toContain('한강');
    expect(foot).not.toContain('>사파<');
    expect(foot).not.toContain('>교토<');
    const flag = placeMapSvg(base({ pins, trail, filter: 'flag' }));
    expect(flag).toContain('>사파<');
    expect(flag).not.toContain('>한강<');
  });

  it('이장이 미는 깃발은 노란 깃발 + 퍼지는 동그라미, 다른 깃발은 분홍', () => {
    const svg = placeMapSvg(base({ pins: [pin('f', '교토', 310, 300, { pushed: true })] }));
    expect(svg).toContain('#FFE14D'); // 노란 깃발
    expect(svg).toContain('opacity=".55"'); // 퍼지는 동그라미
    const pink = placeMapSvg(base({ pins: [pin('d', '사파', 40, 90)] }));
    expect(pink).toContain('#FF4FA0');
    expect(pink).not.toContain('opacity=".55"');
  });

  it('같은 입력이면 같은 그림 (섬 모양이 매번 바뀌지 않는다)', () => {
    expect(placeMapSvg(base({ pins, trail }))).toBe(placeMapSvg(base({ pins, trail })));
  });

  it('가운데 섬 밖의 핀 아래에만 작은 섬이 깔린다', () => {
    const inside = placeMapSvg(base({ pins: [pin('a', '한강', 178, 150, { visited: true })] }));
    const outside = placeMapSvg(base({ pins: [pin('c', '제주', 40, 360, { visited: true })] }));
    const count = (s: string) => (s.match(/stroke-width="3.5"/g) ?? []).length;
    expect(count(outside)).toBeGreaterThan(count(inside));
    expect(MAIN_ISLAND.rx).toBeGreaterThan(0);
  });

  it('선택한 핀에는 하얀 고리', () => {
    const on = placeMapSvg(base({ pins, trail, selectedId: 'a' }));
    const off = placeMapSvg(base({ pins, trail }));
    expect(on.split('stroke="#FFFFFF"').length).toBeGreaterThan(off.split('stroke="#FFFFFF"').length);
  });
});

describe('모닥불 그림 (15a)', () => {
  it('상태마다 그려지고 높이는 불이 작을수록 낮다', () => {
    for (const band of ['blaze', 'burning', 'dying', 'out', null] as const) {
      expect(fireSvg(band)).not.toMatch(bad);
    }
    expect(fireHeight('blaze')).toBeGreaterThan(fireHeight('dying'));
    expect(fireHeight('dying')).toBeGreaterThan(fireHeight('out'));
    expect(fireHeight('blaze')).toBeLessThanOrEqual(140);
    expect(fireSvg('dying')).toContain('rotate(7 100 118)'); // 엇갈린 통나무
  });
});
