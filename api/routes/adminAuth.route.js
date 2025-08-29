const express = require("express");
const router = express.Router();
const adminAuthController = require("../controllers/adminAuth.controller");

router.post("/login", adminAuthController.loginAdmin);

module.exports = router;
