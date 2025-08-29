const express = require('express');
const router = express.Router();
const discountadminController = require('../controllers/discountadmin.controller');


router.post('/check-discount', discountadminController.checkDiscount);
router.get("/", discountadminController.getAllDiscounts);
router.post("/", discountadminController.createDiscount);
router.delete("/:id", discountadminController.deleteDiscount);
router.put("/:id", discountadminController.updateDiscount);
router.put("/:id/visibility", discountadminController.toggleDiscountVisibility);

module.exports = router;