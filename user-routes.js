const fs = require('fs');
const path = require('path');
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { User, register, login, authMiddleware, switchAccountType } = require('./user');
const Artwork = require('./Artworks');

const getGalleryArtworks = () => {
    const galleryPath = path.join(__dirname, 'gallery.json');
    const galleryData = fs.readFileSync(galleryPath, 'utf8');
    return JSON.parse(galleryData);
};

const ensureLoggedIn = (req, res, next) => {
    if (req.session && req.session.user) {
        return next();
    } else {
        res.status(401).send('Unauthorized');
    }
};

const generateToken = (user) => {
    const payload = {
        id: user._id,
        username: user.username,
        accountType: user.accountType
    };
    const secret = process.env.JWT_SECRET || 'default_secret';
    const options = { expiresIn: '1h' };
    return jwt.sign(payload, secret, options);
};

router.get('/register', (req, res) => {
    res.render('register', { query: req.query });
});

router.get('/login', (req, res) => {
    res.render('login', { query: req.query });
});

router.get('/patron', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/user/login');
    }
    res.render('Patron', { user: req.session.user });
});

router.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('Error on logout:', err);
            return res.redirect('/patron');
        }
        res.redirect('/');
    });
});

router.get('/upgrade-to-artist', ensureLoggedIn, async (req, res) => {
    try {
        const userId = req.session.user._id;
        const user = await User.findById(userId).populate('artistProfile.artworks');

        // Load hardcoded artworks from gallery.json
        const galleryArtworks = getGalleryArtworks();
        const userGalleryArtworks = galleryArtworks.filter(artwork => artwork.artistId === userId.toString());

        // Merge database artworks with gallery artworks
        const totalArtworks = (user.artistProfile.artworks || []).length + userGalleryArtworks.length;

        if (totalArtworks > 0) {
            user.accountType = 'artist';
            await user.save();
            req.session.user.accountType = 'artist';
            req.session.save(err => {
                if (err) {
                    console.error('Session save error:', err);
                    return res.status(500).send('Internal Server Error');
                }
                res.redirect('/artist/artist-dashboard');
            });
        } else {
            res.redirect('/artist/add-artwork');
        }
    } catch (error) {
        console.error('Error in upgrade to artist:', error);
        res.status(500).send('Error occurred while upgrading to artist');
    }
});

router.get('/profile', (req, res) => {
    res.render('user-profile', { user: req.session.user });
});

router.get('/protected-route', authMiddleware, (req, res) => {
    res.send('This is a protected route');
});

router.post('/register', register);

router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        if (!user || user.password !== password) {
            return res.json({ success: false, message: 'Invalid username or password' });
        }
        const token = generateToken(user);
        res.json({ success: true, token, user });
    } catch (error) {
        console.error('Login error:', error);
        res.json({ success: false, message: 'An error occurred. Please try again.' });
    }
});

router.post('/switch-account-type', ensureLoggedIn, async (req, res) => {
    try {
        const user = await User.findById(req.session.user._id).populate('artistProfile.artworks');
        
        if (user.accountType === 'patron' && (user.artistProfile && user.artistProfile.artworks.length > 0)) {
            user.accountType = 'artist';
        } else {
            user.accountType = 'patron';
        }
        
        await user.save();
        req.session.user = user;
        req.session.save(err => {
            if (err) {
                console.error('Session save error:', err);
                return res.status(500).send('Failed to save session');
            }
            res.redirect(user.accountType === 'artist' ? '/artist/artist-dashboard' : '/patron');
        });
    } catch (error) {
        console.error('Error switching account type:', error);
        res.status(500).send('Error occurred while switching account type');
    }
});

module.exports = router;
