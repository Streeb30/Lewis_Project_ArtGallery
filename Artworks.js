const mongoose = require('mongoose');

//define a schema for 'artwork'
const artworkSchema = new mongoose.Schema({
    Title: String,
    Artist: String,
    Year: String,
    Category: String,
    Medium: String,
    Description: String,
    Poster: String,
    addedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
});


const Artwork = mongoose.models.Artworks || mongoose.model('Artworks', artworkSchema);
module.exports = Artwork;
