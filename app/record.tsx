// 9a · 14a · 14b 오늘 기록 시트 (모달). 기록 입력은 이 시트 한곳에서만 한다 (CLAUDE.md 규칙 5).
// ?date=YYYY-MM-DD 로 지난 기록(최근 7일)을 고칠 수 있다.
// 맨 위에서 일한 날 / 쉬는 날을 고른다 (새 기록은 토 · 일이면 쉬는 날). 컨디션 · 한 줄 메모는 공통,
// 일 강도 · 누구와 · 쉼은 + 로 펼친다. 일한 날은 일 강도, 쉬는 날은 쉼이 처음부터 펼쳐져 있다.

import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ijangLines } from '../src/copy/broadcasts.ko';
import { seedChip } from '../src/copy/crops.ko';
import { DAY_TYPE_LABEL, recordCopy, WEEKDAYS } from '../src/copy/labels.ko';
import { seedSampleNeighbors } from '../src/data/devSeed';
import { recordLogId } from '../src/data/restLogs';
import { parseDayKey, today as getToday, weekdayOf, type DayKey } from '../src/domain/day';
import {
  canCreateRecord,
  canEditRecord,
  defaultDayType,
  draftFromRecord,
  emptyDraft,
  isDraftComplete,
  normalizeDraft,
  restLogOfRecord,
  TEXT_MAX_LENGTH,
  type RecordDraft,
} from '../src/domain/records';
import type { DayRecord, DayType } from '../src/domain/types';
import { useNeighbors } from '../src/state/neighbors';
import { useRecords } from '../src/state/records';
import { useRestLogs } from '../src/state/restLogs';
import { PrimaryButton } from '../src/ui/components/PrimaryButton';
import { NeighborPicker } from '../src/ui/components/record/NeighborPicker';
import {
  ConditionPicker,
  Field,
  FieldLabel,
  IjangBubble,
  LeisurePicker,
  WorkPicker,
} from '../src/ui/components/record/pickers';
import { SizePicker } from '../src/ui/components/record/SizePicker';
import { colors, fonts } from '../src/ui/theme';

type Mode = 'loading' | 'create' | 'edit' | 'tooOld' | 'noBackfill';

/** + 로 펼치는 칸 */
type Extra = 'work' | 'contacts' | 'leisure';
const EXTRAS: readonly Extra[] = ['work', 'contacts', 'leisure'];
/** 일한 날 / 쉬는 날에 처음부터 펼쳐 두는 칸 (디자인 14a · 14b) */
const OPEN_BY_DAY: Record<DayType, readonly Extra[]> = { work: ['work'], rest: ['leisure'] };
const EXTRA_COLOR: Record<Extra, string> = { work: '#FF9A3C', contacts: colors.relation, leisure: colors.leisure };

/** 값이 들어 있는 칸은 늘 펼친다 */
function filled(d: RecordDraft): Extra[] {
  return EXTRAS.filter((k) =>
    k === 'work' ? d.work !== null : k === 'contacts' ? d.contacts.length > 0 : d.leisure.length > 0,
  );
}
const openFor = (d: RecordDraft): Set<Extra> => new Set([...OPEN_BY_DAY[d.dayType], ...filled(d)]);

const isDayKey = (s: unknown): s is DayKey => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);

