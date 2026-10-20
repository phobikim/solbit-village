// 로컬 알림 ("밤사이 마을 소식", SPEC 10장). 실제 예약 로직은 단계 6.
// 웹은 로컬 예약 알림을 지원하지 않으므로 Platform.OS === 'web'이면 모든 호출을 건너뛴다.
// expo-notifications 모듈은 네이티브에서만 불러온다 (웹 번들에서 네이티브 전용 코드가 실행되지 않게).

import { Platform } from 'react-native';

export const notificationsSupported = Platform.OS !== 'web';

type NotificationsModule = typeof import('expo-notifications');

function load(): NotificationsModule | null {
  if (!notificationsSupported) return null;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('expo-notifications') as NotificationsModule;
}

/** 알림 권한 요청. 웹이면 false. */
export async function requestNotificationPermission(): Promise<boolean> {
  const N = load();
  if (!N) return false;
  const current = await N.getPermissionsAsync();
  if (current.granted) return true;
  const req = await N.requestPermissionsAsync();
  return req.granted;
}

/** 예약된 아침 알림 모두 취소. 웹이면 아무것도 안 함. */
export async function cancelAllScheduled(): Promise<void> {
  const N = load();
  if (!N) return;
  await N.cancelAllScheduledNotificationsAsync();
}
