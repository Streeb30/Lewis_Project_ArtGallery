const mongoose = require('mongoose');
const fs = require('fs');

const Schema = mongoose.Schema;

const artworkSchema = new Schema({
  Title: String,
  Artist: String,
  Year: String,
  Category: String,
  Medium: String,
  Description: String,
  Poster: String
}, { strict: false });

const Artwork = mongoose.model('Artwork', artworkSchema);
const data = JSON.parse(fs.readFileSync('gallery.json', 'utf8'));

const loadData = async () => {
  try {
    await Artwork.deleteMany({});
    await Artwork.insertMany(data);
    console.log('Data loaded successfully');
  } catch (error) {
    console.error('Error loading data:', error);
  }
};

module.exports = { loadData };

