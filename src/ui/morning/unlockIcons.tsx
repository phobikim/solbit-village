// 마을 보상표 줄에 쓰는 작은 해금 아이콘 (디자인 v5 26d의 인라인 그림). 24×24 좌표, 선 #10142E 1.6.
// 선물 상자 · 자물쇠 · 체크도 여기서 그린다.

import { memo } from 'react';
import Svg, { Path } from 'react-native-svg';

import type { UnlockIcon } from '../../domain/villageUnlocks';
import { colors } from '../theme';

const N = 'none';
const circle = (x: number, y: number, r: number) => `M${x - r} ${y}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`;

type P = { d: string; f: string };

const ICONS: Record<UnlockIcon, readonly P[]> = {
  house: [
    { d: 'M5 11H19V20.5H5Z', f: '#FFF6D6' },
    { d: 'M3 11.5L12 4L21 11.5Z', f: '#FF4FA0' },
    { d: 'M10 20.5V15.5H14V20.5', f: '#FFC23C' },
  ],
  pond: [
    { d: 'M17 13V5.5', f: N },
    { d: 'M17 8.5c1.6-.4 2.6-1.6 2.6-3-1.6.2-2.6 1.4-2.6 3z', f: '#A8EB5A' },
    { d: 'M2.5 15.5c0-3 4.3-5 9.5-5s9.5 2 9.5 5-4.3 5-9.5 5-9.5-2-9.5-5z', f: '#5FD8FF' },
  ],
  laundry: [
    { d: 'M2.5 5.5H21.5', f: N },
    { d: 'M7 5.5L4.5 8.5 6.5 10V17H12.5V10L14.5 8.5 12 5.5Z', f: '#5FD8FF' },
    { d: 'M16 5.5H20.5V14H16Z', f: '#FFC23C' },
  ],
  windmill: [
    { d: 'M9 21L10.5 11.5H13.5L15 21Z', f: '#FFF6D6' },
    { d: 'M12 10L5.5 4 4 5.8ZM12 10L18.5 4 20 5.8ZM12 10L5.5 16 4 14.2ZM12 10L18.5 16 20 14.2Z', f: '#C49BFF' },
  ],
  jar: [
    { d: 'M7.5 8.5H16.5Q20 14.5 16.5 20.5H7.5Q4 14.5 7.5 8.5Z', f: '#B0703F' },
    { d: 'M8 5.5H16V8.5H8Z', f: '#5A2A24' },
  ],
  well: [
    { d: 'M7 7.5V13M17 7.5V13', f: N },
    { d: 'M4 7.5L12 3.5L20 7.5Z', f: '#FF4FA0' },
    { d: 'M5 13H19V20.5H5Z', f: '#8F96CC' },
  ],
  orchard: [
    { d: 'M11 14H13V21H11Z', f: '#7A5A3A' },
    { d: circle(12, 9, 6.5), f: '#3F8A5C' },
    { d: circle(9.5, 9, 1.4) + circle(14.5, 11, 1.4) + circle(13, 6.5, 1.4), f: '#FF4FA0' },
  ],
  mill: [
    { d: 'M3.5 10.5H14.5V20.5H3.5Z', f: '#FFF6D6' },
    { d: 'M2.5 10.5L9 5L15.5 10.5Z', f: '#FFC23C' },
    { d: circle(17.5, 16, 4.2), f: '#8F96CC' },
    { d: 'M17.5 12v8M13.5 16h8', f: N },
  ],
  pavilion: [
    { d: 'M6 10V19.5M18 10V19.5M3.5 20H20.5', f: N },
    { d: 'M2 10.5Q12 1.5 22 10.5Z', f: '#A8EB5A' },
  ],
  observatory: [
    { d: 'M6 13H18V20.5H6Z', f: '#FFF6D6' },
    { d: 'M5 13A7 7 0 0 1 19 13Z', f: '#C49BFF' },
    { d: 'M19 2.5L19.9 4.6 22 5.5 19.9 6.4 19 8.5 18.1 6.4 16 5.5 18.1 4.6Z', f: '#FFE14D' },
  ],
  gift: [
    { d: 'M4 11H20V21H4Z', f: '#FF4FA0' },
    { d: 'M3 7.5H21V11H3Z', f: '#FF4FA0' },
    { d: 'M10.5 7.5H13.5V21H10.5Z', f: '#FFE14D' },
    { d: 'M12 7.5C9 3.5 5.5 4.5 7.5 7.5ZM12 7.5C15 3.5 18.5 4.5 16.5 7.5Z', f: '#FFE14D' },
  ],
};

export const UnlockGlyph = memo(function UnlockGlyph({ icon, size, opacity = 1 }: { icon: UnlockIcon; size: number; opacity?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" stroke={colors.line} strokeWidth={1.6} strokeLinejoin="round" strokeLinecap="round" opacity={opacity}>
      {ICONS[icon].map((p) => (
        <Path key={p.d} d={p.d} fill={p.f} />
      ))}
    </Svg>
  );
});

/** 잠긴 레벨 표시 */
export function LockGlyph({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M8.5 11V8a3.5 3.5 0 0 1 7 0v3" fill="none" stroke={colors.textMuted} strokeWidth={2.6} strokeLinecap="round" />
      <Path d="M8.5 11h7a3 3 0 0 1 3 3v4a3 3 0 0 1-3 3h-7a3 3 0 0 1-3-3v-4a3 3 0 0 1 3-3z" fill={colors.textMuted} />
    </Svg>
  );
}

/** 지난 레벨 체크 배지 */
export function CheckGlyph({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={colors.line} strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M5 12.5l4.5 4.5L19 7.5" />
    </Svg>
  );
}

export function CloseGlyph({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={3} strokeLinecap="round">
      <Path d="M6 6L18 18M18 6L6 18" />
    </Svg>
  );
}
