const express = require("express");
const router = express.Router();
const reviewAdminController = require("../controllers/reviewadmin.controller");

router.get("/", reviewAdminController.getAllReviews);
router.put("/toggle/:id", reviewAdminController.toggleVisibility);

module.exports = router;
