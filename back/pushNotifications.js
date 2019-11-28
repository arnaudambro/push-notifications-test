const PushNotifications = require('node-pushnotifications');

class NotificationService {
  constructor() {
    this.config = {
      apn: {
        token: {
          key: process.env.APNS_P8.replace(/\\n/g, '\n'), // optionally: fs.readFileSync('./certs/key.p8')
          keyId: process.env.APNS_KEY_ID,
          teamId: process.env.APNS_TEAM_ID,
        },
        production: false // true for APN production environment, false for APN sandbox environment,
      },
      gcm: {
        id: process.env.API_GCM_KEY,
        phonegap: false, // phonegap compatibility mode, see below (defaults to false)
      },
      isAlwaysUseFCM: false, // true all messages will be sent through node-gcm (which actually uses FCM)
    };
    this.push = new PushNotifications(this.config);
  }

  send(registrationIds, data) {
    return this.push.send(registrationIds, data);
  }
}

module.exports = NotificationService;
