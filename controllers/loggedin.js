const db1 = require("../routes/rasa-db");
const jwt = require("jsonwebtoken");

const loggedIn = (req, res, next) => {
    if (!req.cookies.userRegistered) return next();
    try{
        const decoded = jwt.verify(req.cookies.userRegistered, process.env.JWT_SECRET);
        db1.query('SELECT * FROM user WHERE id = ?', [decoded.id], (err, result) => {
            if (err) return next();
            req.user = result[0];
            return next();
        })
    } catch(err){
        if(err) return next()
    }
}

module.exports = loggedIn;