// src/utils/notifications.ts
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) return null;

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('caronas', {
      name: 'CaronaMais',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#3B6D11',
    });
  }

  try {
    const token = (await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig?.extra?.eas?.projectId,
    })).data;
    return token;
  } catch {
    return null;
  }
}

// Schedule a weekly reminder for passengers (default Thursday 18:00)
export async function schedulePassengerReminder(dayOfWeek: number) {
  await Notifications.cancelAllScheduledNotificationsAsync();

  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🚗 CaronaMais',
      body: 'Confirme sua presença na carona deste fim de semana!',
      sound: true,
      data: { type: 'passenger_reminder' },
    },
    trigger: {
      weekday: dayOfWeek + 1, // expo uses 1=Sun
      hour: 18,
      minute: 0,
      repeats: true,
    } as any,
  });
}

// Schedule a weekly reminder for drivers (default Wednesday 18:00)
export async function scheduleDriverReminder(dayOfWeek: number) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🚗 CaronaMais — Motoristas',
      body: 'Atualize a disponibilidade do seu carro para este fim de semana!',
      sound: true,
      data: { type: 'driver_reminder' },
    },
    trigger: {
      weekday: dayOfWeek + 1,
      hour: 17,
      minute: 0,
      repeats: true,
    } as any,
  });
}

// Send immediate local notification
export async function sendLocalNotification(title: string, body: string) {
  await Notifications.scheduleNotificationAsync({
    content: { title, body, sound: true },
    trigger: null,
  });
}

// Cancel all scheduled
export async function cancelAllNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
