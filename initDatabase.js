const mongoose = require('mongoose');
const fs = require('fs');
//Importing
const Artwork = require('./Artworks');
const Like = require('./models/like');
const Notification = require('./models/notification');
const Review = require('./models/review');
const Workshop = require('./models/workshop');
const { User } = require('./user');

mongoose.connect('mongodb://localhost:27017/user_database', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const initializeDatabase = async () => {
    try {
        // Clear existing data
        await Artwork.deleteMany({});
        await Like.deleteMany({});
        await Notification.deleteMany({});
        await Review.deleteMany({});
        await Workshop.deleteMany({});
        await User.deleteMany({});
        // Initialize Artworks collection
        const artworksData = JSON.parse(fs.readFileSync('gallery.json', 'utf-8'));
        await Artwork.insertMany(artworksData);
        console.log('Artworks initialized from gallery.json');
        console.log('Database initialization complete.');
    } catch (error) {
        console.error('Error initializing database:', error);
    } finally {
        mongoose.disconnect();
    }
};

initializeDatabase();
