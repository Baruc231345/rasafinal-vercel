const express = require("express");
const jwt = require("jsonwebtoken");
const db1 = require("../routes/rasa-db");
const bcrypt = require("bcryptjs");
const app = express();

const session = require('cookie-session');

app.use(session({
  secret: "capstone", 
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }, // Set secure to true if using HTTPS
}));

const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email)
    return res.json({ status: "error", error: "Please enter your email" });
  else if (!password)
    return res.json({ status: "error", error: "Please enter your password" });
  else {
    db1.query(
      "SELECT * FROM user WHERE email = ?",
      [email],
      async (err, result) => {
        if (err) throw err;
        if (
          !result.length ||
          !(await bcrypt.compare(password, result[0].password))
        ) {
          return res.json({
            status: "error",
            error: "Incorrect email or password",
          });
        } else if (result[0].pending === 0) {
          return res.json({
            status: "error",
            error: "Your account is still pending",
          });
        } else {
          const token = jwt.sign({ id: result[0].id }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES,
          });
          const cookieOptions = {
            expires: new Date(
              Date.now() + process.env.COOKIE_EXPIRES * 24 * 60 * 60 * 1000
            ),
            httpOnly: true,
          };
          res.cookie("userRegistered", token, cookieOptions);
          req.session.universalId = result[0].id;
          const dashboardUrl = result[0].role === "admin" ? "/dashboardAdmin" : `/dashboardRegular/${req.session.universalId}`;

          console.log(req.session.universalId + "login.js")
          return res.json({
            status: "success",
            success: "User has been logged in",
            dashboardUrl: dashboardUrl,
            user_id: result[0].id,
            universalId: result[0].id, // Add the universalId to the response
          });
        }
      }
    );
  }
};

module.exports = login;