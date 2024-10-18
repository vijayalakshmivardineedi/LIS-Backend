const AdminNotification = require('../models/AdminNotification');

// Get notifications by society
exports.getNotificationsBySociety = async (req, res) => {

    try {
        const { societyId } = req.params;
        const notifications = await AdminNotification.find({ societyId }).sort({ createdAt: -1 }); // Sort by latest
        if (!notifications.length) {
            return res.status(404).json({ success: false, message: "No notifications found for this society." });
        }
        return res.status(200).json({ success: true, notifications });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Error fetching notifications." });
    }
};

exports.updateNotificationStatus = async (req, res) => {

    try {
        const { id } = req.params;
        console.log(id)
        const notification = await AdminNotification.findByIdAndDelete(id)
        if (!notification) {
            return res.status(404).json({ success: false, message: "Notification not found." });
        }

        await notification.save();

        return res.status(200).json({ success: true, message: "Notification deleted successfully." });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Error updating notification status." });
    }
};

