import { AppState, AppStateStatus, Vibration, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

const STICKY_ID = 'focus-mode-sticky';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

class FocusGuard {
  private subscription: ReturnType<typeof AppState.addEventListener> | null = null;
  private isActive = false;
  private _distractedCount = 0;
  private onDistracted?: () => void;

  async requestPermissions(): Promise<boolean> {
    if (Platform.OS !== 'android') return false;
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  }

  async start(onDistracted?: () => void): Promise<void> {
    this.isActive = true;
    this._distractedCount = 0;
    this.onDistracted = onDistracted;

    await this.showStickyNotification();
    this.subscription = AppState.addEventListener('change', this.handleStateChange);
  }

  async stop(): Promise<void> {
    this.isActive = false;
    this.onDistracted = undefined;
    this._distractedCount = 0;

    this.subscription?.remove();
    this.subscription = null;

    await Notifications.dismissNotificationAsync(STICKY_ID).catch(() => {});
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  get distractedCount() {
    return this._distractedCount;
  }

  private handleStateChange = async (state: AppStateStatus) => {
    if (!this.isActive) return;
    if (state === 'background' || state === 'inactive') {
      this._distractedCount++;
      this.onDistracted?.();
      await this.triggerAlert();
    }
  };

  private async triggerAlert(): Promise<void> {
    Vibration.vibrate([0, 300, 150, 300, 150, 300]);

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '⚠️ Focus Broken!',
        body: `You left your session ${this._distractedCount}x. Come back — you can do this! 💪`,
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.MAX,
        color: '#ef4444',
        vibrate: [0, 250, 250, 250],
      } as any,
      trigger: null,
    });
  }

  private async showStickyNotification(): Promise<void> {
    await Notifications.scheduleNotificationAsync({
      identifier: STICKY_ID,
      content: {
        title: '🎯 Focus Mode Active',
        body: 'Stay on task! Tap to return to your session.',
        sound: false,
        priority: Notifications.AndroidNotificationPriority.DEFAULT,
        color: '#7c3aed',
        sticky: true,
      } as any,
      trigger: null,
    });
  }
}

export const focusGuard = new FocusGuard();
