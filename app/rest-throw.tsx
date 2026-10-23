// 15b 장작 던지기 시트 (모달). 쉼 기록 입력 두 곳 중 하나 (다른 하나는 기록 시트의 쉼 칸) — 같은 쉼 기록 테이블에 저장한다.
// 말하듯 한 줄 적으면 규칙 기반으로 태그를 읽고(서버 · AI 없음), 크기는 한 번 탭한다. 사진은 용량 · 백업 문제로 보류(버튼 숨김).
// 장작만 던진 날은 기록일이 아니다 — 씨앗 · 경험치는 기록 시트 저장에서만 받는다.

import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TAG_KIND_LABEL, throwCopy } from '../src/copy/rest.ko';
import { WEEKDAYS } from '../src/copy/labels.ko';
import { newId } from '../src/data/events';
import { parseDayKey, today as getToday, weekdayOf, type DayKey } from '../src/domain/day';
import {
  DEFAULT_REST_SIZE,
  REST_TEXT_MAX,
  type RestSize,
  type RestTag,
  type RestTagKind,
} from '../src/domain/fire';
import { footprintFor, samePlace, type Place } from '../src/domain/rest';
import { addTag, isKnownPlace, refreshTags } from '../src/domain/restTags';
import { useNeighbors } from '../src/state/neighbors';
import { usePlaces } from '../src/state/places';
import { useRestLogs } from '../src/state/restLogs';
import { PrimaryButton } from '../src/ui/components/PrimaryButton';
import { FieldLabel, IjangBubble } from '../src/ui/components/record/pickers';
import { SizePicker } from '../src/ui/components/record/SizePicker';
import { colors, fonts } from '../src/ui/theme';

const KIND_COLOR: Record<RestTagKind, string> = {
  activity: colors.leisure,
  neighbor: colors.relation,
  place: colors.health,
  etc: colors.yellow,
};

const isDayKey = (s: unknown): s is DayKey => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);
const same = (a: RestTag, b: RestTag) => a.kind === b.kind && a.label === b.label && a.ref === b.ref;

