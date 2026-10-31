// 장작 던지기 시트 (디자인 15b · 35a · 34d). 모닥불 탭 위로 올라오는 시트 — 새 화면이 아니다.
//  - 새로 던지기(15b): 오늘 날짜, 빈 한 줄.
//  - [다녀왔슈](35a): 그 곳 이름 한 줄 + 이름 태그 + "다녀옴" 태그 + 통나무로 채워 열린다. 던지면 깃발이 다녀온 곳이 된다.
//  - 기록 고치기(34d): 장작 항목을 누르면 같은 시트가 열린다. 버튼은 [고친 대로 두기].
// 말하듯 한 줄 적으면 규칙 기반으로 태그를 읽고(서버 · AI 없음), 크기는 한 번 탭한다. 사진 버튼은 용량 · 백업 문제로 보류(숨김).
// 장작만 던진 날은 기록일이 아니다 — 씨앗 · 경험치는 기록 시트 저장에서만 받는다.

import { useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { WEEKDAYS } from '../../../copy/labels.ko';
import { SIZE_HINT, SIZE_LABEL, TAG_KIND_LABEL, throwCopy } from '../../../copy/rest.ko';
import { newId } from '../../../data/events';
import { parseDayKey, weekdayOf, type DayKey } from '../../../domain/day';
import {
  DEFAULT_REST_SIZE,
  REST_SIZES,
  REST_TEXT_MAX,
  type RestLog,
  type RestSize,
  type RestTag,
  type RestTagKind,
} from '../../../domain/fire';
import { visitTags, visitText, visitThrow, type Place } from '../../../domain/rest';
import { recognizeTags, refreshTags, type TagContext } from '../../../domain/restTags';
import { useNeighbors } from '../../../state/neighbors';
import { usePlaces } from '../../../state/places';
import { useRestLogs } from '../../../state/restLogs';
import { colors, fonts } from '../../theme';
import { PrimaryButton } from '../PrimaryButton';

export type ThrowSheetState =
  | { mode: 'new' }
  /** 지도 [다녀왔슈] */
  | { mode: 'visit'; place: Place }
  /** 이번 주 장작 항목을 눌러 고치기 */
  | { mode: 'edit'; log: RestLog };

/** 시트를 닫으면서 알려 주는 것: 방금 저장한 쉼 기록, [다녀왔슈]였으면 다녀온 곳이 된 깃발 */
export type ThrowDone = { logId: string; placeId: string | null };

type Props = {
  state: ThrowSheetState | null;
  today: DayKey;
  onClose: () => void;
  onDone: (r: ThrowDone) => void;
};

/** 태그 점 색 (태그 종류별) */
const KIND_COLOR: Record<RestTagKind, string> = {
  activity: colors.leisure,
  neighbor: colors.relation,
  place: colors.pink,
  etc: colors.yellow,
};

/** 기록 시트(rec_날짜)에서 온 쉼 기록: 날짜별 기록과 한 몸이라 여기서는 지우지 않는다 */
const isRecordLog = (l: RestLog) => l.id.startsWith('rec_');

const same = (a: RestTag, b: RestTag) => a.kind === b.kind && a.label === b.label && a.ref === b.ref;
const SIZE_BAR: Record<RestSize, number> = { twig: 28, firewood: 46, log: 64 };

export function ThrowSheet({ state, today, onClose, onDone }: Props) {
  return (
    <Modal transparent visible={!!state} animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.dim} onPress={onClose} accessibilityLabel="시트 닫기">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.kav}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            {state && <Body key={sheetKey(state)} state={state} today={today} onClose={onClose} onDone={onDone} />}
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

const sheetKey = (s: ThrowSheetState) => (s.mode === 'visit' ? `visit:${s.place.id}` : s.mode === 'edit' ? `edit:${s.log.id}` : 'new');

/** 열 때 채울 값 */
function initialOf(state: ThrowSheetState, ctx: TagContext) {
  if (state.mode === 'visit') {
    return { text: visitText(state.place.name), size: 'log' as RestSize, manual: visitTags(state.place), removed: [] as RestTag[] };
  }
  if (state.mode === 'edit') {
    const { log } = state;
    // 글에서 다시 읽히지 않는 태그는 직접 넣은 것으로 남기고, 읽히는데 빠진 태그는 뺀 것으로 둔다 (고쳐도 태그가 달라지지 않게)
    const read = recognizeTags(log.text, ctx);
    return {
      text: log.text,
      size: log.size,
      manual: log.tags.filter((t) => !read.some((r) => same(r, t))),
      removed: read.filter((r) => !log.tags.some((t) => same(r, t))),
    };
  }
  return { text: '', size: DEFAULT_REST_SIZE, manual: [] as RestTag[], removed: [] as RestTag[] };
}

function Body({ state, today, onClose, onDone }: { state: ThrowSheetState; today: DayKey; onClose: () => void; onDone: (r: ThrowDone) => void }) {
  const neighbors = useNeighbors((s) => s.list);
  const loadNeighbors = useNeighbors((s) => s.load);
  const places = usePlaces((s) => s.places);
  const loadPlaces = usePlaces((s) => s.load);
  const throwLog = useRestLogs((s) => s.throwLog);
  const removeLog = useRestLogs((s) => s.remove);

  const ctx0 = useMemo<TagContext>(
    () => ({ neighbors: neighbors.map((n) => ({ id: n.id, name: n.name })), places: places.map((p) => p.name) }),
    // 열 때 한 번만 읽는다
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const init = useMemo(() => initialOf(state, ctx0), [state, ctx0]);

  const [text, setText] = useState(init.text);
  const [size, setSize] = useState<RestSize>(init.size);
  const [removed, setRemoved] = useState<RestTag[]>(init.removed);
  const [manual, setManual] = useState<RestTag[]>(init.manual);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([loadNeighbors(), loadPlaces()]).catch((e) => console.warn('[throw] load failed', e));
  }, [loadNeighbors, loadPlaces]);

  const ctx = useMemo<TagContext>(
    () => ({ neighbors: neighbors.map((n) => ({ id: n.id, name: n.name })), places: places.map((p) => p.name) }),
    [neighbors, places],
  );
  const tags = useMemo(() => refreshTags(text, ctx, removed, manual), [text, ctx, removed, manual]);

  const dropTag = (t: RestTag) => {
    if (manual.some((m) => same(m, t))) setManual((m) => m.filter((x) => !same(x, t)));
    else setRemoved((r) => [...r, t]);
  };

  const editing = state.mode === 'edit';
  const date: DayKey = state.mode === 'edit' ? state.log.date : today;
  const { month, day } = parseDayKey(date);
  const dateLabel = `${month}.${String(day).padStart(2, '0')} (${WEEKDAYS[weekdayOf(date)]})`;
  const ready = text.trim().length > 0 && !saving;

  const onSave = async () => {
    if (!ready) return;
    setSaving(true);
    setError(null);
    try {
      const body = { text: text.trim().slice(0, REST_TEXT_MAX), tags, size };
      if (state.mode === 'edit') {
        const log: RestLog = { ...state.log, ...body };
        await throwLog(log, []);
        onDone({ logId: log.id, placeId: null });
      } else {
        const log: RestLog = { id: newId('rl'), date, createdAt: Date.now(), ...body };
        if (state.mode === 'visit') {
          const r = visitThrow(state.place, log);
          await throwLog(r.log, [r.place]);
          onDone({ logId: log.id, placeId: r.place.id });
        } else {
          await throwLog(log, []);
          onDone({ logId: log.id, placeId: null });
        }
      }
    } catch (e) {
      console.warn('[throw] save failed', e);
      setError('저장하지 못했습니다. 다시 시도해 주세요.');
      setSaving(false);
    }
  };

  const onDelete = async () => {
    if (state.mode !== 'edit') return;
    if (!confirmDelete) return setConfirmDelete(true);
    try {
      await removeLog(state.log.id);
      onClose();
    } catch (e) {
      console.warn('[throw] delete failed', e);
      setError('지우지 못했습니다. 다시 시도해 주세요.');
    }
  };

  return (
    <>
      <View style={styles.handle} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{editing ? throwCopy.editTitle : throwCopy.title}</Text>
          <Text style={styles.date}>{dateLabel}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>{throwCopy.prompt}</Text>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder={throwCopy.placeholder}
            placeholderTextColor={colors.tabInactive}
            maxLength={REST_TEXT_MAX}
            multiline
            style={styles.input}
          />
        </View>

        {tags.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.labelSmall}>{throwCopy.recognized}</Text>
            <View style={styles.tags}>
              {tags.map((t) => (
                <View key={`${t.kind}:${t.ref ?? ''}:${t.label}`} style={styles.tag}>
                  <View style={[styles.tagDot, { backgroundColor: KIND_COLOR[t.kind] }]} />
                  <Text style={styles.tagText} accessibilityLabel={`${TAG_KIND_LABEL[t.kind]} ${t.label}`}>
                    {t.label}
                  </Text>
                  <Pressable accessibilityRole="button" accessibilityLabel={`${t.label} 빼기`} hitSlop={8} onPress={() => dropTag(t)} style={styles.tagX}>
                    <Text style={styles.tagXText}>×</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.label}>{throwCopy.howLong}</Text>
          <View style={styles.sizes}>
            {REST_SIZES.map((s) => {
              const on = s === size;
              return (
                <Pressable
                  key={s}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: on }}
                  accessibilityLabel={`${SIZE_LABEL[s]} ${SIZE_HINT[s]}`}
                  onPress={() => setSize(s)}
                  style={[styles.size, on && styles.sizeOn]}
                >
                  <View style={[styles.sizeBar, { width: SIZE_BAR[s], backgroundColor: on ? '#8E5A38' : '#7A4A2E' }]} />
                  <Text style={[styles.sizeName, on && styles.sizeNameOn]}>{SIZE_LABEL[s]}</Text>
                  <Text style={[styles.sizeHint, on && styles.sizeNameOn]}>{SIZE_HINT[s]}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {error && <Text style={styles.error}>{error}</Text>}
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton
          label={saving ? (editing ? throwCopy.keeping : throwCopy.throwing) : editing ? throwCopy.keepBtn : throwCopy.throwBtn}
          onPress={onSave}
          disabled={!ready}
        />
        {text.trim().length === 0 && <Text style={styles.need}>{throwCopy.need}</Text>}
        {state.mode === 'edit' && !isRecordLog(state.log) && (
          <Pressable accessibilityRole="button" onPress={onDelete} style={styles.delete}>
            <Text style={styles.deleteText}>{confirmDelete ? throwCopy.delConfirm : throwCopy.del}</Text>
          </Pressable>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  dim: { flex: 1, backgroundColor: 'rgba(6,8,24,.7)', justifyContent: 'flex-end' },
  kav: { width: '100%', maxWidth: 430, alignSelf: 'center', maxHeight: '92%' },
  sheet: {
    backgroundColor: colors.cardSub,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingTop: 10,
    paddingHorizontal: 18,
    paddingBottom: 26,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -12 },
    flexShrink: 1,
  },
  handle: { width: 44, height: 5, borderRadius: 3, backgroundColor: '#3A437F', alignSelf: 'center', marginBottom: 12 },
  content: { gap: 16, paddingBottom: 6 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  title: { fontFamily: fonts.title, fontSize: 22, color: colors.yellow },
  date: { fontFamily: fonts.number, fontSize: 13, color: colors.textSub },
  section: { gap: 8 },
  label: { fontFamily: fonts.bodyHeavy, fontSize: 13, color: colors.textSub },
  labelSmall: { fontFamily: fonts.bodyHeavy, fontSize: 12, color: colors.textMuted },
  input: {
    minHeight: 72,
    borderWidth: 2,
    borderColor: colors.leisure,
    backgroundColor: colors.night,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    lineHeight: 22,
    color: colors.text,
    textAlignVertical: 'top',
  },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 36, paddingLeft: 12, paddingRight: 6, borderRadius: 18, backgroundColor: '#2E3775' },
  tagDot: { width: 7, height: 7, borderRadius: 4 },
  tagText: { fontFamily: fonts.bodyHeavy, fontSize: 13, color: colors.text },
  tagX: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  tagXText: { fontFamily: fonts.bodyHeavy, fontSize: 14, color: colors.textMuted },
  sizes: { flexDirection: 'row', gap: 6 },
  size: { flex: 1, alignItems: 'center', gap: 6, paddingVertical: 10, paddingHorizontal: 4, borderRadius: 18, backgroundColor: colors.night },
  sizeOn: { backgroundColor: colors.yellow },
  sizeBar: { height: 12, borderRadius: 6 },
  sizeName: { fontFamily: fonts.bodyHeavy, fontSize: 14, color: colors.text },
  sizeNameOn: { color: colors.line },
  sizeHint: { fontFamily: fonts.bodyBold, fontSize: 11, color: colors.textMuted },
  error: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.pinkSoft, textAlign: 'center' },
  footer: { paddingTop: 12, gap: 6 },
  need: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.textMuted, textAlign: 'center' },
  delete: { alignItems: 'center', paddingVertical: 6 },
  deleteText: { fontFamily: fonts.bodyHeavy, fontSize: 13, color: colors.textMuted },
});
