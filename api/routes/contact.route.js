const express = require("express");
const router = express.Router();
const contactController = require("../controllers/contact.controller");

// POST /api/contact/send
router.post("/send", contactController.sendContact);

module.exports = router;
