const mongoose = require('mongoose');

// Define a schema for 'artwork'
const artworkSchema = new mongoose.Schema({
    Title: String, // 'Title' field for storing the title of the artwork
    Artist: String,
    Year: String,
    Category: String,
    Medium: String,
    Description: String,
    Poster: String,
    addedBy: { // 'addedBy' field to reference the user who added this artwork
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
});

// Create a model from the schema
const Artwork = mongoose.models.Artworks || mongoose.model('Artworks', schema);
// Export the model so it can be imported and used in other parts of the application
module.exports = Artwork;
