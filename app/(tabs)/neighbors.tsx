// 7c 이웃. 단계 2: 목업 데이터로 정적 화면.
// 정렬은 가까운 순. 오래 연락 안 한 이웃은 맨 아래 "안부 묻기 좋은 이웃"에 차분하게 둔다 (SPEC 7장).

import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { broadcasts } from '../../src/copy/broadcasts.ko';
import { RELATION_LABEL } from '../../src/copy/labels.ko';
import { mockAskAfter, mockNeighbors } from '../../src/mocks/tabs';
import { mockBroadcasts } from '../../src/mocks/village';
import { Npc } from '../../src/ui/characters';
import { Avatar } from '../../src/ui/components/Avatar';
import { NeighborCard } from '../../src/ui/components/NeighborCard';
import { RoundButton } from '../../src/ui/components/RoundButton';
import { Screen } from '../../src/ui/components/Screen';
import { colors, fonts } from '../../src/ui/theme';

export default function NeighborsScreen() {
  const total = mockNeighbors.length + mockAskAfter.length;
  const addNeighbor = () => router.push('/neighbor-new');

  const right = (
    <View style={styles.headerRight}>
      <Text style={styles.sortText}>
        가까운 순 · <Text style={styles.sortNum}>{total}</Text>명
      </Text>
      <RoundButton icon="plus" size={40} accessibilityLabel="이웃 등록" onPress={addNeighbor} />
    </View>
  );

  return (
    <Screen title="이웃" broadcast={mockBroadcasts.neighbors} right={right}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {mockNeighbors.map((n) => (
          <NeighborCard key={n.id} {...n} />
        ))}

        {mockAskAfter.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>안부 묻기 좋은 이웃</Text>
            {mockAskAfter.map((n) => (
              <View key={n.id} style={styles.askCard}>
                <Avatar size={44} background={colors.card}>
                  <Npc color={n.color} hair={n.hair} size={40} />
                </Avatar>
                <View style={styles.askBody}>
                  <Text style={styles.askName}>
                    {n.name} <Text style={styles.askRel}>{RELATION_LABEL[n.relation]}</Text>
                  </Text>
                  <Text style={styles.askText}>{broadcasts.askAfter(n.name)}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <RoundButton icon="plus" size={58} accessibilityLabel="이웃 등록" onPress={addNeighbor} style={styles.fab} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sortText: { fontFamily: fonts.bodyHeavy, fontSize: 13, color: colors.textSub },
  sortNum: { fontFamily: fonts.number, color: colors.text },
  content: { padding: 12, gap: 8, paddingBottom: 96 },
  section: { gap: 8, marginTop: 8 },
  sectionTitle: { fontFamily: fonts.bodyHeavy, fontSize: 13, color: colors.textSub, paddingLeft: 4 },
  askCard: {
    backgroundColor: colors.cardMuted,
    borderRadius: 22,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  askBody: { flex: 1, gap: 3 },
  askName: { fontFamily: fonts.bodyHeavy, fontSize: 15, color: colors.text },
  askRel: { fontSize: 11, color: colors.textMuted },
  askText: { fontFamily: fonts.bodyBold, fontSize: 13, lineHeight: 19, color: colors.textSub },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    shadowColor: colors.pink,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 12 },
  },
});
