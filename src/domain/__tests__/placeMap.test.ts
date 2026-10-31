import {
  BIG_ISLAND_CAP,
  BIG_ISLAND_SLOTS,
  flagInfo,
  layoutIslands,
  MAP_CAPACITY,
  pushedFlag,
  SMALL_ISLAND_MAX,
  SMALL_ISLANDS,
  SMALL_SLOT_OFFSETS,
} from '../placeMap';
import type { VillageEvent } from '../events';
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
const at = (layout: ReturnType<typeof layoutIslands>, id: string) => layout.pins.find((p) => p.place.id === id)!;

describe('섬 규칙 (디자인 34i · 34j · 34k)', () => {
  it('큰 섬(솔빛 섬)에는 5곳까지 시안 자리에 놓인다', () => {
    const l = layoutIslands(many(5));
    expect(l.pins.map((p) => [p.x, p.y])).toEqual(BIG_ISLAND_SLOTS.map(([x, y]) => [x, y]));
    expect(l.pins.every((p) => p.island === -1)).toBe(true);
    expect(l.islands).toEqual([]);
    expect(l.overflow).toEqual([]);
  });

  it('여섯 번째 깃발부터 오른쪽 위에 작은 섬이 생긴다 (새 섬에 반짝임)', () => {
    const l = layoutIslands(many(6));
    expect(l.islands).toEqual([{ index: 0, cx: 296, cy: 62, count: 1, fresh: true }]);
    expect(at(l, 'p005').island).toBe(0);
    expect(at(l, 'p005').y).toBeLessThan(100); // 위쪽 섬
  });

  it('작은 섬 하나에는 1~2곳: 둘이 차면 다음 깃발은 왼쪽 아래 두 번째 섬', () => {
    const l7 = layoutIslands(many(7));
    expect(l7.islands).toHaveLength(1);
    expect(l7.islands[0]).toMatchObject({ count: 2, fresh: false }); // 첫 섬이 찼을 뿐 새로 생긴 섬이 아니다
    const l8 = layoutIslands(many(8));
    expect(l8.islands.map((i) => [i.index, i.cx, i.cy, i.count])).toEqual([
      [0, 296, 62, 2],
      [1, 70, 350, 1],
    ]);
    expect(l8.islands.map((i) => i.fresh)).toEqual([false, true]);
    expect(at(l8, 'p007').island).toBe(1);
    expect(at(l8, 'p007').y).toBeGreaterThan(300);
  });

  it('작은 섬은 오른쪽 위 → 왼쪽 아래 → (임시) 오른쪽 아래 → 왼쪽 위 순서로 큰 섬을 둘러 생긴다', () => {
    expect(SMALL_ISLANDS.map((s) => [s.cx, s.cy])).toEqual([
      [296, 62],
      [70, 350],
      [296, 350],
      [70, 62],
    ]);
    const l = layoutIslands(many(BIG_ISLAND_CAP + 2 * SMALL_ISLAND_MAX));
    expect(l.islands.map((i) => i.index)).toEqual([0, 1, 2, 3]);
    expect(l.islands.every((i) => i.count === 2)).toBe(true);
  });

  it('[미정] 작은 섬 4개가 다 찬 뒤 깃발은 지도에 놓지 않고 overflow로 돌려준다', () => {
    expect(MAP_CAPACITY).toBe(13);
    const l = layoutIslands(many(15));
    expect(l.pins).toHaveLength(13);
    expect(l.overflow.map((p) => p.id)).toEqual(['p013', 'p014']);
  });

  it('작은 섬 안 깃발은 두 자리 중 하나라 둘째가 들어와도 첫 깃발은 움직이지 않는다', () => {
    const one = layoutIslands(many(6));
    const two = layoutIslands(many(7));
    expect([at(two, 'p005').x, at(two, 'p005').y]).toEqual([at(one, 'p005').x, at(one, 'p005').y]);
    const { cx, cy } = SMALL_ISLANDS[0];
    expect([at(two, 'p005').x, at(two, 'p005').y]).toEqual([cx + SMALL_SLOT_OFFSETS[0][0], cy + SMALL_SLOT_OFFSETS[0][1]]);
    expect([at(two, 'p006').x, at(two, 'p006').y]).toEqual([cx + SMALL_SLOT_OFFSETS[1][0], cy + SMALL_SLOT_OFFSETS[1][1]]);
  });
});

