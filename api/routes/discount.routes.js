const express = require('express');
const router = express.Router();
const discountController = require('../controllers/discount.controller');


router.post('/check-discount', discountController.checkDiscount);
router.get("/", discountController.getAllDiscounts);

module.exports = router;