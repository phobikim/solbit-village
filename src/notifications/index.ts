// 로컬 알림 ("밤사이 마을 소식", SPEC 10장): 매일 설정한 시각에 1회.
// 웹은 로컬 예약 알림을 지원하지 않으므로 Platform.OS === 'web'이면 모든 호출을 건너뛴다.
// expo-notifications 모듈은 네이티브에서만 불러온다 (웹 번들에서 네이티브 전용 코드가 실행되지 않게).

import { Platform } from 'react-native';

import { NEWS_NOTIFICATION } from '../copy/news.ko';

export const notificationsSupported = Platform.OS !== 'web';

/** 아침 소식 알림 식별자 (이것만 바꾸고 지운다) */
const MORNING_NEWS_ID = 'morning-news';

type NotificationsModule = typeof import('expo-notifications');

function load(): NotificationsModule | null {
  if (!notificationsSupported) return null;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('expo-notifications') as NotificationsModule;
}

/** 앱이 켜져 있을 때 온 알림도 배너로 보여준다. 앱 시작 시 한 번. */
export function setupNotificationHandler(): void {
  const N = load();
  if (!N) return;
  N.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
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

/** 매일 hour:minute에 아침 소식 알림. 이전 예약은 바꾼다. 웹이면 false. */
export async function scheduleMorningNews(hour: number, minute: number): Promise<boolean> {
  const N = load();
  if (!N) return false;
  await N.cancelScheduledNotificationAsync(MORNING_NEWS_ID).catch(() => {});
  await N.scheduleNotificationAsync({
    identifier: MORNING_NEWS_ID,
    content: { title: NEWS_NOTIFICATION.title, body: NEWS_NOTIFICATION.body },
    trigger: { type: N.SchedulableTriggerInputTypes.DAILY, hour, minute },
  });
  return true;
}

/** 아침 소식 알림 끄기. 웹이면 아무것도 안 함. */
export async function cancelMorningNews(): Promise<void> {
  const N = load();
  if (!N) return;
  await N.cancelScheduledNotificationAsync(MORNING_NEWS_ID).catch(() => {});
}
