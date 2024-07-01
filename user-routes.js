const express = require('express');
const router = express.Router();
const { User, register, login, authMiddleware, switchAccountType } = require('./user');
const Artwork = require('./Artworks');

const ensureLoggedIn = (req, res, next) => {
    if (req.session && req.session.user) {
        return next();
    } else {
        res.status(401).send('Unauthorized');
    }
};

// GET routes
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
        if (user.artistProfile && user.artistProfile.artworks.length > 0) {
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

// POST routes
router.post('/register', register);

router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        if (!user || user.password !== password) {
            return res.redirect('/user/login?error=Invalid username or password');
        }
        req.session.user = user;
        req.session.save(err => {  // Ensure the session is saved before redirecting
            if (err) {
                console.error('Session save error:', err);
                return res.status(500).send('Failed to save session');
            }
            if (user.accountType === 'artist') {
                res.redirect('/artist/artist-dashboard');
            } else {
                res.redirect('/patron');
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.redirect('/user/login?error=An error occurred. Please try again.');
    }
});

router.post('/switch-account-type', ensureLoggedIn, async (req, res) => {
    const user = await User.findById(req.session.user._id);
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
});

module.exports = router;
