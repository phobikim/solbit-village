import { Tabs } from 'expo-router';

import { colors } from '../../src/ui/theme';

// 탭 5개 (디자인 TURN 30: 장부 · 이웃 · 마을 · 쉼터 · 나, 마을이 가운데). 옷장은 탭이 아니라 app/closet.tsx. 하단 바는 하위 화면에서도 떠 있어야 해서 루트 레이아웃의 BottomBar가 그린다 (기본 탭 바는 숨김).
export default function TabsLayout() {
  return (
    <Tabs
      tabBar={() => null}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.night } }}
    >
      <Tabs.Screen name="index" options={{ title: '마을' }} />
      <Tabs.Screen name="records" options={{ title: '장부' }} />
      <Tabs.Screen name="neighbors" options={{ title: '이웃' }} />
      <Tabs.Screen name="rest" options={{ title: '쉼터' }} />
      <Tabs.Screen name="me" options={{ title: '나' }} />
    </Tabs>
  );
}
