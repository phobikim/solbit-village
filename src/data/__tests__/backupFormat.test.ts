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
