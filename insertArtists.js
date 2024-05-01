const fs = require('fs');
const { User } = require('./user');

const loadArtists = async () => {
    const data = JSON.parse(fs.readFileSync('gallery.json', 'utf-8'));
    const artists = new Set(data.map(item => item.Artist));

    for (let artistName of artists) {
        const existingArtist = await User.findOne({ username: artistName });
        if (!existingArtist) {
            const newArtist = new User({
                username: artistName,
                password: '1234', // Use 1234 as password
                accountType: 'artist'
            });
            await newArtist.save();
            console.log(`Artist account created for: ${artistName}`);
        } else {
            console.log(`Artist account already exists for: ${artistName}`);
        }
    }
};

module.exports = { loadArtists };
