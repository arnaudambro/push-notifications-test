require('dotenv').config({ path: 'variables.env' });
const express = require('express')
const NotificationService = require('./pushNotifications');
const app = express()

global.tokens = {}

app.get('/', (req, res) => res.send('Hello World!'))

app.post('/save-token/:userId/:token', async (req, res) => {
  // dont put userId and token in params in real-life, better put them in the body
  const { userId, token } = req.params;
  global.tokens[userId] = token;
  res.json({ message: 'success' });
})

app.get('/test-send/:userId/:delay?', async (req, res) => {
  const { userId, delay } = req.params;
  // fetch the token from your DB (here our DB is the global object, but don't do that in real life)
  const token = global.tokens[userId];
  const apnsDdata = {
    title: 'Testing notification',
    topic: process.env.APNS_BUNDLE_ID,
    body: 'Is it working ?',
    custom: {
      field: 'value',
    },
    priority: 'high',
    collapseKey: '',
    contentAvailable: true, // gcm, apn. node-apn will translate true to 1 as required by apn.
    pushType: 'alert',
    timeToLive: 28 * 86400,
  };
  const notification = new NotificationService();
  if (delay) await new Promise(resolve => setTimeout(resolve, delay));
  notification.send([token], apnsDdata)
  .then(result => res.json(result))
  .catch(error => console.log({ error }))
})



app.set('port', 7777);
const server = app.listen(app.get('port'), '0.0.0.0', () => {
  console.log(`Express running → PORT ${server.address().port}`);
});
