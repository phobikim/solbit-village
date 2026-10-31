// 쉼터 (디자인 TURN 34·35, 시트 5 쉼터). 위쪽 탭 두 개: 모닥불(기본) / 보따리 지도 — 탭을 바꿔도 이장 방송띠는 맨 위에 있다.
//  - 모닥불: 불 카드 → [장작 던지기] → 이번 주 장작 → 다녀온 곳 줄 → 이장 쪽지 (15a · 34a)
//  - 보따리 지도: 가고 싶은 곳(깃발)만 (15c · 15d). 깃발 카드의 [다녀왔슈]는 장작 던지기 시트를 채워 연다 (35a)
// 장작 던지기 · 기록 고치기(34d)는 새 화면이 아니라 이 화면 위로 올라오는 시트(ThrowSheet)다.
// 지침 신호 · 1년 전 오늘은 src/ui/features.ts에서 꺼 두었다.

import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState, type ComponentRef } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { withPrefix } from '../../src/copy/broadcasts.ko';
import {
  DAY_NAME,
  mapSoonLine,
  MAP_BROADCAST,
  noteButton,
  noteCopy,
  noteLine,
  noteNoFreeDay,
  REST_BROADCAST,
  REST_TABS,
  restCopy,
  yearAgoLine,
} from '../../src/copy/rest.ko';
import { newId } from '../../src/data/events';
import { savePlaces } from '../../src/data/places';
import { getSetting, setSetting, SETTING } from '../../src/data/settings';
import { addDays, parseDayKey, today as getToday, weekdayOf, type DayKey } from '../../src/domain/day';
import { EVENT_NAME_MAX } from '../../src/domain/events';
import { keptDays, settleTrips, weekStart, type Place } from '../../src/domain/rest';
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
import { useNeighbors } from '../../src/state/neighbors';
import { usePlaces } from '../../src/state/places';
import { useRecords } from '../../src/state/records';
import { useRestLogs } from '../../src/state/restLogs';
import { restRange, useRestView } from '../../src/state/restView';
import { Ijang } from '../../src/ui/characters';
import { indexIconSvg } from '../../src/ui/characters/icons';
import { Screen } from '../../src/ui/components/Screen';
import { SegTabs } from '../../src/ui/components/SegTabs';
import { FireCard, VisitedRow, WeekList, weekRangeLabel } from '../../src/ui/components/rest/FireParts';
import { MapTab, useMapView } from '../../src/ui/components/rest/MapTab';
import { ThrowSheet, type ThrowDone, type ThrowSheetState } from '../../src/ui/components/rest/ThrowSheet';
import { REST_FEATURES } from '../../src/ui/features';
import { colors, fonts } from '../../src/ui/theme';

type Tab = 'fire' | 'map';

/** 방금 들어온 항목이 반짝이는 시간 */
const FRESH_MS = 2800;

const timeLabel = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
const dotted = (d: DayKey) => {
  const { year, month, day } = parseDayKey(d);
  return `${year}.${String(month).padStart(2, '0')}.${String(day).padStart(2, '0')}`;
};

