const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const groupChatSchema = new mongoose.Schema({
    groupName: {
        type: String,
        required: true,
    },
    societyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "society"
    },
    groupId: {
        type: String,
        required: true,
        default: uuidv4,
    },
    members: [{
        residents: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'UserProfile'
        },
    }],
    messages: [{
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            // refPath: 'messages.senderType' 
            ref: "UserProfile"
        },
        
        content: { type: String },
        createdAt: { type: Date, default: Date.now }
    }]
});
// 
const individualChatSchema = new mongoose.Schema({
    societyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "society"
    },
    conversationId: {
        type: String,
        default: uuidv4,
        unique: true
    },
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: ['UserProfile', "society"] }],
    messages: [{
        sender: { type: mongoose.Schema.Types.ObjectId, ref: 'UserProfile' },
        content: { type: String, required: true },
        createdAt: { type: Date, default: Date.now }
    }]
});
const GroupChat = mongoose.model('GroupChat', groupChatSchema);
const IndividualChat = mongoose.model('IndividualChat', individualChatSchema);
module.exports = { GroupChat, IndividualChat }