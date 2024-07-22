require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const { loadData } = require('./insertData');
const { loadArtists } = require('./insertArtists');
const artistRoutes = require('./artist-routes');
const patronRoutes = require('./patron-routes');
const userRoutes = require('./user-routes');
const path = require('path');
const { authMiddleware } = require('./middleware');

const app = express();
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use('/user', userRoutes);
app.use('/patron', patronRoutes);
app.use('/artist', artistRoutes);

const connectWithRetry = () => {
    console.log('MongoDB connection with retry');
    mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        ssl: true //ensure SSL is enabled
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

app.get('/protected-route', authMiddleware, (req, res) => {
    res.send(`Hello ${req.user.username}, this is a protected route.`);
});

module.exports = app;
