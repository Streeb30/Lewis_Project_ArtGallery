const mongoose = require('mongoose');
const Artwork = require('./Artworks');

// Define the user schema
const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    accountType: {
        type: String,
        required: true,
        enum: ['patron', 'artist'],
        default: 'patron'
    },
    artistProfile: { 
        artworks: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Artworks'
        }]
    },
    followedArtists: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
});

const User = mongoose.model('User', userSchema);

const register = async (req, res) => {
    try {
        const { username, password } = req.body;
        let newUser = new User({ username, password });
        newUser = await newUser.save();
        req.session.user = newUser.toObject();
        res.redirect('/patron?success=Registration successful');
    } catch (error) {
        console.log('Error during registration:', error);
        if (error.code === 11000) {
            res.redirect('/user/register?error=Username already registered');
        } else {
            res.status(500).send('Error during registration');
        }
    }
};

const login = async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username, password });
        if (!user || user.password !== password) {
            res.redirect('/user/login?error=Invalid username or password');
        }
        req.session.user = user;
        res.redirect('/patron');
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).send(error.message);
    }
};

const authMiddleware = (req, res, next) => {
    if (req.session && req.session.user) {
        return next();
    } else {
        return res.status(401).send('Unauthorized');
    }
};

const switchAccountType = async (req, res) => {
    try {
        const { username, newType } = req.body;
        const updatedUser = await User.findOneAndUpdate({ username }, { accountType: newType }, { new: true });
        if (!updatedUser) {
            return res.status(404).send('User not found');
        }
        res.send(`Account type updated to ${newType}`);
    } catch (error) {
        res.status(500).send(error.message);
    }
};

module.exports = {
    User,
    register,
    login,
    authMiddleware,
    switchAccountType
};