export default function RestScreen() {
  const today = getToday();
  const [tab, setTab] = useState<Tab>('fire');
  const [sheet, setSheet] = useState<ThrowSheetState | null>(null);
  const [fresh, setFresh] = useState<{ logId: string; placeId: string | null } | null>(null);
  const [pickedId, setPickedId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [noteState, setNoteState] = useState<NoteState | null>(null);
  const byDate = useRecords((s) => s.byDate);
  const loadRange = useRecords((s) => s.loadRange);
  const places = usePlaces((s) => s.places);
  const loadPlaces = usePlaces((s) => s.load);
  const savePlace = usePlaces((s) => s.save);
  const logs = useRestLogs((s) => s.logs);
  const loadLogs = useRestLogs((s) => s.load);
  const loadNeighbors = useNeighbors((s) => s.load);
  const events = useLedger((s) => s.events);
  const ledgerLoaded = useLedger((s) => s.loaded);
  const loadLedger = useLedger((s) => s.load);
  const saveEvent = useLedger((s) => s.save);
  const scroller = useRef<ComponentRef<typeof ScrollView>>(null);
  const listY = useRef(0);

  // 들어올 때: 읽고, 쪽지 기억을 읽는다
  useFocusEffect(
    useCallback(() => {
      setNotice(null);
      const { from, to } = restRange(today);
      (async () => {
        await Promise.all([loadRange(from, to), loadPlaces(), loadLedger(), loadLogs(), loadNeighbors()]);
        setNoteState(parseNoteState(await getSetting(SETTING.restNote)));
      })().catch((e) => console.warn('[rest] load failed', e));
    }, [today, loadRange, loadPlaces, loadLedger, loadLogs, loadNeighbors]),
  );

  // 깃발 → 다녀온 곳 (행사 날이 지난 깃발, 행사를 지워 날짜가 사라진 깃발)
  useEffect(() => {
    if (!ledgerLoaded) return;
    const changed = settleTrips(places, events, today);
    if (!changed.length) return;
    savePlaces(changed)
      .then(loadPlaces)
      .catch((e) => console.warn('[rest] settle failed', e));
  }, [places, events, ledgerLoaded, today, loadPlaces]);

  // 방금 들어온 항목 반짝임은 잠깐만
  useEffect(() => {
    if (!fresh) return;
    const t = setTimeout(() => setFresh(null), FRESH_MS);
    return () => clearTimeout(t);
  }, [fresh]);

  const v = useRestView(byDate, places, logs, today);
  const open = noteOpen(v.band);
  const mon = weekStart(today);

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

  /** 던지기를 마치면: 시트가 닫히고, 모닥불 탭으로 돌아와 새 항목(과 다녀온 곳 카드)이 잠깐 반짝인다 */
  const onThrown = (r: ThrowDone) => {
    setSheet(null);
    setPickedId(null);
    setNotice(null);
    setTab('fire');
    setFresh(r);
    // 새 항목은 이번 주 장작 맨 위 — 거기까지 올린다 (탭을 바꿔 새로 그려진 뒤)
    setTimeout(() => scroller.current?.scrollTo({ y: Math.max(0, listY.current - 8), animated: true }), 120);
  };

  const band = v.band ?? 'none';
  const map = useMapView(places, events, today, pickedId);
  const mapLine = map.selected?.kind === 'date' && map.selected.days !== null ? mapSoonLine(map.selected.place.name, map.selected.days) : null;
  const message = notice ?? (tab === 'map' ? (mapLine ?? MAP_BROADCAST) : REST_BROADCAST[band]);

  return (
    <Screen title="쉼터" broadcast={{ message: withPrefix(message), time: timeLabel(new Date()) }}>
      <SegTabs
        items={[
          { key: 'fire', label: REST_TABS.fire },
          { key: 'map', label: REST_TABS.map },
        ]}
        value={tab}
        onChange={setTab}
        style={styles.tabs}
      />
      {tab === 'fire' ? (
        <ScrollView ref={scroller} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <FireCard band={v.band} rest={v.rest} weekCount={v.weekLogs.length} onThrow={() => setSheet({ mode: 'new' })} />

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

          <WeekList
            logs={v.weekLogs}
            range={weekRangeLabel(mon, addDays(mon, 6))}
            freshId={fresh?.logId ?? null}
            onPress={(log) => setSheet({ mode: 'edit', log })}
            onLayoutY={(y) => (listY.current = y)}
          />

          <VisitedRow
            places={v.visited}
            freshId={fresh?.placeId ?? null}
            onPress={(p: Place) => router.push({ pathname: '/place-new', params: { id: p.id } })}
          />

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
                      <Text style={[styles.btnText, { color: colors.textSub }]}>{noteCopy.other}</Text>
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
      ) : (
        <MapTab
          places={places}
          events={events}
          today={today}
          rest={v.rest}
          pickedId={pickedId}
          onPick={setPickedId}
          onVisit={(place) => setSheet({ mode: 'visit', place })}
        />
      )}

      <ThrowSheet state={sheet} today={today} onClose={() => setSheet(null)} onDone={onThrown} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  tabs: { marginHorizontal: 12, marginTop: 10 },
  content: { padding: 12, gap: 12, paddingBottom: 24 },
  signal: { backgroundColor: '#262A63', borderRadius: 24, padding: 14, gap: 10, borderWidth: 2, borderColor: '#4A4F99' },
  signalHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  signalTitle: { fontFamily: fonts.bodyHeavy, fontSize: 14, color: '#E4D6FF' },
  signalSub: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.textMuted },
  signalCells: { flexDirection: 'row', gap: 6 },
  signalCell: { flex: 1, backgroundColor: colors.cardSub, borderRadius: 18, padding: 8, alignItems: 'center', gap: 4 },
  signalLabel: { fontFamily: fonts.bodyHeavy, fontSize: 13, color: colors.text },
  signalValue: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.textSub, textAlign: 'center' },
  signalLine: { fontFamily: fonts.bodyHeavy, fontSize: 13, lineHeight: 20, color: colors.text },
  noteWrap: { gap: 8 },
  bubbleRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  bubble: { flex: 1, backgroundColor: colors.text, borderTopLeftRadius: 18, borderTopRightRadius: 18, borderBottomRightRadius: 18, borderBottomLeftRadius: 6, paddingVertical: 10, paddingHorizontal: 12, marginBottom: 8 },
  bubbleText: { fontFamily: fonts.bodyBold, fontSize: 13, lineHeight: 20, color: colors.line },
  note: { backgroundColor: '#262A63', borderRadius: 22, borderWidth: 2, borderColor: '#4A4F99', padding: 14, gap: 10 },
  noteHeader: { fontFamily: fonts.bodyHeavy, fontSize: 12, color: colors.leisure },
  noteText: { fontFamily: fonts.bodyHeavy, fontSize: 16, lineHeight: 23, color: colors.text },
  noteBtns: { flexDirection: 'row', gap: 8 },
  btn: { flex: 1, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  btnSub: { backgroundColor: '#2E3775' },
  btnPink: { backgroundColor: colors.pink, borderBottomWidth: 3, borderBottomColor: colors.pinkShadow },
  btnText: { fontFamily: fonts.bodyHeavy, fontSize: 14, color: colors.line },
  empty: { fontFamily: fonts.bodyBold, fontSize: 13, lineHeight: 19, color: colors.textMuted, paddingHorizontal: 4 },
  yearAgo: { backgroundColor: '#181F4C', borderRadius: 24, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  body: { flex: 1, gap: 3 },
  yearAgoDate: { fontFamily: fonts.number, fontSize: 12, color: colors.leisure },
  yearAgoText: { fontFamily: fonts.bodyBold, fontSize: 14, lineHeight: 21, color: colors.text },
});
