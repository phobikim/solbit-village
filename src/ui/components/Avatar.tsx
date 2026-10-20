// 동그란 배경 안에 캐릭터 얼굴을 넣는 틀 (방송·이웃 목록·프로필)

import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

type Props = {
  size: number;
  background: string;
  /** 캐릭터를 아래로 내리는 정도 (머리 위 여백을 잘라 얼굴이 크게 보이게) */
  offset?: number;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function Avatar({ size, background, offset = 4, children, style }: Props) {
  return (
    <View
      style={[
        styles.circle,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: background, paddingTop: offset },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  circle: { overflow: 'hidden', alignItems: 'center' },
});
