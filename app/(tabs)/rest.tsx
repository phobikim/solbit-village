// 쉼터 · 모닥불 (디자인 v8 15a). 쉼 지수를 모닥불 불길로 보여주고, 불이 사그라들면 이장이 보따리 깃발에서 쪽지를 꺼낸다.
// 장작 던지기(15b)는 /rest-throw, 보따리 지도(15c)는 /place-map. 지침 신호 · 1년 전 오늘은 src/ui/features.ts에서 꺼 두었다.

import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { withPrefix } from '../../src/copy/broadcasts.ko';
import {
  DAY_NAME,
  FIRE_LINE,
  mapCopy,
  noteButton,
  noteCopy,
  noteLine,
  noteNoFreeDay,
  REST_BROADCAST,
  restCopy,
  sinceFireLabel,
  WEEK_LABELS,
  yearAgoLine,
} from '../../src/copy/rest.ko';
import { newId } from '../../src/data/events';
import { savePlaces } from '../../src/data/places';
import { getSetting, setSetting, SETTING } from '../../src/data/settings';
import { parseDayKey, today as getToday, weekdayOf, type DayKey } from '../../src/domain/day';
import { EVENT_NAME_MAX } from '../../src/domain/events';
import { keptDays, settleTrips } from '../../src/domain/rest';
import {
  drawNote,
  freeWeekendDay,
  noteOpen,
  parseNoteState,
  pruneNoteState,
  todayNote,
  weekWord,
  type NoteState,
} from '../../src/domain/restNote';
import { useLedger } from '../../src/state/ledger';
import { usePlaces } from '../../src/state/places';
import { useRecords } from '../../src/state/records';
import { useRestLogs } from '../../src/state/restLogs';
import { restRange, useRestView } from '../../src/state/restView';
import { Ijang } from '../../src/ui/characters';
import { indexIconSvg } from '../../src/ui/characters/icons';
import { fireHeight, fireSvg } from '../../src/ui/characters/restIcons';
import { Screen } from '../../src/ui/components/Screen';
import { REST_FEATURES } from '../../src/ui/features';
import { colors, fonts } from '../../src/ui/theme';

/** 불 상태 제목 색 (디자인 15a: 사그라들 때 주황) */
const FIRE_COLOR = { none: colors.textSub, blaze: '#FFC23C', burning: '#FFA13C', dying: '#FF9A3C', out: '#FF8A5C' } as const;
/** 이번 주 월 ~ 일 중 오늘 칸 (0 = 월) */
const weekCol = (d: DayKey) => (weekdayOf(d) + 6) % 7;

const timeLabel = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
const dotted = (d: DayKey) => {
  const { year, month, day } = parseDayKey(d);
  return `${year}.${String(month).padStart(2, '0')}.${String(day).padStart(2, '0')}`;
};

