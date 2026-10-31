import { flagIconSvg, mapView, pinFlagSvg, placeMapFxSvg, placeMapSvg, type MapArtFlag, type MapArtInput } from '../placeMapArt';
import { fireHeight, fireSvg } from '../restIcons';

const bad = /NaN|undefined|\[object/;

const flag = (id: string, name: string, x: number, y: number, over: Partial<MapArtFlag> = {}): MapArtFlag => ({ id, name, kind: 'want', x, y, ...over });
const base = (over: Partial<MapArtInput> = {}): MapArtInput => ({ flags: [], islands: [], selectedId: null, ...over });

describe('보따리 지도 그림 (TURN 34·35 밤바다 위 솔빛 섬 · 핀 깃발)', () => {
  it('깃발이 없어도 그려진다 (섬 · 마을 이름표) — 발자국 · 범례의 "다녀옴" · 다녀온 길 점선은 없다', () => {
    const svg = placeMapSvg(base());
    expect(svg).not.toMatch(bad);
    expect(svg).toContain('솔빛 마을');
    expect(svg).not.toContain('다녀옴');
    expect(svg).not.toContain('stroke-dasharray');
  });

  it('깃발 이름이 모두 나온다 · 이름의 &는 이스케이프', () => {
    const svg = placeMapSvg(base({ flags: [flag('a', '사파', 128, 152), flag('b', '엄마&아빠', 248, 146)] }));
    expect(svg).not.toMatch(bad);
    expect(svg).toContain('>사파<');
    expect(svg).toContain('엄마&amp;아빠');
  });

  it('핀 깃발 3종: 분홍 / 노랑 / D-day 배지', () => {
    const want = pinFlagSvg({ name: '사파', kind: 'want' });
    expect(want).toContain('fill="#FF4FA0"');
    expect(want).not.toContain('#A8EB5A');
    const ij = pinFlagSvg({ name: '교토', kind: 'ijang' });
    expect(ij).toContain('fill="#FFE14D"');
    const date = pinFlagSvg({ name: '속초', kind: 'date', dday: 'D-3' });
    expect(date).toContain('>D-3<');
    expect(date).toContain('#A8EB5A');
    // 핀 모양: 바닥이 한 점
    expect(want).toContain('M0 0 C-3 -6 -15 -13 -15 -25 A15 15 0 1 1 15 -25 C15 -13 3 -6 0 0Z');
  });

  it('고른 깃발에는 선택 표시가 한 번만', () => {
    const f = [flag('a', '사파', 128, 152), flag('b', '속초', 248, 146)];
    const sel = placeMapSvg(base({ flags: f, selectedId: 'a' }));
    expect(sel.match(/fill-opacity="\.14"/g)).toHaveLength(1);
    expect(placeMapSvg(base({ flags: f })).match(/fill-opacity="\.14"/g)).toBeNull();
  });

  it('작은 섬은 있는 만큼만 그리고, 퍼지는 동그라미 · 새 섬 반짝임은 따로 그린다', () => {
    const none = placeMapSvg(base());
    const two = placeMapSvg(base({ islands: [{ cx: 296, cy: 62, fresh: true }, { cx: 70, cy: 350, fresh: false }] }));
    expect(two.length).toBeGreaterThan(none.length);
    expect(placeMapFxSvg(base())).toBeNull();
    expect(placeMapFxSvg(base({ islands: [{ cx: 296, cy: 62, fresh: false }] }))).toBeNull();
    const fresh = placeMapFxSvg(base({ islands: [{ cx: 296, cy: 62, fresh: true }] }));
    expect(fresh).toContain('#FFE14D');
    const ring = placeMapFxSvg(base({ flags: [flag('f', '교토', 270, 254, { kind: 'ijang' })] }));
    expect(ring?.match(/<circle/g)).toHaveLength(2);
    expect(placeMapFxSvg(base({ flags: [flag('f', '교토', 270, 254)] }))).toBeNull();
  });

  it('보이는 구간: 작은 섬이 없으면 위아래 30씩 덜어 내고(366x340), 생기면 넓힌다', () => {
    expect(mapView(0)).toEqual({ x: 0, y: 30, w: 366, h: 340 });
    expect(mapView(1)).toEqual({ x: 0, y: 0, w: 366, h: 370 });
    expect(mapView(2)).toEqual({ x: 0, y: 0, w: 366, h: 400 });
    expect(mapView(4).h).toBe(400);
    expect(placeMapSvg(base())).toContain('viewBox="0 30 366 340"');
    expect(placeMapFxSvg(base({ islands: [{ cx: 296, cy: 62, fresh: true }] }))).toContain('viewBox="0 0 366 370"');
  });

  it('깃발 카드 아이콘은 이름표 없이 핀만', () => {
    const icon = flagIconSvg('date', 'D-3');
    expect(icon).not.toMatch(bad);
    expect(icon).toContain('>D-3<');
    expect(icon).not.toContain('<text y="20.5"');
  });
});

describe('모닥불 그림', () => {
  it('불 상태마다 그려진다', () => {
    for (const b of ['blaze', 'burning', 'dying', 'out', null] as const) {
      expect(fireSvg(b)).not.toMatch(bad);
      expect(fireHeight(b)).toBeGreaterThan(0);
    }
    expect(fireHeight('blaze')).toBeGreaterThan(fireHeight('out'));
  });
});
