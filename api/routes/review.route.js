const express = require("express");
const router = express.Router();
const {
  createReview,
  getReviewsByProductId,
   getReviewSummaryByProductId
} = require("../controllers/review.controller");

router.post("/", createReview);
router.get("/product/:id_sp", getReviewsByProductId);
router.get("/summary/product/:id", getReviewSummaryByProductId);

module.exports = router;
