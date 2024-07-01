const mongoose = require('mongoose');
const Artwork = require('./Artworks');
const path = require('path');
const fs = require('fs');

const galleryPath = path.join(__dirname, 'gallery.json');
const data = JSON.parse(fs.readFileSync(galleryPath, 'utf8'));

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


