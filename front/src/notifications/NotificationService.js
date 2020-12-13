import PushNotification from 'react-native-push-notification';
import PushNotificationIOS from '@react-native-community/push-notification-ios';
import { AppState, Platform } from 'react-native';
import { checkNotifications, RESULTS } from 'react-native-permissions';
import API from '../api/api';

// BIIIIG WARNING: in iOS you'll get a token ONLY if you request permission for it.
// Therefore, a call for PushNotification.requestPermissions() is required.

// Android doesn't need the user's consent to send notifications, whereas iOS does
// but Android's user can still turn off notifications in the system settings

class NotificationService {
  init = (registerHandler) => {
    this.configure();
    this.registerHandler = registerHandler;
  };

  delete = () => {
    AppState.removeEventListener('change', this.handleAppStateChange);
    PushNotificationIOS.removeEventListener('registrationError', this.failIOSToken);
  };

  async configure() {
    const onRegister = this.handleRegister;
    PushNotification.configure({
      onNotification: this.handleNotification,
      onRegister,
      // IOS ONLY (optional): default: all - Permissions to register.
      permissions: {
        alert: true,
        badge: true,
        sound: true,
      },

      popInitialNotification: true,
      requestPermissions: false, // set to true if you want to request iOS notification when the app starts
    });
    this.checkAndGetPermissionIfAlreadyGiven('configure');
    this.initAndroidLocalScheduledNotifications();
    if (Platform.OS === 'ios') {
      PushNotificationIOS.addEventListener('registrationError', this.failIOSToken);
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
    AppState.addEventListener('change', this.handleAppStateChange);
  }

  handleAppStateChange = (newState) => {
    if (newState === 'active') {
      this.checkAndGetPermissionIfAlreadyGiven('appstate change');
    }
  };

  failIOSToken = (fail) => {
    if (Platform.OS === 'android') return;
    console.log({ fail });
  };

  handleRegister = async ({ token }) => {
    console.log({ from, token });
    if (token) this.registerHandler(token)
  };

  checkPermission = async () => {
    const authStatus = await checkNotifications().then(({ status }) => status);
    // …'unavailable' | 'denied' | 'limited' | 'granted' | 'blocked'
    let permission = { granted: false, canAsk: false };
    switch (authStatus) {
      case RESULTS.UNAVAILABLE:
        // This feature is not available (on this device / in this context)
        permission = { granted: false, canAsk: false };
        break;
      case RESULTS.DENIED:
        // The permission has not been requested / is denied but requestable;
        // That's where you show your custom screen if you want
        permission = { granted: false, canAsk: true };
        break;
      case RESULTS.LIMITED:
        // The permission is limited: some actions are possible
        permission = { granted: true };
        break;
      case RESULTS.GRANTED:
        // The permission is granted
        permission = { granted: true };
        break;
      case RESULTS.BLOCKED:
        // The permission is denied and not requestable anymore
        // The only way to get the user turn on notifications again
        // is to bring him/her to the app system settings
        // with Linking.openSettings()
        permission = { granted: false, canAsk: false };
        break;
    }
    return permission;
  };

  // one of these two following methods need to be called when the app starts
  // so that the iOS token is returned and saved to your DB

  checkAndGetPermissionIfAlreadyGiven = async (from) => {
    // useful if you want to control when you ask the user for notifications
    // and if you want to show your own screen/popup to explain
    // why it would be great for the user to have notifications
    const { granted } = await this.checkPermission();
    if (!granted) return true;
    const permission = await PushNotification.requestPermissions();
    return permission;
  };

  checkAndAskForPermission = async () => {
    // useful if you want to request the user's permission without further explanation when the app starts
    const { granted, canAsk } = await this.checkPermission();
    if (granted) return true;
    if (!canAsk) return false;
    const permission = await PushNotification.requestPermissions();
    return permission;
  };

  // LOCAL NOTIFICATIONS

  channelId = 'PUSH-LOCAL-NOTIFICATIONS'; // same as in strings.xml, for Android
  initAndroidLocalScheduledNotifications = () => {
    PushNotification.createChannel(
      {
        channelId: this.channelId, // (required)
        channelName: 'Push local notifications', // (required)
        soundName: 'default', // (optional) See `soundName` parameter of `localNotification` function
        importance: 4, // (optional) default: 4. Int value of the Android notification importance
        vibrate: true, // (optional) default: true. Creates the default vibration patten if true.
      },
      (created) => console.log(`createChannel returned '${created}'`)
    );
  };

  //Appears after a specified time. App does not have to be open.
  // Not useful for the Push Notifications tutorial, but... here it is.
  scheduleNotification({ date, title, message, playSound = true, soundName = 'default' } = {}) {
    PushNotification.localNotificationSchedule({
      date,
      title,
      message,
      playSound,
      soundName,
      channelId: this.channelId,
    });
  }

  localNotification({ title, message, playSound = true, soundName = 'default' } = {}) {
    PushNotification.localNotification({
      title,
      message,
      playSound,
      soundName,
      channelId: this.channelId,
    });
  }

  cancelAll() {
    PushNotification.cancelAllLocalNotifications();
  }

  // PUSH NOTIFICATIONS
  getInitNotification() {
    PushNotification.popInitialNotification((notification) => {
      console.log('Initial Notification', notification);
      this.handleNotification(notification);
    });
  }

  listeners = {};
  handleNotification = (notification) => {
    console.log('handle Notification', JSON.stringify(notification, null, 2));

    /* ANDROID FOREGROUND */

    if (Platform.OS === 'android') {
      // if not the line below, the notification is launched without notifying
      // with the line below, there is a local notification triggered
      if (notification.foreground && !notification.userInteraction) return;
    }
    /* LISTENERS */

    const listenerKeys = Object.keys(this.listeners);
    //  handle initial notification if any, if no listener is mounted yet
    if (!listenerKeys.length) {
      this.initNotification = notification;
      notification.finish(PushNotificationIOS.FetchResult.NoData);
      return;
    }
    this.initNotification = null;

    //handle normal notification
    for (let i = listenerKeys.length - 1; i >= 0; i--) {
      const notificationHandler = this.listeners[listenerKeys[i]];
      notificationHandler(notification);
    }
    notification.finish(PushNotificationIOS.FetchResult.NoData);
  };

  listen = (callback) => {
    const listenerKey = `listener_${Date.now()}`;
    this.listeners[listenerKey] = callback;
    if (this.initNotification) this.handleNotification(this.initNotification);
    return listenerKey;
  };

  remove = (listenerKey) => {
    delete this.listeners[listenerKey];
  };
}

const Notifications = new NotificationService();

export default Notifications;
