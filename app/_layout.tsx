// app/_layout.tsx
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { registerForPushNotifications, schedulePassengerReminder, scheduleDriverReminder } from '../src/utils/notifications';
import { useStore } from '../src/store';

export default function RootLayout() {
  const settings = useStore((s) => s.settings);

  useEffect(() => {
    (async () => {
      const token = await registerForPushNotifications();
      if (token) {
        await schedulePassengerReminder(settings.notifyPassengersDay);
        await scheduleDriverReminder(settings.notifyDriversDay);
      }
    })();
  }, []);

  return (
    <>
      <StatusBar style="dark" />
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="trip/[id]" options={{ title: 'Viagem', presentation: 'modal' }} />
      </Stack>
    </>
  );
}
