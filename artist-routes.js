const express = require('express');
const Artwork = require('./Artworks');
const Notification = require('./models/notification');
const { User } = require('./user');
const Workshop = require('./models/workshop');
const router = express.Router();
const { ensureLoggedIn } = require('./middleware'); //import middleware to ensure user is logged in

async function createNotificationForFollowers(artistId, message, type, referenceId) {
    const followers = await User.find({ followedArtists: artistId });
    followers.forEach(async (follower) => {
        const notification = new Notification({
            user: follower._id,
            artist: artistId,
            message,
            type,
            referenceId
        });
        await notification.save();
    });
}

router.get('/add-artwork', ensureLoggedIn, (req, res) => {
    res.render('addArtwork', {
        user: req.session.user
    });
});

router.get('/add-workshop', ensureLoggedIn, (req, res) => {
    res.render('addWorkshop', {
        user: req.session.user
    });
});

router.get('/artist-dashboard', ensureLoggedIn, async (req, res) => {
    try {
        const artistId = req.session.user._id;
        const artistName = req.session.user.username; // Assuming the artist's username is the artist name
        const artworks = await Artwork.find({ Artist: artistName });
        const workshops = await Workshop.find({ artist: artistId });
        res.render('artistDashboard', {
            user: req.session.user,
            artworks: artworks,
            workshops: workshops
        });
    } catch (error) {
        console.error('Error accessing artist dashboard:', error);
        res.status(500).send('Error accessing artist dashboard');
    }
});

router.get('/artist/:artistName', ensureLoggedIn, async (req, res) => {
    try {
        const artist = await User.findOne({ username: req.params.artistName });
        if (!artist) {
            return res.status(404).send('Artist not found');
        }
        // Fetch artworks and workshops associated with the artist
        const artworks = await Artwork.find({ Artist: artist.username });
        const workshops = await Workshop.find({ artist: artist.username });
        const artistName = artist.username; // assuming artist has a username property
        res.render('artistProfile', {
            artistName,
            artworks,
            workshops,
            user: req.session.user
        });
    } catch (error) {
        console.error('Error fetching artist profile:', error);
        res.status(500).send('Error fetching artist profile');
    }
});

router.get('/artwork/:id', ensureLoggedIn, async (req, res) => {
    try {
        const artworkId = req.params.id;
        const artwork = await Artwork.findById(artworkId);

        if (!artwork) {
            return res.status(404).send('Artwork not found');
        }

        res.render('artworkDetails', { artwork: artwork });
    } catch (error) {
        console.error('Error fetching artwork details:', error);
        res.status(500).send('Error fetching artwork details');
    }
});

router.get('/switch-to-patron', async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/user/login');
    }
    try {
        const userId = req.session.user._id;
        await User.findByIdAndUpdate(userId, { accountType: 'patron' });
        req.session.user.accountType = 'patron'; // Update the session information
        res.redirect('/patron'); // Redirect to the patron dashboard
    } catch (error) {
        console.error('Error switching to patron:', error);
        res.status(500).send('Error occurred while switching to patron');
    }
});

router.post('/add-artwork', ensureLoggedIn, async (req, res) => {
    try {
        const { Title, Year, Category, Medium, Description, Poster } = req.body;
        const artistName = req.session.user.username; // Artist's username for the message
        const artistId = req.session.user._id;
        const existingArtwork = await Artwork.findOne({ Title: Title });
        if (existingArtwork) {
            return res.render('addArtwork', {
                user: req.session.user,
                showAlert: true
            });
        }
        const newArtwork = new Artwork({
            Title,
            Artist: artistName,
            Year,
            Category,
            Medium,
            Description,
            Poster
        });
        await newArtwork.save(); // Save the new artwork
        await createNotificationForFollowers(artistId, `New artwork added: ${Title}`, 'artwork', newArtwork._id);
        const user = await User.findById(artistId); // Fetch the current user
        // Check if the user has an artistProfile and artworks array
        if (user.artistProfile) {
            user.artistProfile.artworks.push(newArtwork._id); // Add the new artwork ID to the user's artworks array
        } else {
            user.artistProfile = { artworks: [newArtwork._id] }; // If not, create the artistProfile and artworks array
        }

        if (user.accountType === 'patron') {
            user.accountType = 'artist';
        }
        await user.save(); // Save the updated user
        req.session.user = user;
        res.redirect('/artist/artist-dashboard');
    } catch (error) {
        console.error('Error adding artwork:', error);
        res.status(500).send('Error adding artwork');
    }
});

router.post('/add-workshop', ensureLoggedIn, async (req, res) => {
    try {
        const { title } = req.body;
        const artistId = req.session.user._id; // Use artist's ObjectId
        const artistName = req.session.user.username; // Artist's username for the message

        const newWorkshop = new Workshop({
            title,
            artist: artistId,
            enrolledUsers: [] // Initially empty
        });
        await newWorkshop.save();
        // Create notifications for followers
        await createNotificationForFollowers(artistId, `New workshop created: ${title}`, 'workshop', newWorkshop._id);
        res.redirect('/artist/artist-dashboard');
    } catch (error) {
        console.error('Error adding workshop:', error);
        res.status(500).send('Error adding workshop');
    }
});

module.exports = router;