describe('자리는 담은 순서(createdAt, id)로 정해진다', () => {
  it('같은 입력이면 같은 배치', () => {
    expect(layoutIslands(many(9)).pins.map((p) => [p.x, p.y])).toEqual(layoutIslands(many(9)).pins.map((p) => [p.x, p.y]));
  });
  it('깃발이 늘어도 이미 놓인 깃발은 움직이지 않는다 · 입력 순서와 상관없다', () => {
    const a = layoutIslands(many(7));
    const b = layoutIslands([...many(12)].reverse());
    for (const p of a.pins) {
      const q = at(b, p.place.id);
      expect([q.x, q.y, q.island]).toEqual([p.x, p.y, p.island]);
    }
  });
  it('담은 시각이 같으면 id 순서', () => {
    const l = layoutIslands([place(2, { id: 'b', createdAt: 1 }), place(1, { id: 'a', createdAt: 1 })]);
    expect(l.pins.map((p) => p.place.id)).toEqual(['a', 'b']);
  });
});

describe('다녀온 곳은 지도에 놓지 않는다 (visited=false만 배치)', () => {
  it('다녀온 곳은 자리를 차지하지 않는다', () => {
    const list = [...many(3), place(10, { visited: true, visitedDate: '2026-10-20' }), place(11, { visited: true, visitedDate: '2026-10-21' })];
    const l = layoutIslands(list);
    expect(l.pins.map((p) => p.place.id)).toEqual(['p000', 'p001', 'p002']);
    expect(layoutIslands(list.filter((p) => p.visited))).toEqual({ pins: [], islands: [], overflow: [] });
  });
  it('[다녀왔슈]로 깃발이 빠지면 뒤 깃발이 한 자리씩 당겨진다 (6번째가 큰 섬으로 돌아오면 작은 섬은 사라진다)', () => {
    const six = many(6);
    expect(layoutIslands(six).islands).toHaveLength(1);
    const after = six.map((p) => (p.id === 'p001' ? { ...p, visited: true, visitedDate: '2026-10-20' } : p));
    const l = layoutIslands(after);
    expect(l.islands).toEqual([]);
    expect(at(l, 'p005').island).toBe(-1);
  });
});

describe('깃발 종류: 가고 싶은 곳 / 이장이 미는 곳 / 날짜 잡은 곳', () => {
  const today = '2026-10-24';
  const ev = (id: string, date: string): VillageEvent => ({ id, name: '여행', date, type: 'travel', repeatYearly: false, createdAt: 0 });

  it('오래 담아둔(60일 이상) 가장 오래된 깃발만 이장이 민다 · 날짜 잡은 깃발은 뺀다', () => {
    const old = place(1, { addedDate: '2026-07-01', createdAt: 1 });
    const older = place(0, { addedDate: '2026-06-01', createdAt: 0, eventId: 'ev' });
    const fresh = place(2, { addedDate: '2026-10-20', createdAt: 2 });
    expect(pushedFlag([older, old, fresh], today)?.id).toBe(old.id);
    expect(pushedFlag([fresh], today)).toBeNull();
    expect(pushedFlag([place(3, { visited: true, addedDate: '2026-01-01' })], today)).toBeNull();
  });
  it('날짜가 잡혀 있으면 date + 남은 일수, 아니면 이장이 미는 곳 / 가고 싶은 곳', () => {
    const date = place(1, { eventId: 'ev1' });
    expect(flagInfo(date, [ev('ev1', '2026-10-27')], null, today)).toEqual({ kind: 'date', date: '2026-10-27', days: 3 });
    // 지난 행사는 날짜가 아니다
    expect(flagInfo(date, [ev('ev1', '2026-10-20')], null, today).kind).toBe('want');
    expect(flagInfo(place(2), [], 'p002', today).kind).toBe('ijang');
    expect(flagInfo(place(3), [], 'p002', today)).toEqual({ kind: 'want', date: null, days: null });
  });
});
