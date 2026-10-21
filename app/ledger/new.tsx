// 11e 행사 등록 시트 ("게시판에 붙이기", 디자인 v5 TURN 11). ?id= 가 있으면 고치기 · 지우기.

import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  EVENT_PAPER_COLOR,
  EVENT_TYPE_COLOR,
  EVENT_TYPE_LABEL,
  EVENT_TYPE_LINE,
  WEEKDAYS,
} from '../../src/copy/labels.ko';
import { newId } from '../../src/data/events';
import { dDayLabel, parseDayKey, today as getToday, weekdayOf, type DayKey } from '../../src/domain/day';
import { EVENT_NAME_MAX, EVENT_TYPES, REPEATABLE_TYPES, type EventType } from '../../src/domain/events';
import { useLedger } from '../../src/state/ledger';
import { EventIcon } from '../../src/ui/characters';
import { DatePicker } from '../../src/ui/components/form';
import { PrimaryButton } from '../../src/ui/components/PrimaryButton';
import { Field, FieldLabel, IjangBubble } from '../../src/ui/components/record/pickers';
import { colors, fonts } from '../../src/ui/theme';

const pad = (n: number) => String(n).padStart(2, '0');
const dateLabel = (d: DayKey) => {
  const { month, day } = parseDayKey(d);
  return `${pad(month)}.${pad(day)} (${WEEKDAYS[weekdayOf(d)]})`;
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
  const [type, setType] = useState<EventType>('birth');
  // 매년 반복: 생일·기념일에서만 보이고, 처음엔 켜져 있다 (디자인 11e)
  const [repeat, setRepeat] = useState(true);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!editing) return;
    setName(editing.name);
    setDate(editing.date);
    setType(editing.type);
    setRepeat(editing.repeatYearly);
  }, [editing]);

  const close = () => (router.canGoBack() ? router.back() : router.replace('/ledger'));
  const ready = name.trim().length > 0;
  const repeatable = REPEATABLE_TYPES.includes(type);
  const { month, day } = parseDayKey(date);

  const onSave = async () => {
    if (!ready || saving) return;
    setSaving(true);
    try {
      await save({
        id: editing?.id ?? newId('ev'),
        name: name.trim().slice(0, EVENT_NAME_MAX),
        date,
        type,
        repeatYearly: repeatable && repeat,
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
          <IjangBubble text={EVENT_TYPE_LINE[type]} />

          <View style={styles.section}>
            <FieldLabel>이름</FieldLabel>
            <Field
              value={name}
              onChangeText={setName}
              placeholder="예: 사파 여행"
              maxLength={EVENT_NAME_MAX}
              style={styles.nameField}
            />
          </View>

          <View style={styles.section}>
            <FieldLabel>날짜</FieldLabel>
            <View style={styles.dateRow}>
              <Text style={styles.dateText}>
                {dateLabel(date)} · <Text style={styles.dday}>{dDayLabel(date, today)}</Text>
              </Text>
            </View>
            <DatePicker value={date} onChange={setDate} min={editing ? undefined : today} selectedColor={EVENT_TYPE_COLOR[type]} />
          </View>

          <View style={styles.section}>
            <FieldLabel>분류</FieldLabel>
            <View style={styles.cats}>
              {EVENT_TYPES.map((k) => {
                const on = k === type;
                return (
                  <Pressable
                    key={k}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: on }}
                    onPress={() => setType(k)}
                    style={[styles.cat, on ? { backgroundColor: EVENT_TYPE_COLOR[k], ...styles.catOn } : styles.catOff]}
                  >
                    <View style={[styles.catIcon, { backgroundColor: on ? 'rgba(255,255,255,.45)' : EVENT_PAPER_COLOR[k] }]}>
                      <EventIcon type={k} size={20} small />
                    </View>
                    <Text style={[styles.catText, on && { color: colors.line }]}>{EVENT_TYPE_LABEL[k]}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {repeatable && (
            <Pressable
              accessibilityRole="switch"
              accessibilityState={{ checked: repeat }}
              onPress={() => setRepeat((r) => !r)}
              style={styles.repeat}
            >
              <View style={styles.repeatBody}>
                <Text style={styles.repeatTitle}>매년 반복</Text>
                <Text style={styles.repeatSub}>{repeat ? `매년 ${month}월 ${day}일에 다시 붙습니다` : '올해 한 번만 붙습니다'}</Text>
              </View>
              <View style={[styles.toggle, { backgroundColor: repeat ? colors.pink : colors.track, alignItems: repeat ? 'flex-end' : 'flex-start' }]}>
                <View style={styles.knob} />
              </View>
            </Pressable>
          )}

          {editing && (
            <View style={styles.delete}>
              <Text style={styles.deleteBtn} onPress={onDelete} accessibilityRole="button">
                {confirmDelete ? '네, 게시판에서 떼기' : '게시판에서 떼기 (지우기)'}
              </Text>
            </View>
          )}
        </ScrollView>
        <View style={styles.footer}>
          <PrimaryButton
            label={saving ? '붙이는 중…' : editing ? '고치기' : '게시판에 붙이기'}
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
  nameField: { height: 52, borderColor: colors.pink },
  dateRow: {
    height: 52,
    borderWidth: 2,
    borderColor: '#333C7A',
    backgroundColor: colors.night,
    borderRadius: 20,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  dateText: { fontFamily: fonts.number, fontSize: 14, color: colors.textSub },
  dday: { color: colors.yellow },
  cats: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cat: { height: 44, borderRadius: 22, paddingLeft: 8, paddingRight: 14, flexDirection: 'row', alignItems: 'center', gap: 6 },
  catOn: { borderBottomWidth: 3, borderBottomColor: 'rgba(16,20,46,.45)' },
  catOff: { backgroundColor: colors.night, borderWidth: 2, borderColor: '#333C7A' },
  catIcon: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  catText: { fontFamily: fonts.bodyHeavy, fontSize: 14, color: colors.text },
  repeat: {
    backgroundColor: colors.night,
    borderRadius: 20,
    paddingVertical: 12,
    paddingLeft: 16,
    paddingRight: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  repeatBody: { flex: 1, gap: 2 },
  repeatTitle: { fontFamily: fonts.bodyHeavy, fontSize: 15, color: colors.text },
  repeatSub: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.textSub },
  toggle: { width: 52, height: 30, borderRadius: 15, padding: 3, justifyContent: 'center' },
  knob: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.text },
  delete: { alignItems: 'center', marginTop: 4 },
  deleteBtn: { fontFamily: fonts.bodyHeavy, fontSize: 13, color: colors.textMuted, padding: 6 },
  footer: { paddingHorizontal: 18, paddingTop: 10, paddingBottom: 12, borderTopWidth: 1, borderTopColor: '#2B3370' },
});
