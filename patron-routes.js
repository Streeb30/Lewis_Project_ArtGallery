const express = require('express');
const Artwork = require('./Artworks'); // Import Artworks
const Review = require('./models/review'); // Import the review model
const Like = require('./models/like'); // Import the like model
const Workshop = require('./models/workshop'); // Import the Workshop model
const Notification = require('./models/notification'); // Import Notification model
const { User } = require('./user'); // Import the User model for managing user data
const { authMiddleware } = require('./user'); // Import authentication middleware for user validation
const { ensureLoggedIn } = require('./middleware'); // Import middleware to ensure user is logged in
const router = express.Router(); // Create a new router object to handle routing

// Get HTTP
router.get('/', ensureLoggedIn, (req, res) => { // Route for the main Patron Dashboard
    if (req.query.success) {
        res.locals.success = req.query.success;
    }
    res.render('Patron', { user: req.session.user });
});

router.get('/follow-artist', ensureLoggedIn, async (req, res) => {
    try {
        const user = await User.findById(req.session.user._id).populate('followedArtists');
        res.render('followedArtists', { 
            followedArtists: user.followedArtists, 
            user: req.session.user // Pass the user object to the template
        });
    } catch (error) {
        console.error('Error fetching followed artists:', error);
        res.status(500).send('Error fetching followed artists');
    }
});

router.get('/reviewed-liked-artworks', ensureLoggedIn, async (req, res) => {
    try {
        const userId = req.session.user._id;
        // Fetch reviews and likes made by the user and populate the Artwork references
        const reviews = await Review.find({ userId: userId }).populate('artworkId');
        const likes = await Like.find({ userId: userId }).populate('artworkId');
        // Filter out any reviews or likes that have null artwork references
        const validReviews = reviews.filter(review => review.artworkId !== null);
        const validLikes = likes.filter(like => like.artworkId !== null);
        // Pass the filtered reviews and likes to the template
        res.render('reviewedAndLiked', {
            reviewedArtworks: validReviews,
            likedArtworks: validLikes,
            user: req.session.user,
            query: req.query // Pass the query object
        });
    } catch (error) {
        console.error('Error fetching reviewed/liked artworks:', error);
        res.status(500).send('Error fetching reviewed/liked artworks');
    }
});

router.get('/notifications', ensureLoggedIn, async (req, res) => { // Route to display notifications
    try {
        const userId = req.session.user._id;
        const notifications = await Notification.find({ user: userId })
            .populate('artist', 'username') // Ensure this matches the field in the User model
            .sort({ createdAt: -1 });
            res.render('notifications', { 
                notifications,
                user: req.session.user
            });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).send('Error fetching notifications');
    }
});

router.get('/search-artworks', ensureLoggedIn, async (req, res) => {
    let { query, page = 1 } = req.query;
    page = parseInt(page);
    const limit = 10;
    const skip = (page - 1) * limit;
    try {
        if (query) {
            const regexQuery = new RegExp(query, 'i'); // Case insensitive regex
            const artworks = await Artwork.find({
                $or: [
                    { Title: regexQuery },
                    { Artist: regexQuery },
                    { Category: regexQuery }
                ]
            }).skip(skip).limit(limit);
            const totalArtworks = await Artwork.countDocuments({
                $or: [
                    { Title: regexQuery },
                    { Artist: regexQuery },
                    { Category: regexQuery }
                ]
            });
            const totalPages = Math.ceil(totalArtworks / limit);
            const pagination = {
                currentPage: page,
                hasNext: page < totalPages,
                hasPrev: page > 1,
                next: page + 1,
                prev: page - 1
            };
            res.render('searchArtworks', { 
                artworks,
                pagination,
                query,
                user: req.session.user
            });
        } else {
            res.render('searchArtworks', { // Render the search page without any artworks
                artworks: [],
                query: '',
                user: req.session.user
            });
        }
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).send('Error occurred during the search');
    }
});

router.get('/artwork/:id', ensureLoggedIn, async (req, res) => {
    try {
        const artwork = await Artwork.findById(req.params.id);
        if (!artwork) {
            return res.status(404).send('Artwork not found');
        }
        const reviews = await Review.find({ artworkId: req.params.id });
        const likes = await Like.find({ artworkId: req.params.id });
        // Check if current user has liked the artwork
        const userLike = likes.find(like => like.userId.toString() === req.session.user._id.toString());
        const isArtistOfArtwork = req.session.user.username === artwork.Artist;
        res.render('artworkDetails', { 
            artwork,
            reviews,
            likes,
            userLike,
            req,
            user: req.session.user,
            isArtistOfArtwork
        });
    } catch (error) {
        console.error('Error fetching artwork:', error);
        res.status(500).send('Error fetching artwork');
    }
});

router.get('/workshop/:workshopId', ensureLoggedIn, async (req, res) => {
    try {
        const workshopId = req.params.workshopId;
        const workshop = await Workshop.findById(workshopId)
                                       .populate('artist', 'username')
                                       .populate('enrolledUsers');
        const isUserEnrolled = workshop.enrolledUsers.some(user => user._id.equals(req.session.user._id));
        res.render('workshop', { 
            workshop, 
            isUserEnrolled, 
            user: req.session.user
        });
    } catch (error) {
        console.error('Error fetching workshop:', error);
        res.status(500).send('Error fetching workshop');
    }
});

