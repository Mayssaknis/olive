import * as Device from 'expo-device';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';
import { pushApi } from '../api/services';

/**
 * Les push distantes ne sont pas supportees dans Expo Go (depuis le SDK 53) :
 * il faut un development build. On n'importe meme pas expo-notifications dans ce
 * cas, ce qui evite l'avertissement emis par le module a l'initialisation.
 */
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

export const PUSH_SUPPORTED = !isExpoGo;

let configured = false;

async function notificationsModule() {
  const Notifications = await import('expo-notifications');
  if (!configured) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
    configured = true;
  }
  return Notifications;
}

/** Demande la permission et recupere le jeton Expo Push. Renvoie null si indisponible. */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (isExpoGo || !Device.isDevice) return null;

  const Notifications = await notificationsModule();

  const existing = await Notifications.getPermissionsAsync();
  let status = existing.status;
  if (status !== 'granted') {
    const request = await Notifications.requestPermissionsAsync();
    status = request.status;
  }
  if (status !== 'granted') return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }

  const projectId =
    (Constants.expoConfig?.extra as any)?.eas?.projectId ?? (Constants as any).easConfig?.projectId;
  if (!projectId) return null;

  const token = await Notifications.getExpoPushTokenAsync({ projectId });
  return token.data;
}

/** Enregistre le jeton aupres du backend. Echec silencieux : le push reste optionnel. */
export async function syncPushToken(): Promise<void> {
  try {
    const token = await registerForPushNotificationsAsync();
    if (token) {
      await pushApi.register(token, Platform.OS);
    }
  } catch {
    // Doit rester non bloquant.
  }
}
