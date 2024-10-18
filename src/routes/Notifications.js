const express = require("express")
const { getNotifications, deleteNotification, getNotificationsBySocietyId } = require("../controllers/Notifications")
const router = express.Router()

router.get("/getAllNotification", getNotifications)
router.delete("/deleteNotification/:id", deleteNotification);
router.get("/getNotificationsBySocietyId/:societyId", getNotificationsBySocietyId);
module.exports = router

