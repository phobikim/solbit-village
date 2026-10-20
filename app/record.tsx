// 9a 오늘 기록 시트 (모달). 기록 입력은 이 시트 한곳에서만 한다 (CLAUDE.md 규칙 5).
// ?date=YYYY-MM-DD 로 지난 기록(최근 7일)을 고칠 수 있다. 새 기록은 오늘만.

import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
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
import { WEEKDAYS } from '../src/copy/labels.ko';
import { seedSampleNeighbors } from '../src/data/devSeed';
import { parseDayKey, today as getToday, weekdayOf, type DayKey } from '../src/domain/day';
import {
  canCreateRecord,
  canEditRecord,
  draftFromRecord,
  emptyDraft,
  isDraftComplete,
  normalizeDraft,
  TEXT_MAX_LENGTH,
  type RecordDraft,
} from '../src/domain/records';
import type { DayRecord } from '../src/domain/types';
import { useNeighbors } from '../src/state/neighbors';
import { useRecords } from '../src/state/records';
import { BannerIcon } from '../src/ui/characters';
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
import { colors, fonts } from '../src/ui/theme';

type Mode = 'loading' | 'create' | 'edit' | 'tooOld' | 'noBackfill';

const isDayKey = (s: unknown): s is DayKey => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);

export default function RecordSheet() {
  const params = useLocalSearchParams<{ date?: string }>();
  const today = getToday();
  const date: DayKey = isDayKey(params.date) ? params.date : today;

  const loadDay = useRecords((s) => s.loadDay);
  const save = useRecords((s) => s.save);
  const neighbors = useNeighbors((s) => s.list);
  const loadNeighbors = useNeighbors((s) => s.load);

  const [mode, setMode] = useState<Mode>('loading');
  const [existing, setExisting] = useState<DayRecord | null>(null);
  const [draft, setDraft] = useState<RecordDraft>(emptyDraft);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    loadNeighbors().catch((e) => console.warn('[neighbors] load failed', e));
    loadDay(date)
      .then((r) => {
        if (!alive) return;
        setExisting(r);
        if (r) {
          setMode(canEditRecord(date, today) ? 'edit' : 'tooOld');
          setDraft(draftFromRecord(r));
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
  }, [date, today, loadDay, loadNeighbors]);

  const update = <K extends keyof RecordDraft>(k: K, v: RecordDraft[K]) => setDraft((d) => ({ ...d, [k]: v }));
  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));

  const onSave = async () => {
    if (!isDraftComplete(draft) || saving) return;
    setSaving(true);
    setError(null);
    try {
      const record = normalizeDraft(date, draft, Date.now(), existing);
      const { seed } = await save(record);
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
          : ijangLines.sheetNew;

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
                <FieldLabel>컨디션</FieldLabel>
                <ConditionPicker value={draft.condition} onChange={(v) => update('condition', v)} />
              </View>

              <View style={styles.section}>
                <FieldLabel>일 강도</FieldLabel>
                <WorkPicker value={draft.work} onChange={(v) => update('work', v)} />
              </View>

              <View style={styles.section}>
                <FieldLabel optional>오늘의 성취</FieldLabel>
                <Field
                  value={draft.achievement}
                  onChangeText={(t) => update('achievement', t)}
                  placeholder="오늘 해낸 일 한 줄"
                  maxLength={TEXT_MAX_LENGTH}
                  returnKeyType="done"
                />
                <View style={styles.hint}>
                  <BannerIcon color={colors.yellow} size={14} />
                  <Text style={styles.hintText}>적으면 이장네 장부에 올라갑니다</Text>
                </View>
              </View>

              <View style={styles.section}>
                <FieldLabel>누구와</FieldLabel>
                {neighbors.length > 0 ? (
                  <NeighborPicker neighbors={neighbors} value={draft.contacts} onChange={(v) => update('contacts', v)} />
                ) : (
                  <View style={styles.empty}>
                    <Text style={styles.emptyText}>{ijangLines.noNeighbors}</Text>
                    {__DEV__ && (
                      <Pressable
                        onPress={() => seedSampleNeighbors().then(loadNeighbors).catch((e) => console.warn(e))}
                        style={styles.devButton}
                      >
                        <Text style={styles.devText}>샘플 이웃 넣기 (개발용)</Text>
                      </Pressable>
                    )}
                  </View>
                )}
              </View>

              <View style={styles.section}>
                <FieldLabel>여가</FieldLabel>
                <LeisurePicker value={draft.leisure} onChange={(v) => update('leisure', v)} />
              </View>

              <Field
                value={draft.memo}
                onChangeText={(t) => update('memo', t)}
                placeholder="한 줄 메모 (선택)"
                maxLength={TEXT_MAX_LENGTH}
                returnKeyType="done"
              />
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
            <Text style={styles.need}>컨디션과 일 강도만 고르면 됩니다.</Text>
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
  hint: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingLeft: 4 },
  hintText: { fontFamily: fonts.bodyHeavy, fontSize: 12, color: colors.yellow },
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
