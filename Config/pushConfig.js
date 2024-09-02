const webPush = require('web-push');

const vapidKeys = {
  publicKey: 'BBGvgHlRlpH0cywllwi0qPUYwGcEm_Doyc1hEuU-2gfOQw5k2Sjmmj0bovopnN4JTchQxd3QyjAk9YEnSR_oBbs',
  privateKey: '5G20mWVjLUXYpVYtkrQRSKVjRDJuyOzV4BERSys7H18'
};

webPush.setVapidDetails(
  'mailto:your-email@example.com',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

module.exports = webPush;