router.get('/artist/:artistName', ensureLoggedIn, async (req, res) => {
    try {
        const artist = await User.findOne({ username: req.params.artistName });
        if (!artist) {
            return res.status(404).send('Artist not found');
        }
        const artworks = await Artwork.find({ Artist: artist.username });
        const workshops = await Workshop.find({ artist: artist._id });

        res.render('artistProfile', {
            artistName: artist.username,
            artworks,
            workshops,
            user: req.session.user
        });
    } catch (error) {
        console.error('Error fetching artist profile:', error);
        res.status(500).send('Error fetching artist profile');
    }
});

//Post HTTP
router.post('/artwork/:id/review', ensureLoggedIn, async (req, res) => {
    try {
        const artworkId = req.params.id;
        const userId = req.session.user._id;
        const artwork = await Artwork.findById(artworkId); // Fetch the artwork to check the artist
        // Prevent artists from reviewing their own artwork
        if (artwork.Artist === req.session.user.username) {
            return res.redirect('/patron/artwork/' + artworkId + '?error=Cannot review own artwork');
        }
        const newReview = new Review({
            artworkId: req.params.id,
            userId: req.session.user._id,
            content: req.body.review
        });
        await newReview.save();
        res.redirect('/patron/artwork/' + req.params.id);
    } catch (error) {
        console.error('Error adding review:', error);
        res.status(500).send('Error adding review');
    }
});

router.post('/artwork/:id/like', ensureLoggedIn, async (req, res) => {
    try {
        const artworkId = req.params.id;
        const userId = req.session.user._id;
        const artwork = await Artwork.findById(artworkId);  // Fetch the artwork to check the artist
        // Prevent artists from liking their own artwork
        if (artwork.Artist === req.session.user.username) {
            return res.redirect('/patron/artwork/' + artworkId + '?error=Cannot like own artwork');
        }
        const newLike = new Like({
            artworkId: req.params.id,
            userId: req.session.user._id
        });
        await newLike.save();
        res.redirect('/patron/artwork/' + req.params.id);
    } catch (error) {
        console.error('Error adding like:', error);
        res.status(500).send('Error adding like');
    }
});

router.post('/artwork/:artworkId/remove-review/:reviewId', ensureLoggedIn, async (req, res) => { // Remove review route
    try {
        await Review.deleteOne({ _id: req.params.reviewId, userId: req.session.user._id });
        res.redirect('/patron/artwork/' + req.params.artworkId);
    } catch (error) {
        console.error('Error removing review:', error);
        res.status(500).send('Error removing review');
    }
});

router.post('/artwork/:artworkId/remove-like/:likeId', ensureLoggedIn, async (req, res) => { // Remove like routes
    try {
        await Like.deleteOne({ _id: req.params.likeId, userId: req.session.user._id });
        res.redirect('/patron/artwork/' + req.params.artworkId);
    } catch (error) {
        console.error('Error removing like:', error);
        res.status(500).send('Error removing like');
    }
});

router.post('/follow-artist/:artistName', authMiddleware, async (req, res) => {
    try {
        const artistName = req.params.artistName;
        const userId = req.session.user._id;
        const artist = await User.findOne({ username: artistName }); // Find the artist by name to get their ID
        if (!artist) {
            return res.status(404).send('Artist not found');
        }
        // Add artist's ID to the user's followed artists list
        await User.findByIdAndUpdate(userId, {
            $addToSet: { followedArtists: artist._id }
        });
        res.json({ message: 'Followed ' + artistName });
    } catch (error) {
        console.error('Error following artist:', error);
        res.status(500).send('Error following artist');
    }
});

router.post('/enroll-workshop/:workshopId', ensureLoggedIn, async (req, res) => {
    try {
        const workshopId = req.params.workshopId;
        const userId = req.session.user._id;
        const redirectArtist = req.query.redirect;
        await Workshop.findByIdAndUpdate(workshopId, { $addToSet: { enrolledUsers: userId } }); // Enroll the user in the workshop
        res.redirect(`/patron/artist/${redirectArtist}`); // Redirect the response to the artist's profile page
    } catch (error) {
        console.error('Error enrolling in workshop:', error);
        res.status(500).send('Error enrolling in workshop');
    }
});

router.post('/unfollow-artist/:artistName', ensureLoggedIn, async (req, res) => {
    try {
        const artistName = req.params.artistName;
        const userId = req.session.user._id;        
        const artist = await User.findOne({ username: artistName }); // Find the artist by name to get their ID
        if (!artist) {
            return res.status(404).send('Artist not found');
        }
        await User.findByIdAndUpdate(userId, { // Remove the artist's ID from the user's followed artists list
            $pull: { followedArtists: artist._id }
        });
        res.redirect('/patron/artist/' + artistName + '?success=Unfollowed ' + artistName); // Redirect back to the artist's profile with a success message
    } catch (error) {
        console.error('Error unfollowing artist:', error);
        res.status(500).send('Error occurred while unfollowing the artist');
    }
});

module.exports = router;
