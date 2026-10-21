// 밤사이 마을 소식 (SPEC 10장). 그날 처음 앱을 열면 마을 탭 위에 먼저 뜬다. (디자인 시안 없음 — 씨앗 결과 카드 형식을 따름)

import { router } from 'expo-router';
import { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { NEWS_CLOSE, NEWS_LINE, NEWS_TITLE, newsText } from '../src/copy/news.ko';
import { getSetting, setSetting, SETTING } from '../src/data/settings';
import { addDays, today as getToday } from '../src/domain/day';
import { DEFAULT_NEWS_ALARM, parseAlarmTime } from '../src/domain/news';
import { notificationsSupported, requestNotificationPermission, scheduleMorningNews } from '../src/notifications';
import { useFarm } from '../src/state/farm';
import { useLedger } from '../src/state/ledger';
import { useNeighbors } from '../src/state/neighbors';
import { markNewsSeen, useMorningNews } from '../src/state/newsView';
import { useRecords } from '../src/state/records';
import { PrimaryButton } from '../src/ui/components/PrimaryButton';
import { IjangBubble } from '../src/ui/components/record/pickers';
import { colors, fonts } from '../src/ui/theme';

/**
 * 처음 소식을 닫을 때 한 번: 아침 알림을 아직 정한 적이 없으면 권한을 묻고 기본 시각으로 켠다.
 * 거절하면 끈 채로 두고 다시 묻지 않는다 (설정에서 켤 수 있다).
 */
async function firstTimeAlarm(): Promise<void> {
  if (!notificationsSupported) return;
  if ((await getSetting(SETTING.newsAlarmOn)) !== null) return;
  const granted = await requestNotificationPermission();
  await setSetting(SETTING.newsAlarmOn, granted ? '1' : '0');
  await setSetting(SETTING.newsAlarmTime, DEFAULT_NEWS_ALARM);
  if (granted) {
    const t = parseAlarmTime(DEFAULT_NEWS_ALARM);
    await scheduleMorningNews(t.hour, t.minute);
  }
}

export default function MorningNews() {
  const today = getToday();
  const items = useMorningNews(today);
  const loadFarm = useFarm((s) => s.load);
  const loadDay = useRecords((s) => s.loadDay);
  const loadNeighbors = useNeighbors((s) => s.load);
  const loadLedger = useLedger((s) => s.load);

  useEffect(() => {
    Promise.all([loadFarm(), loadDay(addDays(today, -1)), loadNeighbors(), loadLedger()]).catch((e) =>
      console.warn('[news] load failed', e),
    );
  }, [today, loadFarm, loadDay, loadNeighbors, loadLedger]);

  const close = async () => {
    await markNewsSeen(today).catch((e) => console.warn('[news] mark failed', e));
    if (router.canGoBack()) router.back();
    else router.replace('/');
    firstTimeAlarm().catch((e) => console.warn('[news] alarm setup failed', e));
  };

  return (
    <View style={styles.dim}>
      <View style={styles.card}>
        <IjangBubble text={NEWS_LINE} />
        <Text style={styles.title}>{NEWS_TITLE}</Text>
        <ScrollView style={styles.list} contentContainerStyle={styles.listContent} indicatorStyle="white">
          {items.map((item, i) => (
            <View key={i} style={styles.item}>
              <View style={styles.bullet} />
              <Text style={styles.itemText}>{newsText(item)}</Text>
            </View>
          ))}
        </ScrollView>
        <PrimaryButton label={NEWS_CLOSE} onPress={close} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dim: { flex: 1, backgroundColor: 'rgba(6,8,24,.72)', justifyContent: 'center', padding: 20 },
  card: {
    width: '100%',
    maxWidth: 390,
    maxHeight: '86%',
    alignSelf: 'center',
    backgroundColor: colors.cardSub,
    borderRadius: 32,
    padding: 20,
    gap: 14,
  },
  title: { fontFamily: fonts.title, fontSize: 26, color: colors.yellow },
  list: { flexGrow: 0 },
  listContent: { gap: 8 },
  item: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    backgroundColor: colors.night,
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  bullet: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.yellow, marginTop: 7 },
  itemText: { flex: 1, fontFamily: fonts.bodyBold, fontSize: 15, lineHeight: 22, color: colors.text },
});
