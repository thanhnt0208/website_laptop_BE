const express = require('express');
const router = express.Router();
const dashboard = require('../controllers/dashboard.controller');

router.get('/monthly-orders-total', dashboard.getTotalOrdersThisMonth);
router.get('/three-month-orders-total', dashboard.getTotalOrdersLast3Months);
router.get('/monthly-revenue-total', dashboard.getTotalRevenueThisMonth);
router.get('/three-month-revenue-total', dashboard.getTotalRevenueLast3Months);
router.get('/revenue-by-day-this-month', dashboard.getRevenueByDayThisMonth);
router.get('/best-selling-products-month', dashboard.getBestSellingProductsThisMonth);
router.get('/best-selling-3-months', dashboard.getBestSellingProductsLast3Months);
module.exports = router;