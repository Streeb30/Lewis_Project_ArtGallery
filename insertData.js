const mongoose = require('mongoose');
const fs = require('fs');
const Artwork = require('./Artworks'); // Import the Artwork model

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
