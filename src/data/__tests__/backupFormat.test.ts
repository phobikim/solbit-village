import { backupFileName, buildBackup, parseBackup } from '../backupFormat';

describe('백업 형식', () => {
  const good = buildBackup(
    4,
    {
      day_record: [{ date: '2026-10-21', condition: 2, work: 1, achievement: null, memo: '메모', leisure: '[]', created_at: 1, updated_at: 1 }],
      settings: [
        { key: 'news_alarm_time', value: '08:00' },
        { key: 'news_seen_date', value: '2026-10-21' },
      ],
    },
    new Date('2026-10-21T00:00:00Z'),
  );

  it('내보낸 것을 그대로 가져올 수 있다', () => {
    const r = parseBackup(JSON.stringify(good), 4);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.backup.tables.day_record?.[0].memo).toBe('메모');
  });

  it('이 기기에서 오늘 소식을 본 날은 가져오지 않는다', () => {
    const r = parseBackup(JSON.stringify(good), 4);
    if (!r.ok) throw new Error();
    expect(r.backup.tables.settings).toEqual([{ key: 'news_alarm_time', value: '08:00' }]);
  });

  it('JSON이 아니거나 우리 앱 백업이 아니면 거절', () => {
    expect(parseBackup('{', 4)).toEqual({ ok: false, reason: 'notJson' });
    expect(parseBackup(JSON.stringify({ app: 'other', schemaVersion: 1, tables: {} }), 4)).toEqual({ ok: false, reason: 'notOurs' });
  });

  it('지금 앱보다 새 버전 백업은 거절', () => {
    expect(parseBackup(JSON.stringify({ ...good, schemaVersion: 5 }), 4)).toEqual({ ok: false, reason: 'tooNew' });
  });

  it('모르는 테이블·열은 버리고, 값이 이상하면 거절', () => {
    const extra = { ...good, tables: { ...good.tables, hacked: [{ x: 1 }], inventory: [{ crop: 'potato', qty: 3, evil: 'DROP' }] } };
    const r = parseBackup(JSON.stringify(extra), 4);
    if (!r.ok) throw new Error();
    expect(r.backup.tables).not.toHaveProperty('hacked');
    expect(r.backup.tables.inventory).toEqual([{ crop: 'potato', qty: 3 }]);
    const bad = { ...good, tables: { inventory: [{ crop: { nested: true }, qty: 1 }] } };
    expect(parseBackup(JSON.stringify(bad), 4)).toEqual({ ok: false, reason: 'broken' });
  });

  it('파일 이름', () => expect(backupFileName('2026-10-21')).toBe('solbit-backup-2026-10-21.json'));
});

describe('예전 백업의 행사 분류', () => {
  it('v6 전 백업은 기념일 → 생일·기념일, 일정·기타 → 기타', () => {
    const old = buildBackup(5, {
      event: [
        { id: 'a', name: '엄마 생신', date: '2026-11-04', type: 'anniversary', created_at: 1 },
        { id: 'b', name: '시험', date: '2026-11-19', type: 'schedule', created_at: 2 },
      ],
    });
    const r = parseBackup(JSON.stringify(old), 6);
    if (!r.ok) throw new Error();
    expect(r.backup.tables.event?.map((e) => e.type)).toEqual(['birth', 'etc']);
  });
  it('v6 백업은 그대로', () => {
    const cur = buildBackup(6, { event: [{ id: 'a', name: '여행', date: '2026-10-27', type: 'travel', repeat_yearly: 0, created_at: 1 }] });
    const r = parseBackup(JSON.stringify(cur), 6);
    if (!r.ok) throw new Error();
    expect(r.backup.tables.event?.[0]).toMatchObject({ type: 'travel', repeat_yearly: 0 });
  });
});

