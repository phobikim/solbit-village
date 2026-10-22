// 보따리에 담기 시트 (쉼터). ?id= 가 있으면 고치기 · 빼기. 다녀온 곳이면 언제 · 며칠 다녀왔는지 적는다.

import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PLACE_DURATION_LABEL, restCopy, tripLength } from '../src/copy/rest.ko';
import { newId } from '../src/data/events';
import { today as getToday, type DayKey } from '../src/domain/day';
import { PLACE_DURATIONS, PLACE_NAME_MAX, PLACE_NIGHTS_MAX, type PlaceDuration } from '../src/domain/rest';
import { usePlaces } from '../src/state/places';
import { ChoiceChips, DatePicker } from '../src/ui/components/form';
import { PrimaryButton } from '../src/ui/components/PrimaryButton';
import { Field, FieldLabel, IjangBubble } from '../src/ui/components/record/pickers';
import { RoundButton } from '../src/ui/components/RoundButton';
import { colors, fonts } from '../src/ui/theme';

const DURATIONS = PLACE_DURATIONS.map((value) => ({ value, label: PLACE_DURATION_LABEL[value] }));
const STATUS = [
  { value: 'wish', label: restCopy.wish },
  { value: 'visited', label: restCopy.visited },
] as const;

export default function PlaceSheet() {
  const { id, visited: visitedParam } = useLocalSearchParams<{ id?: string; visited?: string }>();
  const today = getToday();
  const places = usePlaces((s) => s.places);
  const save = usePlaces((s) => s.save);
  const remove = usePlaces((s) => s.remove);
  const editing = id ? places.find((p) => p.id === id) : undefined;

  const [name, setName] = useState('');
  const [duration, setDuration] = useState<PlaceDuration>('half');
  const [status, setStatus] = useState<'wish' | 'visited'>(visitedParam === '1' ? 'visited' : 'wish');
  const [visitedDate, setVisitedDate] = useState<DayKey>(today);
  const [nights, setNights] = useState(0);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!editing) return;
    setName(editing.name);
    setDuration(editing.duration);
    setStatus(editing.visited ? 'visited' : 'wish');
    setVisitedDate(editing.visitedDate ?? today);
    setNights(editing.nights);
  }, [editing, today]);

  const close = () => (router.canGoBack() ? router.back() : router.replace('/rest'));
  const ready = name.trim().length > 0;
  const visited = status === 'visited';

  const onSave = async () => {
    if (!ready || saving) return;
    setSaving(true);
    try {
      await save({
        id: editing?.id ?? newId('pl'),
        name: name.trim().slice(0, PLACE_NAME_MAX),
        duration,
        visited,
        eventId: editing?.eventId ?? null,
        visitedDate: visited ? visitedDate : null,
        nights: visited ? nights : 0,
        addedDate: editing?.addedDate ?? today,
        createdAt: editing?.createdAt ?? Date.now(),
      });
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

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.root}>
      <View style={styles.handle} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" indicatorStyle="white">
          <IjangBubble text={editing ? restCopy.placeEdit : restCopy.placeNew} />

          <View style={styles.section}>
            <FieldLabel>어디</FieldLabel>
            <Field value={name} onChangeText={setName} placeholder="예: 강릉 바다" maxLength={PLACE_NAME_MAX} style={styles.nameField} />
          </View>

          <View style={styles.section}>
            <FieldLabel>얼마나 걸려요</FieldLabel>
            <ChoiceChips options={DURATIONS} value={duration} onChange={setDuration} activeColor={colors.leisure} />
          </View>

          <View style={styles.section}>
            <FieldLabel>보따리 칸</FieldLabel>
            <ChoiceChips options={STATUS} value={status} onChange={setStatus} activeColor={colors.leisure} />
          </View>

          {visited && (
            <>
              <View style={styles.section}>
                <FieldLabel>언제 갔어요</FieldLabel>
                <DatePicker value={visitedDate} onChange={setVisitedDate} selectedColor={colors.leisure} />
              </View>
              <View style={styles.section}>
                <FieldLabel>며칠</FieldLabel>
                <View style={styles.nights}>
                  <RoundButton icon="prev" variant="card" size={36} accessibilityLabel="하루 줄이기" disabled={nights === 0} onPress={() => setNights((n) => Math.max(0, n - 1))} />
                  <Text style={styles.nightsText}>{tripLength(nights)}</Text>
                  <RoundButton
                    icon="next"
                    variant="card"
                    size={36}
                    accessibilityLabel="하루 늘리기"
                    disabled={nights >= PLACE_NIGHTS_MAX}
                    onPress={() => setNights((n) => Math.min(PLACE_NIGHTS_MAX, n + 1))}
                  />
                </View>
              </View>
            </>
          )}

          {editing && (
            <View style={styles.delete}>
              <Text style={styles.deleteBtn} onPress={onDelete} accessibilityRole="button">
                {confirmDelete ? '네, 보따리에서 빼기' : '보따리에서 빼기 (지우기)'}
              </Text>
            </View>
          )}
        </ScrollView>
        <View style={styles.footer}>
          <PrimaryButton label={saving ? '담는 중…' : editing ? '고치기' : '보따리에 담기'} onPress={onSave} disabled={!ready || saving} />
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
  nameField: { height: 52, borderColor: colors.leisure },
  nights: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.night, borderRadius: 20, padding: 8 },
  nightsText: { fontFamily: fonts.bodyHeavy, fontSize: 16, color: colors.text },
  delete: { alignItems: 'center', marginTop: 4 },
  deleteBtn: { fontFamily: fonts.bodyHeavy, fontSize: 13, color: colors.textMuted, padding: 6 },
  footer: { paddingHorizontal: 18, paddingTop: 10, paddingBottom: 12, borderTopWidth: 1, borderTopColor: '#2B3370' },
});
