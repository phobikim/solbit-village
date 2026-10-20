// 7d 나. 단계 2: 목업 데이터로 정적 화면.
// 솔이에게는 레벨이 없다. 표시하는 레벨은 수확 레벨(농부 칭호)뿐이다 (CLAUDE.md 규칙 2).

import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { parseDayKey } from '../../src/domain/day';
import { mockMe } from '../../src/mocks/tabs';
import { mockBroadcasts } from '../../src/mocks/village';
import { Soli } from '../../src/ui/characters';
import { Avatar } from '../../src/ui/components/Avatar';
import { MenuCard } from '../../src/ui/components/MenuCard';
import { Screen } from '../../src/ui/components/Screen';
import { TrendRow } from '../../src/ui/components/TrendRow';
import { colors, fonts } from '../../src/ui/theme';

const md = (key: string) => {
  const { month, day } = parseDayKey(key);
  return `${month}/${day}`;
};

export default function MeScreen() {
  const me = mockMe;
  const patternsLocked = me.villageLevel < me.patternsUnlockLevel;
  return (
    <Screen title="나" broadcast={mockBroadcasts.me}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.profile}>
          <Avatar size={68} background={colors.yellow} offset={6}>
            <Soli mood="normal" size={62} />
          </Avatar>
          <View style={styles.profileBody}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>솔이</Text>
              <View style={styles.titleChip}>
                <Text style={styles.titleChipText}>
                  {me.farmerTitle} · 수확 Lv.{me.harvestLevel}
                </Text>
              </View>
            </View>
            <Text style={styles.profileSub}>
              {me.villageName} 주민 · 기록 <Text style={styles.profileNum}>{me.recordDays}</Text>일째
            </Text>
          </View>
        </View>

        <View style={styles.trends}>
          <View style={styles.trendsHead}>
            <Text style={styles.trendsTitle}>최근 4주</Text>
            <Text style={styles.trendsRange}>
              {md(me.trendRange.from)} – {md(me.trendRange.to)}
            </Text>
          </View>
          {me.trends.map((t) => (
            <TrendRow key={t.kind} {...t} />
          ))}
        </View>

        <View style={styles.menuRow}>
          <MenuCard
            icon="ledger"
            iconBg={colors.pink}
            title="이장네 장부"
            subtitle={`다가오는 행사 ${me.upcomingEvents}개`}
            onPress={() => router.push('/ledger')}
          />
          <MenuCard
            icon="storage"
            iconBg={colors.yellow}
            title="수확 창고"
            subtitle={`작물 ${me.storedCrops}개 보관 중`}
            dot={me.canExchange}
            onPress={() => router.push('/storage')}
          />
        </View>
        <View style={styles.menuRow}>
          {/* TODO: 여가 서랍 상세는 SPEC 11장 [미정] */}
          <MenuCard icon="drawer" iconBg={colors.leisure} title="여가 서랍" subtitle="가고 싶은 곳 · 지난 여행" />
          <MenuCard
            icon="locked"
            iconBg={colors.track}
            iconColor={colors.textMuted}
            title="발견한 패턴"
            subtitle={patternsLocked ? `마을 Lv.${me.patternsUnlockLevel}에 열려요` : '열렸어요'}
            locked={patternsLocked}
          />
        </View>
        <MenuCard icon="settings" iconBg={colors.track} iconColor={colors.text} title="설정" subtitle="알림 · 방송 시간" />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 12, gap: 10, paddingBottom: 24 },
  profile: {
    backgroundColor: colors.cardSub,
    borderRadius: 24,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  profileBody: { flex: 1, gap: 3 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  name: { fontFamily: fonts.title, fontSize: 22, color: colors.text },
  titleChip: { backgroundColor: colors.relation, borderRadius: 99, paddingVertical: 3, paddingHorizontal: 10 },
  titleChipText: { fontFamily: fonts.bodyHeavy, fontSize: 12, color: colors.line },
  profileSub: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.textSub },
  profileNum: { fontFamily: fonts.number, color: colors.text },
  trends: { backgroundColor: colors.cardSub, borderRadius: 24, paddingVertical: 14, paddingHorizontal: 16, gap: 8 },
  trendsHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  trendsTitle: { fontFamily: fonts.bodyHeavy, fontSize: 14, color: colors.text },
  trendsRange: { fontFamily: fonts.number, fontSize: 11, color: colors.textMuted },
  menuRow: { flexDirection: 'row', gap: 8 },
});
