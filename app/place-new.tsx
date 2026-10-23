// 쉼터 담기 시트.
// - 가고 싶은 곳 새로 · 고치기: 이름 · 걸리는 시간 · 메모(선택)
// - 다녀온 곳 새로(?visited=1) · 고치기: 이름 · 언제 · 며칠 · 한 줄 소감(선택)
// - [다녀왔슈](?id=…&mode=visit): 언제(처음엔 오늘) · 며칠 · 한 줄 소감 → 다녀온 곳으로 옮긴다

import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PLACE_DURATION_LABEL, restCopy, tripLength } from '../src/copy/rest.ko';
import { newId } from '../src/data/events';
import { today as getToday, type DayKey } from '../src/domain/day';
import {
  clampNights,
  markVisited,
  PLACE_DURATIONS,
  PLACE_NAME_MAX,
  PLACE_NIGHTS_MAX,
  PLACE_TEXT_MAX,
  type PlaceDuration,
} from '../src/domain/rest';
import { usePlaces } from '../src/state/places';
import { ChoiceChips, DatePicker } from '../src/ui/components/form';
import { PrimaryButton } from '../src/ui/components/PrimaryButton';
import { Field, FieldLabel, IjangBubble } from '../src/ui/components/record/pickers';
import { RoundButton } from '../src/ui/components/RoundButton';
import { colors, fonts } from '../src/ui/theme';

const DURATIONS = PLACE_DURATIONS.map((value) => ({ value, label: PLACE_DURATION_LABEL[value] }));

