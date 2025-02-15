require('dotenv').config();
const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose');
const { loadData } = require('./insertData');
const { loadArtists } = require('./insertArtists');
const artistRoutes = require('./artist-routes');
const patronRoutes = require('./patron-routes');
const userRoutes = require('./user-routes');
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
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use((req, res, next) => {
    res.locals.session = req.session;
    next();
});

app.use('/user', userRoutes);
app.use('/patron', patronRoutes);
app.use('/artist', artistRoutes);

const connectWithRetry = () => {
    console.log('MongoDB connection with retry');
    mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        ssl: true
    }).then(() => {
        console.log('MongoDB is connected');
    }).catch(err => {
        console.log('MongoDB connection unsuccessful, retry after 5 seconds. ', err);
        setTimeout(connectWithRetry, 5000);
    });
};

connectWithRetry();

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', async () => {
    console.log('Connected to MongoDB');
    try {
        await loadData();
        await loadArtists();
        console.log('Data and artist accounts loaded successfully');
    } catch (error) {
        console.error('Error loading data and artist accounts:', error);
    }
});

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
