const webpush = require('web-push');

webpush.setVapidDetails(process.env.VAPID_EMAIL || 'mailto:admin@example.com', process.env.VAPID_PUBLIC, process.env.VAPID_PRIVATE);

module.exports = webpush;
