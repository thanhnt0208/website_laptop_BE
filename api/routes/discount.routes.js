const express = require('express');
const router = express.Router();
const discountController = require('../controllers/discount.controller');


router.post('/check-discount', discountController.checkDiscount);
router.get("/", discountController.getAllDiscounts);

// 🔹 Lưu mã cho user
router.post("/save", discountController.saveDiscountForUser);

// 🔹 Lấy danh sách voucher user đã lưu
router.get("/user/:id_kh", discountController.getUserDiscounts);

module.exports = router;