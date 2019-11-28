import React from 'react';
import {SafeAreaView, StyleSheet, View, Text, StatusBar, TouchableOpacity, AppState, Platform} from 'react-native';
import NotificationsIOS, {NotificationsAndroid, PendingNotifications} from 'react-native-notifications';
import PushNotificationIOS from '@react-native-community/push-notification-ios';
import DeviceInfo from 'react-native-device-info';

const isIOS = Platform.OS === 'ios';
const isAndroid = Platform.OS === 'android';

class App extends React.Component {
  state = {
    appState: AppState.currentState,
  };

  componentDidMount() {
    AppState.addEventListener('change', this._handleAppStateChange);
    /* iOS */
    if (isIOS) {
      NotificationsIOS.requestPermissions();
      NotificationsIOS.addEventListener('remoteNotificationsRegistered', this.onPushRegistered);
      NotificationsIOS.addEventListener('remoteNotificationsRegistrationFailed', this.onPushRegistrationFailed);
    }
    /* Android */
    if (isAndroid) {
      NotificationsAndroid.setRegistrationTokenUpdateListener(this.onPushRegistered);
    }
  }

  /*

  APP STATE CHANGE

  */
  _handleAppStateChange = async nextAppState => {
    if (this.state.appState.match(/inactive|background/) && nextAppState === 'active' && this.registered) {
      this.addNotificationsEventListeners();
      if (isIOS) {
        const notification = await PushNotificationIOS.getInitialNotification();
        if (notification) {
          this.onNotificationReceivedBackground(notification);
        }
      }
      if (isAndroid) {
        const notification = await PendingNotifications.getInitialNotification()
        if (notification) {
          this.onAndroidNotificationReceived(notification);
        }
      }
    }
    this.setState({appState: nextAppState});
  };

  /*

  REGISTRATION

  */

  onPushRegistered = async deviceToken => {
    this.userId = DeviceInfo.getUniqueId();
    if (!this.registered) {
      this.registered = await fetch(`http://192.168.178.12:7777/save-token/${this.userId}/${deviceToken}`, {
        method: 'POST',
      }).then(res => res.ok);
    }
    if (this.registered) {
      this.addNotificationsEventListeners();
    }
  };

  onPushRegistrationFailed = error => {
    console.error(error);
  };

  /*

  LISTENERS SETUP / REMOVAL

  */

  addNotificationsEventListeners = () => {
    if (isIOS) {
      NotificationsIOS.addEventListener('notificationReceivedForeground', this.onNotificationReceivedForeground);
      NotificationsIOS.addEventListener('notificationOpened', this.onNotificationOpened);
      PushNotificationIOS.addEventListener('notification', this.onNotificationReceivedBackground);
    }
    if (isAndroid) {
      NotificationsAndroid.setNotificationReceivedListener(this.onAndroidNotificationReceived);
      NotificationsAndroid.setNotificationReceivedInForegroundListener(this.onAndroidNotificationReceived);
      NotificationsAndroid.setNotificationOpenedListener(this.onAndroidNotificationReceived);
    }
  };

  componentWillUnmount() {
    // prevent memory leaks!
    AppState.removeEventListener('change', this._handleAppStateChange);
    if (isIOS) {
      NotificationsIOS.removeEventListener('remoteNotificationsRegistered', this.onPushRegistered);
      NotificationsIOS.removeEventListener('remoteNotificationsRegistrationFailed', this.onPushRegistrationFailed);
      NotificationsIOS.removeEventListener('notificationReceivedForeground', this.onNotificationReceivedForeground);
      NotificationsIOS.removeEventListener('notificationOpened', this.onNotificationOpened);
    }
  }

  /*

  LISTENERS HANDLERS

  */

  onAndroidNotificationReceived = notification => {
    console.log('Notification Received - Android ', notification);
  };

  onNotificationReceivedForeground = (notification, completion) => {
    if (completion) {
      completion({alert: true, sound: false, badge: false});
    }
    console.log('Notification Received - Foreground', notification);
    PushNotificationIOS.removeAllDeliveredNotifications();
  };

  onNotificationReceivedBackground = (notification, completion) => {
    if (completion) {
      completion({alert: true, sound: false, badge: false});
    }
    console.log('Notification Received - Background', notification);
    PushNotificationIOS.removeAllDeliveredNotifications();
  };

  onNotificationOpened = (notification, completion, action) => {
    console.log('Notification opened by device user', notification);
    console.log(
      `Notification opened with an action identifier: ${action.identifier} and response text: ${action.text}`,
      notification,
    );
    completion();
  };

  /*

  NOTIFICATION TRIGGER

  */


  handleNotificationPressWithDelay = delay => async () => {
    const params = [this.userId, delay];
    await fetch(`http://192.168.178.12:7777/test-send/${params.filter(p => p).join('/')}`)
      .then(res => console.log({res}))
      .catch(error => console.log({error}));
  };

  render() {
    return (
      <>
        <StatusBar barStyle="dark-content" />
        <SafeAreaView style={styles.body}>
          <TouchableOpacity
            accessibilityRole={'button'}
            onPress={this.handleNotificationPressWithDelay(10000)}
            style={styles.linkContainer}>
            <Text style={styles.link}>Notification in 10 seconds</Text>
          </TouchableOpacity>
          <View style={styles.separator} />
          <TouchableOpacity
            accessibilityRole={'button'}
            onPress={this.handleNotificationPressWithDelay(0)}
            style={styles.linkContainer}>
            <Text style={styles.link}>Notification now</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </>
    );
  }
}

const styles = StyleSheet.create({
  body: {
    backgroundColor: '#333',
    justifyContent: 'space-around',
    alignItems: 'center',
    flex: 1,
    height: '100%',
  },
  container: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  linkContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
    backgroundColor: '#ddd',
    borderRadius: 40,
    height: 40,
    width: '80%',
  },
  link: {
    flex: 2,
    fontSize: 18,
    fontWeight: '400',
    color: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  separator: {
    backgroundColor: '#ddd',
    height: 1,
    width: '100%',
  },
});

export default App;
