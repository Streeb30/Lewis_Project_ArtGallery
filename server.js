require('dotenv').config();
const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose');
const { loadData } = require('./insertData'); //init the Data(gallery.json)
const { loadArtists } = require('./insertArtists'); //make user accounts for every artist in gallery.json
const artistRoutes = require('./artist-routes'); //require artist routes
const patronRoutes = require('./patron-routes'); //require patron routes
const userRoutes = require('./user-routes'); //require user routes
const path = require('path');
const MongoStore = require('connect-mongo');

const app = express();
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

app.use(session({
    secret: process.env.SESSION_SECRET || 'default_secret',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI })
}));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true })); // Handle URL-encoded data
app.use(express.json()); // Body parser middleware
app.use('/user', userRoutes);
app.use('/patron', patronRoutes); 
app.use('/artist', artistRoutes); 

// MongoDB connection setup
// const mongoDB = process.env.MONGODB_URI;
mongoose.connect(process.env.MONGODB_URI);


const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', async () => {
    console.log('Connected to MongoDB');     
    try {
        await loadData(); // Load artwork data
        await loadArtists(); // Create artist accounts
        console.log('Data and artist accounts loaded successfully');
    } catch (error) {
        console.error('Error loading data and artist accounts:', error);
    }
});

// Routes test setup
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server listening at http://localhost:${PORT}`);
    });
}

app.get('/', (req, res) => {
    res.render('home-page');
});

module.exports = app;
