const express = require("express");
const router = express.Router();
const {
  getOrders,
  getOrdersByCustomer,
  nextStatus,
  userConfirm,
  deleteOrder,
  getOrderDetailsById,
  getAdminOrderDetail
} = require("../controllers/order.controller");

router.get("/", getOrders);
router.get("/customer/:id_kh", getOrdersByCustomer);
router.put("/:id/next", nextStatus);
router.put("/:id/confirm", userConfirm);
router.delete("/order/:id", deleteOrder);
router.get("/:id_dh/detail", getOrderDetailsById);
router.get('/:id_dh/admin-detail', getAdminOrderDetail);

module.exports = router;
