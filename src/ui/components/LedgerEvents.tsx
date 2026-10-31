// 12b 장부 · 대소사: 다가오는 행사(진행 중인 여러 날 일정 포함). '지나간 일' 영역은 없다 (장부 개선안).
// 머리에 정리 · + 등록 (디자인 v7). 정리 모드(13b)에서는 행사 줄 끝 휴지통.

import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { LEDGER_EMPTY } from '../../copy/labels.ko';
import type { DayKey } from '../../domain/day';
import { BOARD_MAX, upcomingEvents, type VillageEvent } from '../../domain/events';
import { colors, fonts } from '../theme';
import { EventCard } from './EventCard';
import { TidyButton } from './TidyButton';

/** 행사 등록 · 고치기 시트 열기 */
export function openEventSheet(id?: string) {
  router.push(id ? { pathname: '/ledger/new', params: { id } } : '/ledger/new');
}

type Props = {
  today: DayKey;
  events: readonly VillageEvent[];
  /** 처음 불러오기 전에는 빈 문구를 띄우지 않는다 */
  loaded: boolean;
  tidy: boolean;
  onToggleTidy: () => void;
  onDelete: (e: VillageEvent) => void;
};

export function LedgerEvents({ today, events, loaded, tidy, onToggleTidy, onDelete }: Props) {
  const upcoming = upcomingEvents(events, today);

  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <Text style={styles.section}>다가오는 행사</Text>
        <View style={styles.headButtons}>
          {events.length > 0 && <TidyButton on={tidy} onPress={onToggleTidy} />}
          {!tidy && (
            <Pressable accessibilityRole="button" onPress={() => openEventSheet()} style={styles.add}>
              <Text style={styles.addText}>+ 등록</Text>
            </Pressable>
          )}
        </View>
      </View>
      {loaded && upcoming.length === 0 && <Text style={styles.empty}>{LEDGER_EMPTY}</Text>}
      {upcoming.map((e, i) => (
        <EventCard
          key={e.id}
          event={e}
          today={today}
          suffix={i === 0 ? ' · 게시판 맨 앞' : i < BOARD_MAX ? ' · 게시판' : ''}
          banner={i === 0}
          tidy={tidy}
          onPress={() => openEventSheet(e.id)}
          onDelete={() => onDelete(e)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headButtons: { flexDirection: 'row', gap: 6 },
  add: { height: 32, paddingHorizontal: 12, borderRadius: 16, backgroundColor: colors.pink, justifyContent: 'center', borderBottomWidth: 3, borderBottomColor: '#B32A6E' },
  addText: { fontFamily: fonts.bodyHeavy, fontSize: 13, color: colors.line },
  section: { fontFamily: fonts.bodyHeavy, fontSize: 13, color: colors.textSub, paddingLeft: 4, marginTop: 4 },
  empty: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.textMuted, padding: 8 },
});
