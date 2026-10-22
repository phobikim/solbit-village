// 보따리 전체 보기 (쉼터): 가고 싶은 곳 / 다녀온 곳. + 로 담는다.

import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { withPrefix } from '../src/copy/broadcasts.ko';
import { REST_BROADCAST, restCopy } from '../src/copy/rest.ko';
import { today as getToday } from '../src/domain/day';
import { scheduledDate, sortPlaces } from '../src/domain/rest';
import { useLedger } from '../src/state/ledger';
import { usePlaces } from '../src/state/places';
import { SubScreen } from '../src/ui/components/form';
import { openPlace, PlaceRow, schedulePlace } from '../src/ui/components/PlaceRow';
import { RoundButton } from '../src/ui/components/RoundButton';
import { colors, fonts } from '../src/ui/theme';

const timeLabel = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

export default function Bundle() {
  const today = getToday();
  const [tab, setTab] = useState<'wish' | 'visited'>('wish');
  const places = usePlaces((s) => s.places);
  const loaded = usePlaces((s) => s.loaded);
  const loadPlaces = usePlaces((s) => s.load);
  const events = useLedger((s) => s.events);
  const loadLedger = useLedger((s) => s.load);

  useFocusEffect(
    useCallback(() => {
      Promise.all([loadPlaces(), loadLedger()]).catch((e) => console.warn('[bundle] load failed', e));
    }, [loadPlaces, loadLedger]),
  );

  const wish = sortPlaces(places, false);
  const visited = sortPlaces(places, true);
  const list = tab === 'wish' ? wish : visited;

  return (
    <SubScreen title={restCopy.bundleTitle} back="/rest" broadcast={{ message: withPrefix(REST_BROADCAST), time: timeLabel(new Date()) }}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.chips}>
          {(['wish', 'visited'] as const).map((k) => (
            <Pressable key={k} onPress={() => setTab(k)} style={[styles.chip, tab === k && styles.chipOn]}>
              <Text style={[styles.chipText, tab === k && styles.chipTextOn]}>
                {k === 'wish' ? `${restCopy.wish} ${wish.length}` : `${restCopy.visited} ${visited.length}`}
              </Text>
            </Pressable>
          ))}
        </View>
        {list.map((p) => (
          <PlaceRow
            key={p.id}
            place={p}
            scheduled={scheduledDate(p, events, today)}
            today={today}
            onPress={() => openPlace(p)}
            onSchedule={() => schedulePlace(p)}
          />
        ))}
        {loaded && list.length === 0 && <Text style={styles.empty}>{tab === 'wish' ? restCopy.wishEmpty : restCopy.visitedEmpty}</Text>}
      </ScrollView>
      <RoundButton
        icon="plus"
        size={58}
        accessibilityLabel="보따리에 담기"
        onPress={() => router.push({ pathname: '/place-new', params: tab === 'visited' ? { visited: '1' } : {} })}
        style={styles.fab}
      />
    </SubScreen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 12, gap: 8, paddingBottom: 96 },
  chips: { flexDirection: 'row', gap: 6, marginBottom: 2 },
  chip: { height: 34, paddingHorizontal: 14, borderRadius: 17, backgroundColor: colors.cardSub, justifyContent: 'center' },
  chipOn: { backgroundColor: colors.leisure },
  chipText: { fontFamily: fonts.bodyHeavy, fontSize: 13, color: colors.textSub },
  chipTextOn: { color: colors.line },
  empty: { fontFamily: fonts.bodyBold, fontSize: 13, lineHeight: 19, color: colors.textMuted, padding: 8 },
  fab: { position: 'absolute', right: 20, bottom: 24 },
});
