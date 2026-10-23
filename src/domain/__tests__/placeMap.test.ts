import { footprintPath, layoutPins, mapScale, PIN_GAP, VILLAGE_RADIUS } from '../placeMap';
import type { Place } from '../rest';

const place = (i: number, over: Partial<Place> = {}): Place => ({
  id: `p${String(i).padStart(3, '0')}`,
  name: `곳${i}`,
  duration: 'half',
  visited: false,
  memo: null,
  note: null,
  eventId: null,
  logId: null,
  visitedDate: null,
  nights: 0,
  addedDate: '2026-10-01',
  createdAt: i,
  ...over,
});
const many = (n: number) => Array.from({ length: n }, (_, i) => place(i));

describe('보따리 지도 자동 배치', () => {
  it('마을 중심에서 떨어져 놓이고, 어느 두 핀도 겹치지 않는다 (80곳까지)', () => {
    for (const n of [1, 2, 6, 20, 80]) {
      const pins = layoutPins(many(n));
      for (const p of pins) expect(Math.hypot(p.x, p.y)).toBeGreaterThanOrEqual(VILLAGE_RADIUS);
      let min = Infinity;
      for (let i = 0; i < pins.length; i++)
        for (let j = i + 1; j < pins.length; j++) min = Math.min(min, Math.hypot(pins[i].x - pins[j].x, pins[i].y - pins[j].y));
      if (n > 1) expect(min).toBeGreaterThanOrEqual(PIN_GAP * 0.9);
    }
  });
  it('같은 입력이면 같은 배치 (매번 흔들리지 않는다)', () => {
    expect(layoutPins(many(10)).map((p) => [p.x, p.y])).toEqual(layoutPins(many(10)).map((p) => [p.x, p.y]));
  });
  it('장소가 늘어도 이미 놓인 핀은 움직이지 않는다 · 입력 순서와 상관없다', () => {
    const a = layoutPins(many(5));
    const b = layoutPins([...many(8)].reverse());
    for (const p of a) {
      const q = b.find((x) => x.place.id === p.place.id)!;
      expect([q.x, q.y]).toEqual([p.x, p.y]);
    }
  });
  it('깃발이 발자국이 되어도 그 자리에 남는다', () => {
    const before = layoutPins(many(4));
    const moved = many(4).map((p) => (p.id === 'p002' ? { ...p, visited: true, visitedDate: '2026-10-20' } : p));
    const after = layoutPins(moved);
    expect(after.find((p) => p.place.id === 'p002')).toMatchObject({ x: before[2].x, y: before[2].y });
  });
  it('지도 칸에 맞게 줄인다 (키우지는 않는다)', () => {
    const pins = layoutPins(many(30));
    const s = mapScale(pins, 175, 190);
    expect(s).toBeLessThan(1);
    for (const p of pins) {
      expect(Math.abs(p.x * s)).toBeLessThanOrEqual(175);
      expect(Math.abs(p.y * s)).toBeLessThanOrEqual(190);
    }
    expect(mapScale(layoutPins(many(1)), 1000, 1000)).toBe(1);
  });
});

describe('다녀온 경로 (점선)', () => {
  it('마을에서 시작해 다녀온 날 순서대로, 깃발은 넣지 않는다', () => {
    const list = [
      place(0, { visited: true, visitedDate: '2026-08-01' }),
      place(1),
      place(2, { visited: true, visitedDate: '2026-05-01' }),
    ];
    const pins = layoutPins(list);
    const path = footprintPath(pins);
    expect(path).toHaveLength(3);
    expect(path[0]).toEqual({ x: 0, y: 0 });
    expect(path[1]).toEqual({ x: pins[2].x, y: pins[2].y }); // 5월이 먼저
    expect(path[2]).toEqual({ x: pins[0].x, y: pins[0].y });
  });
  it('다녀온 곳이 없으면 경로 없음', () => {
    expect(footprintPath(layoutPins(many(3)))).toEqual([]);
  });
});
