const mongoose = require('mongoose');

const likeSchema = new mongoose.Schema({
    artworkId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Artworks',
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
});

likeSchema.index({ artworkId: 1, userId: 1 }, { unique: true });

const Like = mongoose.model('like', likeSchema);
module.exports = Like;