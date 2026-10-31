// 행사 카드 한 장 (장부 대소사 목록 · 날짜를 눌렀을 때 하단 리스트가 같이 쓴다).
// 장부 개선안: D-day 배지와 삭제 버튼을 줄였다. 여러 날 일정은 "10.19 (일) – 10.21 (화) · 3일".

import { Pressable, StyleSheet, Text, View } from 'react-native';

import { EVENT_TYPE_COLOR, EVENT_TYPE_LABEL, WEEKDAYS } from '../../copy/labels.ko';
import { dDayLabel, parseDayKey, weekdayOf, type DayKey } from '../../domain/day';
import { eventLength, type VillageEvent } from '../../domain/events';
import { EventIcon } from '../characters';
import { colors, fonts } from '../theme';
import { TrashButton } from './TrashButton';

const pad = (n: number) => String(n).padStart(2, '0');
const mdDow = (d: DayKey) => {
  const { month, day } = parseDayKey(d);
  return `${pad(month)}.${pad(day)} (${WEEKDAYS[weekdayOf(d)]})`;
};

/** 날짜 줄: 하루면 "10.27 (화)", 여러 날이면 "10.27 (화) – 10.29 (목) · 3일" */
export function eventDateLabel(e: Pick<VillageEvent, 'date' | 'endDate'>): string {
  return e.endDate ? `${mdDow(e.date)} – ${mdDow(e.endDate)} · ${eventLength(e)}일` : mdDow(e.date);
}

type Props = {
  event: VillageEvent;
  today: DayKey;
  /** 날짜 줄 뒤에 붙이는 말 (· 게시판 …) */
  suffix?: string;
  /** 노란 테두리 + 노란 D-day (게시판 맨 앞) */
  banner?: boolean;
  tidy?: boolean;
  onPress: () => void;
  onDelete?: () => void;
};

export function EventCard({ event: e, today, suffix = '', banner, tidy, onPress, onDelete }: Props) {
  return (
    <Pressable disabled={tidy} onPress={onPress} style={[styles.card, banner && styles.cardBanner]}>
      <View style={styles.icon}>
        <EventIcon type={e.type} size={26} />
      </View>
      <View style={styles.body}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>
            {e.name}
          </Text>
          <Text style={[styles.badge, { color: EVENT_TYPE_COLOR[e.type] }]}>{EVENT_TYPE_LABEL[e.type]}</Text>
        </View>
        <Text style={styles.date}>
          {eventDateLabel(e)}
          {suffix}
          {e.repeatYearly ? ' · 매년' : ''}
        </Text>
      </View>
      <View style={[styles.dday, banner && styles.ddayBanner]}>
        <Text style={[styles.ddayText, banner && { color: colors.line }]}>{dDayLabel(e.date, today)}</Text>
      </View>
      {tidy && onDelete && <TrashButton small label={e.name} onPress={onDelete} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.cardSub,
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cardBanner: { borderColor: colors.yellow },
  icon: { width: 36, height: 36, borderRadius: 12, backgroundColor: colors.night, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, gap: 2 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { flexShrink: 1, fontFamily: fonts.bodyHeavy, fontSize: 15, color: colors.text },
  badge: { fontFamily: fonts.bodyHeavy, fontSize: 10, backgroundColor: colors.track, borderRadius: 99, paddingHorizontal: 7, paddingVertical: 1, overflow: 'hidden' },
  date: { fontFamily: fonts.number, fontSize: 11, color: colors.textSub },
  dday: { backgroundColor: colors.track, borderRadius: 11, paddingVertical: 3, paddingHorizontal: 8 },
  ddayBanner: { backgroundColor: colors.yellow },
  ddayText: { fontFamily: fonts.title, fontSize: 13, color: colors.text },
});