export default function RecordSheet() {
  const params = useLocalSearchParams<{ date?: string }>();
  const today = getToday();
  const date: DayKey = isDayKey(params.date) ? params.date : today;

  const loadDay = useRecords((s) => s.loadDay);
  const save = useRecords((s) => s.save);
  const neighbors = useNeighbors((s) => s.list);
  const loadNeighbors = useNeighbors((s) => s.load);
  const loadRestLogs = useRestLogs((s) => s.load);

  const [mode, setMode] = useState<Mode>('loading');
  const [existing, setExisting] = useState<DayRecord | null>(null);
  const [draft, setDraft] = useState<RecordDraft>(() => emptyDraft(defaultDayType(date)));
  const [open, setOpen] = useState<Set<Extra>>(() => new Set(OPEN_BY_DAY[defaultDayType(date)]));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    loadNeighbors().catch((e) => console.warn('[neighbors] load failed', e));
    // 쉼 칸의 장작 크기는 그날 시트 쉼 기록(rec_날짜)에서 가져온다
    Promise.all([loadDay(date), loadRestLogs().then(() => useRestLogs.getState().logs.find((l) => l.id === recordLogId(date)) ?? null)])
      .then(([r, log]) => {
        if (!alive) return;
        setExisting(r);
        if (r) {
          setMode(canEditRecord(date, today) ? 'edit' : 'tooOld');
          const d = draftFromRecord(r, log?.size);
          setDraft(d);
          setOpen(openFor(d));
        } else {
          setMode(canCreateRecord(date, today) ? 'create' : 'noBackfill');
        }
      })
      .catch((e) => {
        console.warn('[record] load failed', e);
        if (alive) setError('기록을 불러오지 못했습니다.');
      });
    return () => {
      alive = false;
    };
  }, [date, today, loadDay, loadNeighbors, loadRestLogs]);

  const update = <K extends keyof RecordDraft>(k: K, v: RecordDraft[K]) => setDraft((d) => ({ ...d, [k]: v }));
  const setDayType = (t: DayType) => {
    const next = { ...draft, dayType: t };
    setDraft(next);
    setOpen(openFor(next));
  };
  /** 칸 접기: 접으면 그 칸 값도 비운다 (보이는 것만 저장) */
  const collapse = (k: Extra) => {
    setOpen((o) => new Set([...o].filter((x) => x !== k)));
    setDraft((d) =>
      k === 'work' ? { ...d, work: null } : k === 'contacts' ? { ...d, contacts: [] } : { ...d, leisure: [] },
    );
  };
  const expand = (k: Extra) => setOpen((o) => new Set([...o, k]));
  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));

  const onSave = async () => {
    if (!isDraftComplete(draft) || saving) return;
    setSaving(true);
    setError(null);
    try {
      const record = normalizeDraft(date, draft, Date.now(), existing);
      // 쉼 칸을 적었으면 같은 저장에서 쉼 기록(장작)으로도 남긴다 (칸이 비었으면 그날 시트 쉼 기록을 지운다)
      const id = recordLogId(date);
      const prev = useRestLogs.getState().logs.find((l) => l.id === id) ?? null;
      const { seed } = await save(record, restLogOfRecord(record, draft.restSize, id, prev));
      if (seed) {
        const nameOf = (id: string) => neighbors.find((n) => n.id === id)?.name;
        router.replace({
          pathname: '/seed-result',
          params: {
            crop: seed.crop,
            slot: String(seed.slot),
            chip: seedChip(seed.crop, record, nameOf),
            ...(seed.autoHarvested ? { auto: seed.autoHarvested } : {}),
          },
        });
      } else {
        close();
      }
    } catch (e) {
      console.warn('[record] save failed', e);
      setError('저장하지 못했습니다. 다시 시도해 주세요.');
      setSaving(false);
    }
  };

  const { month, day } = parseDayKey(date);
  const dateLabel = `${month}.${String(day).padStart(2, '0')} (${WEEKDAYS[weekdayOf(date)]})`;
  const editable = mode === 'create' || mode === 'edit';
  const bubble =
    mode === 'edit'
      ? ijangLines.sheetEdit
      : mode === 'tooOld'
        ? ijangLines.sheetTooOld
        : mode === 'noBackfill'
          ? ijangLines.sheetNoBackfill
          : draft.dayType === 'rest'
            ? ijangLines.sheetRest
            : date === today
              ? ijangLines.sheetNew
              : ijangLines.sheetBackfill;
  // 새 기록이 주말이라 쉬는 날로 골라 둔 경우
  const weekendHint = mode === 'create' && draft.dayType === 'rest' && defaultDayType(date) === 'rest';
  /** 일한 날의 일 강도는 필수라 접지 않는다 */
  const closable = (k: Extra) => !(k === 'work' && draft.dayType === 'work');
  const extraBox = (k: Extra, title: string, body: ReactNode) => (
    <View key={k} style={styles.extra}>
      <View style={styles.extraHead}>
        <View style={styles.extraTitle}>
          <View style={[styles.extraDot, { backgroundColor: EXTRA_COLOR[k] }]} />
          <Text style={styles.extraTitleText}>{title}</Text>
        </View>
        {closable(k) && (
          <Pressable accessibilityRole="button" accessibilityLabel={`${title} 접기`} onPress={() => collapse(k)} style={styles.extraClose}>
            <Text style={styles.extraCloseText}>×</Text>
          </Pressable>
        )}
      </View>
      {body}
    </View>
  );
  const EXTRA_TITLE: Record<Extra, string> = { work: '일 강도', contacts: '누구와', leisure: '쉼' };
  const EXTRA_ADD: Record<Extra, string> = { work: '일 강도', contacts: '누구와', leisure: '쉼' };
  const extraBody: Record<Extra, () => ReactNode> = {
    work: () => <WorkPicker value={draft.work} onChange={(v) => update('work', v)} />,
    contacts: () =>
      neighbors.length > 0 ? (
        <NeighborPicker neighbors={neighbors} value={draft.contacts} onChange={(v) => update('contacts', v)} />
      ) : (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>{ijangLines.noNeighbors}</Text>
          <Pressable onPress={() => router.push('/neighbor-new')} style={styles.devButton}>
            <Text style={styles.devText}>이웃 등록하러 가기</Text>
          </Pressable>
          {__DEV__ && (
            <Pressable onPress={() => seedSampleNeighbors().then(loadNeighbors).catch((e) => console.warn(e))} style={styles.devButton}>
              <Text style={styles.devText}>샘플 이웃 넣기 (개발용)</Text>
            </Pressable>
          )}
        </View>
      ),
    leisure: () => (
      <>
        <LeisurePicker value={draft.leisure} onChange={(v) => update('leisure', v)} />
        {draft.leisure.length > 0 && (
          <>
            <Text style={styles.hintText}>얼마나 쉬었슈?</Text>
            <SizePicker value={draft.restSize} onChange={(v) => update('restSize', v)} />
          </>
        )}
      </>
    ),
  };
  // 펼친 칸은 그날 종류의 기본 칸부터
  const order: readonly Extra[] = draft.dayType === 'work' ? ['work', 'contacts', 'leisure'] : ['leisure', 'contacts', 'work'];
  const opened = order.filter((k) => open.has(k));
  const closed = order.filter((k) => !open.has(k));

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.root}>
      <View style={styles.handle} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" indicatorStyle="white">
          <IjangBubble text={bubble} />
          <View style={styles.titleRow}>
            <Text style={styles.title}>{date === today ? '오늘 기록' : '지난 기록'}</Text>
            <Text style={styles.date}>{dateLabel}</Text>
          </View>

          {mode === 'loading' && !error && <ActivityIndicator color={colors.yellow} style={styles.loading} />}

          {editable && (
            <>
              <View style={styles.section}>
                <View style={styles.seg} accessibilityRole="tablist">
                  {(['work', 'rest'] as const).map((t) => (
                    <Pressable
                      key={t}
                      accessibilityRole="tab"
                      accessibilityState={{ selected: draft.dayType === t }}
                      onPress={() => setDayType(t)}
                      style={[styles.segItem, draft.dayType === t && (t === 'work' ? styles.segWork : styles.segRest)]}
                    >
                      <Text style={[styles.segText, draft.dayType === t && styles.segTextOn]}>{DAY_TYPE_LABEL[t]}</Text>
                    </Pressable>
                  ))}
                </View>
                {weekendHint && <Text style={styles.restHint}>{recordCopy.weekendRest(WEEKDAYS[weekdayOf(date)])}</Text>}
              </View>

              <View style={styles.section}>
                <FieldLabel>컨디션</FieldLabel>
                <ConditionPicker value={draft.condition} onChange={(v) => update('condition', v)} />
              </View>

              <View style={styles.section}>
                <FieldLabel>한 줄 메모</FieldLabel>
                <Field
                  value={draft.memo}
                  onChangeText={(t) => update('memo', t)}
                  placeholder={recordCopy.memoPlaceholder}
                  maxLength={TEXT_MAX_LENGTH}
                  returnKeyType="done"
                />
              </View>

              <View style={styles.extras}>
                <Text style={styles.extrasLabel}>
                  {recordCopy.more} <Text style={styles.extrasOptional}>(선택)</Text>
                </Text>
                {opened.map((k) => extraBox(k, EXTRA_TITLE[k], extraBody[k]()))}
                {closed.length > 0 && (
                  <View style={styles.adds}>
                    {closed.map((k) => (
                      <Pressable key={k} accessibilityRole="button" onPress={() => expand(k)} style={styles.add}>
                        <Text style={[styles.addPlus, { color: EXTRA_COLOR[k] }]}>+</Text>
                        <Text style={styles.addText}>{EXTRA_ADD[k]}</Text>
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>
            </>
          )}

          {error && <Text style={styles.error}>{error}</Text>}
        </ScrollView>

        <View style={styles.footer}>
          {editable ? (
            <PrimaryButton
              label={saving ? '저장 중…' : mode === 'edit' ? '기록 고치기' : '기록하고 씨앗 심기'}
              onPress={onSave}
              disabled={!isDraftComplete(draft) || saving}
            />
          ) : (
            <PrimaryButton label="닫기" onPress={close} />
          )}
          {editable && !isDraftComplete(draft) && (
            <Text style={styles.need}>{draft.dayType === 'work' ? recordCopy.needWork : recordCopy.needRest}</Text>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cardSub },
  flex: { flex: 1 },
  handle: { width: 44, height: 5, borderRadius: 3, backgroundColor: '#3A437F', alignSelf: 'center', marginTop: 10 },
  content: { paddingHorizontal: 18, paddingTop: 10, paddingBottom: 16, gap: 12 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  title: { fontFamily: fonts.title, fontSize: 22, color: colors.yellow },
  date: { fontFamily: fonts.number, fontSize: 13, color: colors.textSub },
  loading: { marginTop: 40 },
  section: { gap: 6 },
  hintText: { fontFamily: fonts.bodyHeavy, fontSize: 12, color: colors.yellow, paddingLeft: 4 },
  seg: { flexDirection: 'row', height: 48, borderRadius: 24, backgroundColor: colors.night, padding: 4, gap: 4 },
  segItem: { flex: 1, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  segWork: { backgroundColor: '#FF9A3C' },
  segRest: { backgroundColor: colors.leisure },
  segText: { fontFamily: fonts.bodyHeavy, fontSize: 15, color: colors.textSub },
  segTextOn: { color: colors.line },
  restHint: { fontFamily: fonts.bodyHeavy, fontSize: 12, color: colors.leisure, paddingLeft: 4 },
  extras: { gap: 8, paddingTop: 4 },
  extrasLabel: { fontFamily: fonts.bodyHeavy, fontSize: 13, color: colors.textMuted, paddingLeft: 4 },
  extrasOptional: { color: '#7D84B8' },
  extra: { backgroundColor: colors.night, borderRadius: 22, padding: 12, gap: 10 },
  extraHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingLeft: 4 },
  extraTitle: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  extraDot: { width: 8, height: 8, borderRadius: 4 },
  extraTitleText: { fontFamily: fonts.bodyHeavy, fontSize: 14, color: colors.text },
  extraClose: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
  extraCloseText: { fontFamily: fonts.bodyHeavy, fontSize: 16, lineHeight: 18, color: colors.textSub },
  adds: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  add: {
    flexGrow: 1,
    flexBasis: '30%',
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#333C7A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  addPlus: { fontFamily: fonts.numberBold, fontSize: 18 },
  addText: { fontFamily: fonts.bodyHeavy, fontSize: 13, color: colors.textSub },
  empty: { backgroundColor: colors.night, borderRadius: 20, padding: 12, gap: 8 },
  emptyText: { fontFamily: fonts.bodyBold, fontSize: 13, lineHeight: 19, color: colors.textSub },
  devButton: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.textMuted,
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  devText: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.textMuted },
  error: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.pinkSoft, textAlign: 'center' },
  footer: { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 12, gap: 6 },
  need: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.textMuted, textAlign: 'center' },
});
