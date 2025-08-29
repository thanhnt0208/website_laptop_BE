const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const { createReview, getReviewsByProduct, getOrderDetails } = require("../controllers/review.controller");

// Cấu hình storage multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // thư mục lưu file
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

// Filter file ảnh/video
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|mp4|mov|avi/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error("Chỉ được upload ảnh hoặc video"));
  }
};

const upload = multer({ storage, fileFilter });

// POST /api/reviews
router.post(
  "/",
  upload.fields([
    { name: "images", maxCount: 5 },
    { name: "videos", maxCount: 2 },
  ]),
  createReview
);
router.get("/products/:id_sp", getReviewsByProduct);

router.get("/order/:id_dh/details", getOrderDetails);

module.exports = router;
