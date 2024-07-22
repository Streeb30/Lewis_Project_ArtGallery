const ensureLoggedIn = (req, res, next) => {
    if (req.session && req.session.user) {
        return next();
    } else {
        res.status(401).send('Unauthorized');
    }
};

const saveReferer = (req, res, next) => {
    if (req.headers.referer) {
        req.session.referer = req.headers.referer;
    }
    next();
};

module.exports = { ensureLoggedIn, saveReferer };
