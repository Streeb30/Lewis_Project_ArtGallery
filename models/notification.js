const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    artist: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
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
    type: {
        type: String,
        required: true
    },
    referenceId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    onModel: {
        type: String,
        enum: ['Artwork', 'Workshop']
    }
});

const Notification = mongoose.model('Notification', notificationSchema);
module.exports = Notification;
