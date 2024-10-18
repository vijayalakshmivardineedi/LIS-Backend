const express = require('express');
const router = express.Router();
const { getNotificationsBySociety, updateNotificationStatus } = require('../controllers/AdminNotification');


router.get('/adminNotificationsBy/:societyId', getNotificationsBySociety);

router.delete('/deleteNotifications/:id', updateNotificationStatus);

module.exports = router;