const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    artworkId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Artworks',
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    content: String,
    timestamp: { type: Date, default: Date.now }
});

const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;
