require('dotenv').config({ path: 'variables.env' })
const express = require('express')
const NotificationService = require('./pushNotifications')
const app = express()
app.post('/save-token/:userId/:token', async (req, res) => {
  // dont put userId and token in params in real-life, better put them in the body
  const { userId, token } = req.params;
  // save the token in your DB, which in real life is not the global object
  global.tokens[userId] = token;
};
app.get('/test-send/:userId/:delay?', async (req, res) => {
const { userId, delay } = req.params;
  // fetch the token from your DB (here our DB is the global object, but don't do that in real life)
  const token = global.tokens[userId];

  const payload = {
    title: 'Testing notification',
    body: 'Is it working ?',
    custom: {
      customData: { field: 'value' },
    }
  };
  if (delay) await new Promise(resolve => setTimeout(resolve, delay));
  await NotificationService.send([token], payload)
  .then(results => res.json(results))
  .catch(error => console.log({ error }))
})
app.set('port', 7777);
const server = app.listen(app.get('port'), '0.0.0.0', () => {
  console.log(`Express running → PORT ${server.address().port}`);
});
