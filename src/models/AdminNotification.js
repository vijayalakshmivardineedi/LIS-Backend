const mongoose = require('mongoose');
const adminNotificationSchema = new mongoose.Schema({
    societyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Societys",
        require: true
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['unread', 'read'],
        default: 'unread'
    },
    category: {
        type: String,
        enum: [
            'complaint',
            'resident_approval_request',
            'maintenance_payment',
            'visitor_notification',
            'event_registration',
            'Adds_notification',
            "amenietyBooking"
        ],
        required: true
    },
    userId: {
        type: String,
        required: false
    }
});

// Create the Notification model
const AdminNotification = mongoose.model('AdminNotification', adminNotificationSchema)

module.exports = AdminNotification;