export default function RestThrowSheet() {
  const params = useLocalSearchParams<{ date?: string }>();
  const today = getToday();
  const date: DayKey = isDayKey(params.date) ? params.date : today;

  const neighbors = useNeighbors((s) => s.list);
  const loadNeighbors = useNeighbors((s) => s.load);
  const places = usePlaces((s) => s.places);
  const loadPlaces = usePlaces((s) => s.load);
  const throwLog = useRestLogs((s) => s.throwLog);

  const [text, setText] = useState('');
  const [size, setSize] = useState<RestSize>(DEFAULT_REST_SIZE);
  const [removed, setRemoved] = useState<RestTag[]>([]);
  const [manual, setManual] = useState<RestTag[]>([]);
  const [footprint, setFootprint] = useState(true);
  const [adding, setAdding] = useState(false);
  const [placeText, setPlaceText] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([loadNeighbors(), loadPlaces()]).catch((e) => console.warn('[throw] load failed', e));
  }, [loadNeighbors, loadPlaces]);

  const placeNames = useMemo(() => places.map((p) => p.name), [places]);
  const tags = useMemo(
    () =>
      refreshTags(
        text,
        { neighbors: neighbors.map((n) => ({ id: n.id, name: n.name })), places: placeNames },
        removed,
        manual,
      ),
    [text, neighbors, placeNames, removed, manual],
  );
  const placeTags = tags.filter((t) => t.kind === 'place');

  const dropTag = (t: RestTag) => {
    if (manual.some((m) => same(m, t))) setManual((m) => m.filter((x) => !same(x, t)));
    else setRemoved((r) => [...r, t]);
  };
  const commitPlace = () => {
    const label = placeText.trim();
    if (label) {
      const tag: RestTag = { kind: 'place', label };
      setRemoved((r) => r.filter((x) => !same(x, tag)));
      setManual((m) => addTag(m, tag));
    }
    setPlaceText('');
    setAdding(false);
  };

  const close = () => (router.canGoBack() ? router.back() : router.replace('/rest'));
  const ready = text.trim().length > 0 && !saving;

  const onThrow = async () => {
    if (!ready) return;
    setSaving(true);
    setError(null);
    try {
      const now = Date.now();
      const id = newId('rl');
      const log = { id, date, text: text.trim().slice(0, REST_TEXT_MAX), tags, size, createdAt: now };
      // 장소 태그 → 지도에 발자국 (깃발이 있으면 그 깃발이 발자국이 된다)
      const feet: Place[] = [];
      if (footprint) {
        for (const [i, t] of placeTags.entries()) {
          if (feet.some((p) => samePlace(p.name, t.label))) continue;
          feet.push(footprintFor(t.label, date, id, [...places].filter((p) => !feet.some((f) => f.id === p.id)), newId('pl', now + i), now + i));
        }
      }
      await throwLog(log, feet);
      close();
    } catch (e) {
      console.warn('[throw] save failed', e);
      setError('던지지 못했습니다. 다시 시도해 주세요.');
      setSaving(false);
    }
  };

  const { month, day } = parseDayKey(date);
  const dateLabel = `${month}.${String(day).padStart(2, '0')} (${WEEKDAYS[weekdayOf(date)]})`;
  const footprintNames = placeTags.map((t) => t.label);

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.root}>
      <View style={styles.handle} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" indicatorStyle="white">
          <IjangBubble text={throwCopy.bubble} />
          <View style={styles.titleRow}>
            <Text style={styles.title}>{throwCopy.title}</Text>
            <Text style={styles.date}>{dateLabel}</Text>
          </View>

          <View style={styles.section}>
            <FieldLabel>{throwCopy.prompt}</FieldLabel>
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

          <View style={styles.section}>
            <FieldLabel>{throwCopy.recognized}</FieldLabel>
            <View style={styles.tags}>
              {tags.map((t) => (
                <View key={`${t.kind}:${t.ref ?? ''}:${t.label}`} style={[styles.tag, { borderColor: KIND_COLOR[t.kind] }]}>
                  <View style={[styles.tagDot, { backgroundColor: KIND_COLOR[t.kind] }]} />
                  <Text style={styles.tagText} accessibilityLabel={`${TAG_KIND_LABEL[t.kind]} ${t.label}`}>
                    {t.label}
                  </Text>
                  <Pressable accessibilityRole="button" accessibilityLabel={`${t.label} 빼기`} hitSlop={8} onPress={() => dropTag(t)}>
                    <Text style={styles.tagX}>×</Text>
                  </Pressable>
                </View>
              ))}
              {adding ? (
                <TextInput
                  autoFocus
                  value={placeText}
                  onChangeText={setPlaceText}
                  onSubmitEditing={commitPlace}
                  onBlur={commitPlace}
                  placeholder={throwCopy.addPlaceHolder}
                  placeholderTextColor={colors.tabInactive}
                  maxLength={20}
                  returnKeyType="done"
                  style={styles.addInput}
                />
              ) : (
                <Pressable accessibilityRole="button" onPress={() => setAdding(true)} style={styles.addTag}>
                  <Text style={styles.addTagText}>{throwCopy.addPlace}</Text>
                </Pressable>
              )}
            </View>
            {tags.length === 0 && !adding && <Text style={styles.hint}>{throwCopy.noTags}</Text>}
          </View>

          <View style={styles.section}>
            <FieldLabel>{throwCopy.howLong}</FieldLabel>
            <SizePicker value={size} onChange={setSize} />
          </View>

          {footprintNames.length > 0 && (
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: footprint }}
              onPress={() => setFootprint((f) => !f)}
              style={styles.footprint}
            >
              <View style={[styles.check, footprint && styles.checkOn]}>{footprint && <Text style={styles.checkMark}>✓</Text>}</View>
              <Text style={styles.footprintText}>
                {footprintNames.length === 1 ? throwCopy.footprint(footprintNames[0]) : throwCopy.footprintMany(footprintNames)}
              </Text>
            </Pressable>
          )}

          {error && <Text style={styles.error}>{error}</Text>}
        </ScrollView>

        <View style={styles.footer}>
          <PrimaryButton label={saving ? throwCopy.throwing : throwCopy.throwBtn} onPress={onThrow} disabled={!ready} />
          {text.trim().length === 0 && <Text style={styles.need}>{throwCopy.need}</Text>}
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
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  title: { fontFamily: fonts.title, fontSize: 22, color: colors.yellow },
  date: { fontFamily: fonts.number, fontSize: 13, color: colors.textSub },
  section: { gap: 8 },
  input: {
    minHeight: 76,
    borderWidth: 2,
    borderColor: colors.leisure,
    backgroundColor: colors.night,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    lineHeight: 22,
    color: colors.text,
    textAlignVertical: 'top',
  },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 36,
    paddingLeft: 12,
    paddingRight: 10,
    borderRadius: 18,
    borderWidth: 2,
    backgroundColor: colors.night,
  },
  tagDot: { width: 8, height: 8, borderRadius: 4 },
  tagText: { fontFamily: fonts.bodyHeavy, fontSize: 14, color: colors.text },
  tagX: { fontFamily: fonts.bodyHeavy, fontSize: 18, lineHeight: 20, color: colors.textMuted },
  addTag: { height: 36, paddingHorizontal: 14, borderRadius: 18, borderWidth: 2, borderStyle: 'dashed', borderColor: '#333C7A', justifyContent: 'center' },
  addTagText: { fontFamily: fonts.bodyHeavy, fontSize: 13, color: colors.textSub },
  addInput: {
    minWidth: 120,
    height: 36,
    paddingHorizontal: 12,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: colors.health,
    backgroundColor: colors.night,
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: colors.text,
  },
  hint: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.textMuted, paddingLeft: 4 },
  footprint: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.night, borderRadius: 20, padding: 12 },
  check: { width: 24, height: 24, borderRadius: 8, borderWidth: 2, borderColor: '#4A5290', alignItems: 'center', justifyContent: 'center' },
  checkOn: { backgroundColor: colors.health, borderColor: colors.health },
  checkMark: { fontFamily: fonts.bodyHeavy, fontSize: 14, color: colors.line },
  footprintText: { flex: 1, fontFamily: fonts.bodyHeavy, fontSize: 14, color: colors.text },
  error: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.pinkSoft, textAlign: 'center' },
  footer: { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 12, gap: 6 },
  need: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.textMuted, textAlign: 'center' },
});