export default function RestScreen() {
  const today = getToday();
  const [notice, setNotice] = useState<string | null>(null);
  const [noteState, setNoteState] = useState<NoteState | null>(null);
  const byDate = useRecords((s) => s.byDate);
  const loadRange = useRecords((s) => s.loadRange);
  const places = usePlaces((s) => s.places);
  const loadPlaces = usePlaces((s) => s.load);
  const savePlace = usePlaces((s) => s.save);
  const logs = useRestLogs((s) => s.logs);
  const loadLogs = useRestLogs((s) => s.load);
  const events = useLedger((s) => s.events);
  const ledgerLoaded = useLedger((s) => s.loaded);
  const loadLedger = useLedger((s) => s.load);
  const saveEvent = useLedger((s) => s.save);

  // 들어올 때: 읽고, 쪽지 기억을 읽는다
  useFocusEffect(
    useCallback(() => {
      setNotice(null);
      const { from, to } = restRange(today);
      (async () => {
        await Promise.all([loadRange(from, to), loadPlaces(), loadLedger(), loadLogs()]);
        setNoteState(parseNoteState(await getSetting(SETTING.restNote)));
      })().catch((e) => console.warn('[rest] load failed', e));
    }, [today, loadRange, loadPlaces, loadLedger, loadLogs]),
  );

  // 깃발 → 발자국 (행사 날이 지난 깃발, 행사를 지워 날짜가 사라진 깃발)
  useEffect(() => {
    if (!ledgerLoaded) return;
    const changed = settleTrips(places, events, today);
    if (!changed.length) return;
    savePlaces(changed)
      .then(loadPlaces)
      .catch((e) => console.warn('[rest] settle failed', e));
  }, [places, events, ledgerLoaded, today, loadPlaces]);

  const v = useRestView(byDate, places, logs, today);
  const open = noteOpen(v.band);

  const draw = useMemo(() => (open && noteState ? todayNote(places, noteState, today) : null), [open, noteState, places, today]);

  // 오늘 새 쪽지를 꺼냈으면 기억해 둔다 (같은 장소는 7일 안에 다시 안 나온다)
  useEffect(() => {
    if (!draw || !noteState || draw.state === noteState) return;
    const next = pruneNoteState(draw.state, places, today);
    setNoteState(next);
    setSetting(SETTING.restNote, JSON.stringify(next)).catch((e) => console.warn('[rest] note save failed', e));
  }, [draw, noteState, places, today]);

  const freeDay = useMemo(() => freeWeekendDay(events, today), [events, today]);
  const note = draw?.place ?? null;
  const dayName = freeDay ? DAY_NAME[weekdayOf(freeDay)] : null;

  const onOther = () => {
    if (!noteState) return;
    const next = drawNote(places, noteState, today);
    if (!next) return setNotice(noteCopy.noMore);
    setNoteState(next.state);
    setSetting(SETTING.restNote, JSON.stringify(next.state)).catch((e) => console.warn('[rest] note save failed', e));
  };

  /** [토요일에 찜]: 대소사에 여행 행사를 만들고 깃발에 잇는다 → 깃발에 D-day */
  const onPick = async () => {
    if (!note || !freeDay || !dayName) return;
    const e = {
      id: newId('ev'),
      name: `${note.name} 여행`.slice(0, EVENT_NAME_MAX),
      date: freeDay,
      type: 'travel' as const,
      repeatYearly: false,
      createdAt: Date.now(),
    };
    await saveEvent(e);
    await savePlace({ ...note, eventId: e.id, nights: 0 });
    setNotice(`${note.name}, ${dayName}에 찜해 놨슈. 깃발에 날짜 붙였슈.`);
  };

  const band = v.band ?? 'none';
  const todayCol = weekCol(today);

  return (
    <Screen title="쉼터" broadcast={{ message: withPrefix(notice ?? REST_BROADCAST[band]), time: timeLabel(new Date()) }}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* 모닥불 카드 (디자인 15a): 불 · 상태 · 이번 주 장작 · 장작 던지기 */}
        <View style={styles.card}>
          <SvgXml xml={fireSvg(v.band)} width={200} height={fireHeight(v.band)} style={styles.fire} />
          <Text style={[styles.fireLine, { color: FIRE_COLOR[band] }]}>{FIRE_LINE[band]}</Text>
          <Text style={styles.fireSub}>
            {restCopy.statusTitle} <Text style={styles.fireNum}>{v.rest ?? '-'}</Text> · {sinceFireLabel(v.sinceFire)}
          </Text>
          <View style={styles.weekBox}>
            <Text style={styles.weekTitle}>이번 주 장작</Text>
            <View style={styles.week}>
              {WEEK_LABELS.map((w, i) => (
                <View key={w} style={styles.day}>
                  <View style={[styles.pill, v.week[i] && styles.pillOn]} />
                  <Text style={[styles.dayLabel, i === todayCol && styles.dayToday]}>{w}</Text>
                </View>
              ))}
            </View>
          </View>
          <Pressable accessibilityRole="button" onPress={() => router.push('/rest-throw')} style={({ pressed }) => [styles.throwBtn, pressed && styles.throwPressed]}>
            <Text style={styles.throwText}>장작 던지기</Text>
          </Pressable>
        </View>

        {REST_FEATURES.signal && v.signal && (
          <View style={styles.signal}>
            <View style={styles.signalHead}>
              <Text style={styles.signalTitle}>{restCopy.signalTitle}</Text>
              <Text style={styles.signalSub}>{restCopy.signalSub}</Text>
            </View>
            <View style={styles.signalCells}>
              {(
                [
                  ['work', '일', v.signal.work],
                  ['leisure', '쉼', v.signal.rest],
                  ['health', '건강', v.signal.health],
                ] as const
              ).map(([k, label, value]) => (
                <View key={k} style={styles.signalCell}>
                  <SvgXml xml={indexIconSvg(k, colors.leisure, '#2E3775')} width={18} height={18} />
                  <Text style={styles.signalLabel}>{label}</Text>
                  <Text style={styles.signalValue}>{value}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.signalLine}>{v.signal.line}</Text>
          </View>
        )}

        {open && (
          <View style={styles.noteWrap}>
            <View style={styles.bubbleRow}>
              <Ijang mood="base" size={52} />
              <View style={styles.bubble}>
                <Text style={styles.bubbleText}>{noteCopy.intro}</Text>
              </View>
            </View>
            {note ? (
              <View style={styles.note}>
                <Text style={styles.noteHeader}>{noteCopy.header}</Text>
                <Text style={styles.noteText}>
                  {freeDay && dayName
                    ? noteLine(note.name, keptDays(note, today), weekWord(freeDay, today), dayName)
                    : noteNoFreeDay(note.name, keptDays(note, today))}
                </Text>
                <View style={styles.noteBtns}>
                  <Pressable accessibilityRole="button" onPress={onOther} style={[styles.btn, styles.btnSub]}>
                    <Text style={[styles.btnText, { color: colors.text }]}>{noteCopy.other}</Text>
                  </Pressable>
                  {freeDay && dayName && (
                    <Pressable accessibilityRole="button" onPress={onPick} style={[styles.btn, styles.btnPink]}>
                      <Text style={styles.btnText}>{noteButton(dayName)}</Text>
                    </Pressable>
                  )}
                </View>
              </View>
            ) : (
              <Text style={styles.empty}>{noteCopy.empty}</Text>
            )}
          </View>
        )}

        <Pressable accessibilityRole="button" onPress={() => router.push('/place-map')} style={styles.mapRow}>
          <View style={styles.mapBody}>
            <Text style={styles.mapTitle}>{mapCopy.title}</Text>
            <Text style={styles.mapSub}>{mapCopy.mapRow(v.visited.length, v.wish.length)}</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </Pressable>

        {REST_FEATURES.yearAgo && v.yearAgo && (
          <View style={styles.yearAgo}>
            <Ijang mood="base" size={44} />
            <View style={styles.body}>
              <Text style={styles.yearAgoDate}>
                {restCopy.yearAgoTitle} · {dotted(v.yearAgo.date)}
              </Text>
              <Text style={styles.yearAgoText}>{yearAgoLine(v.yearAgo.place.name)}</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 12, gap: 12, paddingBottom: 24 },
  card: { backgroundColor: colors.cardSub, borderRadius: 28, paddingTop: 14, paddingBottom: 16, paddingHorizontal: 16, alignItems: 'center', gap: 6 },
  fire: { marginBottom: 2 },
  fireLine: { fontFamily: fonts.title, fontSize: 26, lineHeight: 32, textAlign: 'center' },
  fireSub: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.textSub, textAlign: 'center', marginBottom: 8 },
  fireNum: { fontFamily: fonts.numberBold, fontSize: 15, color: colors.text },
  weekBox: { alignSelf: 'stretch', backgroundColor: '#141A44', borderRadius: 20, paddingVertical: 10, paddingHorizontal: 14, gap: 8 },
  weekTitle: { fontFamily: fonts.bodyHeavy, fontSize: 13, color: colors.textSub },
  week: { flexDirection: 'row', justifyContent: 'space-between' },
  day: { alignItems: 'center', gap: 5, flex: 1 },
  pill: { width: 30, height: 14, borderRadius: 7, borderWidth: 2.5, borderColor: '#333C7A' },
  pillOn: { backgroundColor: '#8B5A38', borderColor: '#8B5A38' },
  dayLabel: { fontFamily: fonts.bodyHeavy, fontSize: 12, color: colors.textMuted },
  dayToday: { color: colors.yellow },
  throwBtn: {
    alignSelf: 'stretch',
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.yellow,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 4,
    borderBottomColor: '#C9A800',
    marginTop: 6,
  },
  throwPressed: { transform: [{ translateY: 2 }], borderBottomWidth: 2 },
  throwText: { fontFamily: fonts.bodyHeavy, fontSize: 17, color: colors.line },
  signal: { backgroundColor: '#262A63', borderRadius: 24, padding: 14, gap: 10, borderWidth: 2, borderColor: '#4A4F99' },
  signalHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  signalTitle: { fontFamily: fonts.bodyHeavy, fontSize: 14, color: '#E4D6FF' },
  signalSub: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.textMuted },
  signalCells: { flexDirection: 'row', gap: 6 },
  signalCell: { flex: 1, backgroundColor: colors.cardSub, borderRadius: 18, padding: 8, alignItems: 'center', gap: 4 },
  signalLabel: { fontFamily: fonts.bodyHeavy, fontSize: 13, color: colors.text },
  signalValue: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.textSub, textAlign: 'center' },
  signalLine: { fontFamily: fonts.bodyHeavy, fontSize: 13, lineHeight: 20, color: colors.text },
  noteWrap: { gap: 10 },
  bubbleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bubble: { flex: 1, backgroundColor: colors.text, borderRadius: 20, paddingVertical: 12, paddingHorizontal: 16 },
  bubbleText: { fontFamily: fonts.bodyBold, fontSize: 14, lineHeight: 21, color: colors.line },
  note: { backgroundColor: colors.card, borderRadius: 26, borderWidth: 3, borderColor: '#3F4A9A', padding: 16, gap: 10 },
  noteHeader: { fontFamily: fonts.bodyHeavy, fontSize: 13, color: colors.leisure },
  noteText: { fontFamily: fonts.bodyHeavy, fontSize: 18, lineHeight: 26, color: colors.text },
  noteBtns: { flexDirection: 'row', gap: 10, marginTop: 4 },
  btn: { flex: 1, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  btnSub: { backgroundColor: '#2E3775' },
  btnPink: { backgroundColor: colors.pink, borderBottomWidth: 4, borderBottomColor: colors.pinkShadow },
  btnText: { fontFamily: fonts.bodyHeavy, fontSize: 15, color: colors.line },
  empty: { fontFamily: fonts.bodyBold, fontSize: 13, lineHeight: 19, color: colors.textMuted, paddingHorizontal: 4 },
  mapRow: { backgroundColor: colors.cardSub, borderRadius: 22, paddingVertical: 14, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center' },
  mapBody: { flex: 1, gap: 2 },
  mapTitle: { fontFamily: fonts.bodyHeavy, fontSize: 15, color: colors.text },
  mapSub: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.textSub },
  chevron: { fontFamily: fonts.bodyHeavy, fontSize: 24, color: colors.textMuted },
  yearAgo: { backgroundColor: '#181F4C', borderRadius: 24, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  body: { flex: 1, gap: 3 },
  yearAgoDate: { fontFamily: fonts.number, fontSize: 12, color: colors.leisure },
  yearAgoText: { fontFamily: fonts.bodyBold, fontSize: 14, lineHeight: 21, color: colors.text },
});
