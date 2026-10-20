// 기록 시트(9a)의 선택 칸: 컨디션 · 일 강도 · 여가 칩 · 텍스트 입력 · 이장 말풍선

import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { WORK_LABEL } from '../../../copy/labels.ko';
import { LEISURE_MAX_LENGTH, LEISURE_PRESETS } from '../../../domain/records';
import type { Condition, WorkLevel } from '../../../domain/types';
import { Ijang, Soli, type SoliMood } from '../../characters';
import { colors, fonts, workColor } from '../../theme';

export function FieldLabel({ children, optional }: { children: string; optional?: boolean }) {
  return (
    <Text style={styles.label}>
      {children}
      {optional && <Text style={styles.optional}> (선택)</Text>}
    </Text>
  );
}

export function IjangBubble({ text }: { text: string }) {
  return (
    <View style={styles.bubbleRow}>
      <Ijang mood="base" size={52} />
      <View style={styles.bubble}>
        <Text style={styles.bubbleText}>{text}</Text>
      </View>
    </View>
  );
}

const CONDITIONS: { value: Condition; mood: SoliMood; label: string }[] = [
  { value: 1, mood: 'tired', label: '지침' },
  { value: 2, mood: 'normal', label: '보통' },
  { value: 3, mood: 'happy', label: '신남' },
];

export function ConditionPicker({ value, onChange }: { value: Condition | null; onChange: (v: Condition) => void }) {
  return (
    <View style={styles.row3}>
      {CONDITIONS.map((c) => {
        const on = value === c.value;
        return (
          <Pressable
            key={c.value}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
            accessibilityLabel={`컨디션 ${c.label}`}
            onPress={() => onChange(c.value)}
            style={[styles.condition, on && styles.conditionOn]}
          >
            <Soli mood={c.mood} size={38} />
            <Text style={[styles.optionText, on && styles.optionTextOn]}>{c.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const WORK_COLOR: Record<WorkLevel, string> = { 1: workColor(0), 2: '#FF9A3C', 3: workColor(100) };

export function WorkPicker({ value, onChange }: { value: WorkLevel | null; onChange: (v: WorkLevel) => void }) {
  return (
    <View style={styles.row3}>
      {([1, 2, 3] as const).map((w) => {
        const on = value === w;
        return (
          <Pressable
            key={w}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
            accessibilityLabel={`일 강도 ${w} ${WORK_LABEL[w]}`}
            onPress={() => onChange(w)}
            style={[styles.work, on && { backgroundColor: WORK_COLOR[w] }]}
          >
            <Text style={[styles.workNum, { color: on ? colors.line : WORK_COLOR[w] }]}>{w}</Text>
            <Text style={[styles.optionText, on && styles.optionTextOn]}>{WORK_LABEL[w]}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Field(props: TextInputProps) {
  return <TextInput placeholderTextColor={colors.tabInactive} {...props} style={[styles.field, props.style]} />;
}

export function LeisurePicker({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [adding, setAdding] = useState(false);
  const [text, setText] = useState('');
  const custom = value.filter((v) => !(LEISURE_PRESETS as readonly string[]).includes(v));
  const toggle = (l: string) => onChange(value.includes(l) ? value.filter((x) => x !== l) : [...value, l]);
  const commit = () => {
    const t = text.trim();
    if (t && !value.includes(t)) onChange([...value, t]);
    setText('');
    setAdding(false);
  };
  return (
    <View style={styles.chips}>
      {[...LEISURE_PRESETS, ...custom].map((l) => {
        const on = value.includes(l);
        return (
          <Pressable
            key={l}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: on }}
            onPress={() => toggle(l)}
            style={[styles.chip, on && styles.chipOn]}
          >
            <Text style={[styles.chipText, on && styles.optionTextOn]}>{l}</Text>
          </Pressable>
        );
      })}
      {adding ? (
        <TextInput
          autoFocus
          value={text}
          onChangeText={setText}
          onSubmitEditing={commit}
          onBlur={commit}
          maxLength={LEISURE_MAX_LENGTH}
          placeholder="뭐 하셨어요"
          placeholderTextColor={colors.tabInactive}
          returnKeyType="done"
          style={[styles.chip, styles.chipInput]}
        />
      ) : (
        <Pressable accessibilityRole="button" onPress={() => setAdding(true)} style={[styles.chip, styles.chipAdd]}>
          <Text style={[styles.chipText, { color: colors.textSub }]}>+ 직접 입력</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontFamily: fonts.bodyHeavy, fontSize: 13, color: colors.textSub },
  optional: { color: colors.textMuted },
  bubbleRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
  bubble: {
    flexShrink: 1,
    backgroundColor: colors.text,
    borderRadius: 18,
    borderBottomLeftRadius: 6,
    paddingVertical: 9,
    paddingHorizontal: 13,
    marginBottom: 8,
  },
  bubbleText: { fontFamily: fonts.bodyHeavy, fontSize: 14, lineHeight: 20, color: colors.line },
  row3: { flexDirection: 'row', gap: 8 },
  condition: {
    flex: 1,
    height: 68,
    borderRadius: 20,
    backgroundColor: colors.night,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  conditionOn: { backgroundColor: colors.yellow },
  optionText: { fontFamily: fonts.bodyHeavy, fontSize: 14, color: colors.text },
  optionTextOn: { color: colors.line },
  work: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.night,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  workNum: { fontFamily: fonts.numberBold, fontSize: 17 },
  field: {
    height: 44,
    borderWidth: 2,
    borderColor: '#333C7A',
    backgroundColor: colors.night,
    borderRadius: 20,
    paddingHorizontal: 16,
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    color: colors.text,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: colors.night,
    justifyContent: 'center',
  },
  chipOn: { backgroundColor: colors.leisure },
  chipText: { fontFamily: fonts.bodyHeavy, fontSize: 13, color: colors.text },
  chipAdd: { backgroundColor: 'transparent', borderWidth: 2, borderStyle: 'dashed', borderColor: colors.disabled, paddingHorizontal: 12 },
  chipInput: {
    minWidth: 110,
    borderWidth: 2,
    borderColor: colors.leisure,
    fontFamily: fonts.bodyHeavy,
    fontSize: 13,
    color: colors.text,
  },
});
