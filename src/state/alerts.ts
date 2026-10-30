import { router } from 'expo-router';
import { Platform } from 'react-native';

// expo-notifications warns on import inside Expo Go, so it loads only when the demo needs it
let ready: Promise<typeof import('expo-notifications')> | null = null;
function notifications() {
  ready ??= import('expo-notifications').then(async (N) => {
    N.setNotificationHandler({
      handleNotification: async () => ({ shouldPlaySound: true, shouldSetBadge: false, shouldShowBanner: true, shouldShowList: true }),
    });
    if (Platform.OS === 'android')
      await N.setNotificationChannelAsync('alerts', { name: 'Avisos de lluvia', importance: N.AndroidImportance.MAX, vibrationPattern: [0, 300, 200, 300] });
    N.addNotificationResponseReceivedListener((r) => {
      const to = r.notification.request.content.data?.to;
      if (typeof to === 'string') router.push(to as any);
    });
    return N;
  });
  return ready;
}

export async function requestAlertPermission() {
  if (Platform.OS === 'web') return false;
  const N = await notifications();
  const { status } = await N.requestPermissionsAsync();
  return status === 'granted';
}

export async function scheduleDemoAlert(opts: { title: string; body: string; seconds: number; to: string }) {
  if (Platform.OS === 'web') return false;
  const N = await notifications();
  if (!(await requestAlertPermission())) return false;
  await N.scheduleNotificationAsync({
    content: { title: opts.title, body: opts.body, data: { to: opts.to }, sound: true },
    trigger: { type: N.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: opts.seconds, channelId: 'alerts' },
  });
  return true;
}
