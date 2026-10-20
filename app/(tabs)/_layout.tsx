import { Tabs } from 'expo-router';
import { SvgXml } from 'react-native-svg';

import { tabIconSvg, type TabIcon } from '../../src/ui/characters/icons';
import { colors, fonts } from '../../src/ui/theme';

const icon =
  (k: TabIcon) =>
  ({ focused }: { focused: boolean }) => (
    <SvgXml xml={tabIconSvg(k, focused ? colors.yellow : colors.tabInactive)} width={22} height={22} />
  );

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.yellow,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarStyle: { backgroundColor: colors.night, borderTopWidth: 0, elevation: 0 },
        tabBarLabelStyle: { fontFamily: fonts.bodyHeavy, fontSize: 11 },
        sceneStyle: { backgroundColor: colors.night },
      }}
    >
      <Tabs.Screen name="index" options={{ title: '마을', tabBarIcon: icon('village') }} />
      <Tabs.Screen name="records" options={{ title: '기록', tabBarIcon: icon('records') }} />
      <Tabs.Screen name="neighbors" options={{ title: '이웃', tabBarIcon: icon('neighbors') }} />
      <Tabs.Screen name="me" options={{ title: '나', tabBarIcon: icon('me') }} />
    </Tabs>
  );
}
