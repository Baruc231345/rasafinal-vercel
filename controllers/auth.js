const express = require("express");
const register = require("./register");
const login = require("./login");
const editUserView = require("./editUserView");
const rasa_note = require("./rasa_note");
const rasa_signature = require("./rasa_signature");
const rasa_authenticate = require("./rasa_authenticate");
const rasatesting = require("./rasatesting");
const rasatesting2 = require("./rasatesting2");
const rasatesting2_inventory = require("./rasatesting2_inventory");
const rasatesting_inventory = require("./rasatesting_inventory");
const insertSign = require("./insertSign");
const calendarInput = require ("./calendarInput");
const rasa_view = require ("./rasa_view");

const router = express.Router();
router.post("/rasa_signature", rasa_signature)
router.post("/rasa_note", rasa_note)
router.post("/register", register)
router.post("/rasa_view", rasa_view)
router.post("/rasa_authenticate", rasa_authenticate)
router.post("/calendarInput", calendarInput)
router.post("/editUserView", editUserView)
router.post("/login", login)
router.post("/rasatesting", rasatesting);
router.post("/rasatesting2", rasatesting2)
router.post("/rasatesting2_inventory", rasatesting2_inventory)
router.post("/rasatesting_inventory", rasatesting_inventory)
router.post("/insertSign", insertSign)
module.exports = router; 