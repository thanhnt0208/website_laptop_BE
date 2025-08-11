const express = require('express');
const router = express.Router();
const checkoutController = require('../controllers/checkout.controller');

router.post('/address', checkoutController.createAddress);
router.post('/checkout', checkoutController.createOrder);
router.get('/address/used/:id_kh', checkoutController.getUsedAddresses);

module.exports = router;
