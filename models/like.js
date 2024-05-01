const mongoose = require('mongoose');

const likeSchema = new mongoose.Schema({
    artworkId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Artworks',
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }
});

const Like = mongoose.model('like', likeSchema);
module.exports = Like;