const express = require("express");
const router = express.Router();
const {
  getOrders,
  getOrdersByCustomer,
  nextStatus,
  userConfirm,
  deleteOrder,
  getOrderDetailsById,
  getAdminOrderDetail,
  cancelOrder,
  returnOrder,
  completeOrder  
} = require("../controllers/order.controller");

const upload = require("../middleware/upload");

router.get("/", getOrders);
router.get("/customer/:id_kh", getOrdersByCustomer);
router.put("/:id/next", nextStatus);
router.put("/:id/confirm", userConfirm);
router.delete("/order/:id", deleteOrder);
router.get("/:id_dh/detail", getOrderDetailsById);
router.get("/:id_dh/admin-detail", getAdminOrderDetail);
router.put("/:id/cancel", cancelOrder);
router.put("/:id/complete", completeOrder);

router.put(
  "/:id/return",
  upload.fields([
    { name: "images", maxCount: 5 },
    { name: "videos", maxCount: 2 },
  ]),
  returnOrder
);

module.exports = router;
