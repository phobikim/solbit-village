// 옷걸이 아이콘 (시안 TURN 30 inline path). 메인의 솔이 배지, 나 탭 "솔이 옷장" 줄에 쓴다.

import Svg, { Path } from 'react-native-svg';

export function HangerIcon({ size, color, strokeWidth = 2.8 }: { size: number; color: string; strokeWidth?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M9.8 6.2a2.2 2.2 0 1 1 3.3 1.9c-.7.4-1.1 1-1.1 1.8v.6" />
      <Path d="M12 10.5l-8.4 6.1a1.4 1.4 0 0 0 .8 2.5h15.2a1.4 1.4 0 0 0 .8-2.5z" />
    </Svg>
  );
}