export default function PlaceSheet() {
  const params = useLocalSearchParams<{ id?: string; visited?: string; mode?: string }>();
  const today = getToday();
  const places = usePlaces((s) => s.places);
  const save = usePlaces((s) => s.save);
  const remove = usePlaces((s) => s.remove);
  const editing = params.id ? places.find((p) => p.id === params.id) : undefined;
  /** [다녀왔슈]: 가고 싶은 곳 → 다녀온 곳 */
  const visiting = params.mode === 'visit' && !!editing && !editing.visited;
  const visited = visiting || (editing ? editing.visited : params.visited === '1');

  const [name, setName] = useState('');
  const [duration, setDuration] = useState<PlaceDuration>('half');
  const [memo, setMemo] = useState('');
  const [note, setNote] = useState('');
  const [visitedDate, setVisitedDate] = useState<DayKey>(today);
  const [nights, setNights] = useState(0);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!editing) return;
    setName(editing.name);
    setDuration(editing.duration);
    setMemo(editing.memo ?? '');
    setNote(editing.note ?? '');
    setVisitedDate(editing.visitedDate ?? today);
    setNights(editing.nights);
  }, [editing, today]);

  const close = () => (router.canGoBack() ? router.back() : router.replace('/rest'));
  const ready = name.trim().length > 0;

  const onSave = async () => {
    if (!ready || saving) return;
    setSaving(true);
    try {
      if (visiting && editing) {
        await save(markVisited(editing, visitedDate, nights, note));
      } else {
        await save({
          id: editing?.id ?? newId('pl'),
          name: name.trim().slice(0, PLACE_NAME_MAX),
          duration,
          visited,
          memo: memo.trim() || null,
          note: visited ? note.trim() || null : null,
          eventId: editing?.eventId ?? null,
          visitedDate: visited ? visitedDate : null,
          nights: visited ? clampNights(nights) : 0,
          addedDate: editing?.addedDate ?? today,
          createdAt: editing?.createdAt ?? Date.now(),
        });
      }
      close();
    } catch (e) {
      console.warn('[place] save failed', e);
      setSaving(false);
    }
  };

  const onDelete = async () => {
    if (!editing) return;
    if (!confirmDelete) return setConfirmDelete(true);
    await remove(editing.id);
    close();
  };

  const bubble = visiting ? restCopy.visitNow : editing ? restCopy.placeEdit : visited ? restCopy.visitedNew : restCopy.placeNew;

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.root}>
      <View style={styles.handle} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" indicatorStyle="white">
          <IjangBubble text={bubble} />

          {visiting ? (
            <Text style={styles.placeName}>{editing?.name}</Text>
          ) : (
            <View style={styles.section}>
              <FieldLabel>어디</FieldLabel>
              <Field value={name} onChangeText={setName} placeholder="예: 강릉 바다" maxLength={PLACE_NAME_MAX} style={styles.nameField} />
            </View>
          )}

          {!visited && (
            <>
              <View style={styles.section}>
                <FieldLabel>걸리는 시간</FieldLabel>
                <ChoiceChips options={DURATIONS} value={duration} onChange={setDuration} activeColor={colors.leisure} />
              </View>
              <View style={styles.section}>
                <FieldLabel optional>메모</FieldLabel>
                <Field value={memo} onChangeText={setMemo} placeholder="예: 바다 보면서 멍 때리기" maxLength={PLACE_TEXT_MAX} />
              </View>
            </>
          )}

          {visited && (
            <>
              <View style={styles.section}>
                <FieldLabel>언제 갔슈</FieldLabel>
                <DatePicker value={visitedDate} onChange={setVisitedDate} max={today} selectedColor={colors.leisure} />
              </View>
              <View style={styles.section}>
                <FieldLabel>며칠</FieldLabel>
                <View style={styles.nights}>
                  <RoundButton
                    icon="prev"
                    variant="card"
                    size={36}
                    accessibilityLabel="하루 줄이기"
                    disabled={nights === 0}
                    onPress={() => setNights((n) => clampNights(n - 1))}
                  />
                  <Text style={styles.nightsText}>{tripLength(nights)}</Text>
                  <RoundButton
                    icon="next"
                    variant="card"
                    size={36}
                    accessibilityLabel="하루 늘리기"
                    disabled={nights >= PLACE_NIGHTS_MAX}
                    onPress={() => setNights((n) => clampNights(n + 1))}
                  />
                </View>
              </View>
              <View style={styles.section}>
                <FieldLabel optional>한 줄 소감</FieldLabel>
                <Field value={note} onChangeText={setNote} placeholder="예: 바람이 좋았다" maxLength={PLACE_TEXT_MAX} />
              </View>
            </>
          )}

          {editing && !visiting && (
            <View style={styles.delete}>
              <Text style={styles.deleteBtn} onPress={onDelete} accessibilityRole="button">
                {confirmDelete ? '네, 지우기' : '지우기'}
              </Text>
            </View>
          )}
        </ScrollView>
        <View style={styles.footer}>
          <PrimaryButton
            label={saving ? '적는 중…' : visiting ? restCopy.visitedBtn : editing ? '고치기' : '남기기'}
            onPress={onSave}
            disabled={!ready || saving}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cardSub },
  flex: { flex: 1 },
  handle: { width: 44, height: 5, borderRadius: 3, backgroundColor: '#3A437F', alignSelf: 'center', marginTop: 10 },
  content: { paddingHorizontal: 18, paddingTop: 10, paddingBottom: 16, gap: 14 },
  section: { gap: 8 },
  placeName: { fontFamily: fonts.title, fontSize: 24, color: colors.yellow, paddingHorizontal: 4 },
  nameField: { height: 52, borderColor: colors.leisure },
  nights: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.night, borderRadius: 20, padding: 8 },
  nightsText: { fontFamily: fonts.bodyHeavy, fontSize: 16, color: colors.text },
  delete: { alignItems: 'center', marginTop: 4 },
  deleteBtn: { fontFamily: fonts.bodyHeavy, fontSize: 13, color: colors.textMuted, padding: 6 },
  footer: { paddingHorizontal: 18, paddingTop: 10, paddingBottom: 12, borderTopWidth: 1, borderTopColor: '#2B3370' },
});
