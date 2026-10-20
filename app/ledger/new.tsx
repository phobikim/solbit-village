// 8c 행사 등록 시트 ("현수막 걸기"). ?id= 가 있으면 고치기 · 지우기.

import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ijangLines } from '../../src/copy/broadcasts.ko';
import { EVENT_TYPE_COLOR, EVENT_TYPE_LABEL, WEEKDAYS } from '../../src/copy/labels.ko';
import { newId } from '../../src/data/events';
import { dDayLabel, parseDayKey, today as getToday, weekdayOf, type DayKey } from '../../src/domain/day';
import { EVENT_NAME_MAX, type EventType } from '../../src/domain/events';
import { useLedger } from '../../src/state/ledger';
import { ChoiceChips, DatePicker } from '../../src/ui/components/form';
import { PrimaryButton } from '../../src/ui/components/PrimaryButton';
import { Field, FieldLabel, IjangBubble } from '../../src/ui/components/record/pickers';
import { colors, fonts } from '../../src/ui/theme';

const TYPES = (Object.keys(EVENT_TYPE_LABEL) as EventType[]).map((value) => ({ value, label: EVENT_TYPE_LABEL[value] }));

const dateLabel = (d: DayKey) => {
  const { year, month, day } = parseDayKey(d);
  return `${year}.${String(month).padStart(2, '0')}.${String(day).padStart(2, '0')} (${WEEKDAYS[weekdayOf(d)]})`;
};

export default function EventSheet() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const today = getToday();
  const events = useLedger((s) => s.events);
  const save = useLedger((s) => s.save);
  const remove = useLedger((s) => s.remove);
  const editing = id ? events.find((e) => e.id === id) : undefined;

  const [name, setName] = useState('');
  const [date, setDate] = useState<DayKey>(today);
  const [type, setType] = useState<EventType>('anniversary');
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!editing) return;
    setName(editing.name);
    setDate(editing.date);
    setType(editing.type);
  }, [editing]);

  const close = () => (router.canGoBack() ? router.back() : router.replace('/ledger'));
  const ready = name.trim().length > 0;

  const onSave = async () => {
    if (!ready || saving) return;
    setSaving(true);
    try {
      await save({
        id: editing?.id ?? newId('ev'),
        name: name.trim().slice(0, EVENT_NAME_MAX),
        date,
        type,
        createdAt: editing?.createdAt ?? Date.now(),
      });
      close();
    } catch (e) {
      console.warn('[event] save failed', e);
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
          <IjangBubble text={editing ? ijangLines.eventEdit : ijangLines.eventNew} />
          <Text style={styles.title}>{editing ? '행사 고치기' : '새 행사'}</Text>

          <View style={styles.section}>
            <FieldLabel>이름</FieldLabel>
            <Field value={name} onChangeText={setName} placeholder="예: 엄마 생신" maxLength={EVENT_NAME_MAX} />
          </View>

          <View style={styles.section}>
            <FieldLabel>날짜</FieldLabel>
            <View style={styles.dateRow}>
              <Text style={styles.dateText}>{dateLabel(date)}</Text>
              <Text style={styles.dday}>{dDayLabel(date, today)}</Text>
            </View>
            <DatePicker value={date} onChange={setDate} min={editing ? undefined : today} />
          </View>

          <View style={styles.section}>
            <FieldLabel>종류</FieldLabel>
            <ChoiceChips options={TYPES} value={type} onChange={setType} activeColor={EVENT_TYPE_COLOR[type]} />
          </View>

          {editing && (
            <View style={styles.delete}>
              <Text style={styles.deleteBtn} onPress={onDelete} accessibilityRole="button">
                {confirmDelete ? '네, 현수막 내리기' : '현수막 내리기 (지우기)'}
              </Text>
            </View>
          )}
        </ScrollView>
        <View style={styles.footer}>
          <PrimaryButton label={saving ? '거는 중…' : editing ? '고치기' : '현수막 걸기'} onPress={onSave} disabled={!ready || saving} />
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
  title: { fontFamily: fonts.title, fontSize: 22, color: colors.yellow },
  section: { gap: 6 },
  dateRow: {
    height: 48,
    borderWidth: 2,
    borderColor: '#333C7A',
    backgroundColor: colors.night,
    borderRadius: 20,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateText: { fontFamily: fonts.number, fontSize: 15, color: colors.text },
  dday: { fontFamily: fonts.numberBold, fontSize: 13, color: colors.pink },
  delete: { alignItems: 'center', marginTop: 8 },
  deleteBtn: { fontFamily: fonts.bodyHeavy, fontSize: 13, color: colors.textMuted, padding: 6 },
  footer: { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 12 },
});
