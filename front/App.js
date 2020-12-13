import React from 'react';
import { SafeAreaView, StyleSheet, View, Text, StatusBar, TouchableOpacity, Platform, Alert } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import Notifications from './NotificationService'

class App extends React.Component {
  constructor(props) {
    super(props);
    Notifications.init(this.handleRegister);
  }
  
  
  handleRegister = async deviceToken => {
    this.userId = DeviceInfo.getUniqueId();
    this.registered = await fetch(`http://192.168.178.12:7777/save-token/${this.userId}/${deviceToken}`, {
      method: 'POST',
    }).then(res => res.ok);
  };

  componentDidMount() {
    Notifications.listen(this.handleNotification);
  }

  handleNotification = (notification) => {
    let customData = notification?.data?.customData;
    if (!customData) return;
    if (Platform.OS === 'android') customData = JSON.parse(customData);
    // do what you need to do !
    Alert.alert(Object.keys(customData)[0], customData[Object.keys(customData)[0]]);
  };

  
  componentWillUnmount() {
    Notifications.delete();
  }

  handleNotificationPressWithDelay = delay => async () => {
    const params = [this.userId, delay];
    await fetch(`http://{YOUR_IP}:7777/test-send/${params.filter(p => p).join('/')}`)
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