describe('예전 백업의 스킨', () => {
  it('v7 전 백업은 목록에서 빠진 스킨을 지운다', () => {
    const old = buildBackup(6, {
      skin: [
        { id: 'hat', owned: 1, equipped: 1 },
        { id: 'jars', owned: 1, equipped: 1 },
        { id: 'goldMega', owned: 1, equipped: 0 },
      ],
    });
    const r = parseBackup(JSON.stringify(old), 7);
    if (!r.ok) throw new Error();
    expect(r.backup.tables.skin?.map((s) => s.id)).toEqual(['hat']);
  });
});

describe('쉼 기록(스키마 v11) 백업', () => {
  const day = (date: string, leisure: string) => ({
    date,
    condition: 2,
    day_type: 'work',
    work: 1,
    achievement: null,
    memo: null,
    leisure,
    created_at: 7,
    updated_at: 7,
  });

  it('새 백업은 rest_log와 place.log_id를 그대로 왕복한다', () => {
    const backup = buildBackup(11, {
      rest_log: [{ id: 'rl_1', date: '2026-10-20', text: '한강 산책', tags: '[{"kind":"place","label":"한강"}]', size: 'twig', created_at: 1 }],
      place: [{ id: 'p1', name: '한강', duration: 'half', visited: 1, log_id: 'rl_1', visited_date: '2026-10-20', nights: 0, added_date: '2026-10-20', created_at: 1 }],
    });
    const r = parseBackup(JSON.stringify(backup), 11);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.backup.tables.rest_log?.[0]).toMatchObject({ id: 'rl_1', size: 'twig' });
      expect(r.backup.tables.place?.[0].log_id).toBe('rl_1');
    }
  });

  it('[다녀왔슈] 뒤 쉼 기록(통나무 + "다녀옴" 태그)과 다녀온 곳(박 수)도 그대로 왕복한다', () => {
    const tags = JSON.stringify([{ kind: 'place', label: '속초' }, { kind: 'etc', label: '다녀옴' }]);
    const backup = buildBackup(14, {
      rest_log: [{ id: 'rl_9', date: '2026-10-27', text: '속초 다녀옴', tags, size: 'log', created_at: 9 }],
      place: [{ id: 'p9', name: '속초', duration: 'half', visited: 1, log_id: null, visited_date: '2026-10-27', nights: 2, added_date: '2026-10-01', created_at: 1 }],
    });
    const r = parseBackup(JSON.stringify(backup), 14);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.backup.tables.rest_log?.[0]).toMatchObject({ id: 'rl_9', size: 'log', tags });
    expect(r.backup.tables.place?.[0]).toMatchObject({ visited: 1, visited_date: '2026-10-27', nights: 2, log_id: null });
  });

  it('v11 전 백업은 가져올 때 여가 칩을 쉼 기록(장작)으로 옮긴다', () => {
    const old = buildBackup(10, { day_record: [day('2026-10-20', '["산책","영화"]'), day('2026-10-21', '[]'), day('2026-10-22', '망가짐')] });
    const r = parseBackup(JSON.stringify(old), 11);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const logs = r.backup.tables.rest_log ?? [];
    expect(logs).toHaveLength(1);
    expect(logs[0]).toMatchObject({ id: 'rec_2026-10-20', date: '2026-10-20', size: 'firewood', created_at: 7 });
    expect(JSON.parse(String(logs[0].tags))).toEqual([
      { kind: 'activity', label: '산책' },
      { kind: 'activity', label: '영화' },
    ]);
  });

  it('rest_log가 이미 들어 있는 백업은 다시 만들지 않는다', () => {
    const b = buildBackup(10, { day_record: [day('2026-10-20', '["산책"]')], rest_log: [] });
    const r = parseBackup(JSON.stringify(b), 11);
    expect(r.ok && r.backup.tables.rest_log).toEqual([]);
  });

  it('지금 앱보다 새 백업은 받지 않는다', () => {
    expect(parseBackup(JSON.stringify(buildBackup(12, {})), 11)).toEqual({ ok: false, reason: 'tooNew' });
  });
});
