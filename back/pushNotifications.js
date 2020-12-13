const PushNotifications = require('node-pushnotifications');
const config = {
   apn: {
     token: {
        key: process.env.APNS_P8.replace(/\\n/g, '\n'),
        keyId: process.env.APNS_KEY_ID,
        teamId: process.env.APNS_TEAM_ID,
      },
      production: process.env.NODE_ENV !== "development",
   },
   gcm: {
     id: process.env.FCM_API_KEY,
   },
   isAlwaysUseFCM: false,
 };
const NotificationService = new PushNotifications(config);
NotificationService.send = function (tokens, data) {
  const payload = {
    topic: process.env.APNS_BUNDLE_ID,
    priority: "high",
    retries: 1,
    pushType: "alert",
    expiry: Math.floor(Date.now() / 1000) + 28 * 86400,
    sound: "bingbong.aiff",
    ...data,
  };
  return this.send(tokens, payload);
}
module.exports = NotificationService;
