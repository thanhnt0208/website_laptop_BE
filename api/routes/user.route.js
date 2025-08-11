const express = require("express");
const router = express.Router();
const userController = require("../controllers/users.controller");

router.get("/", userController.getAllUsers);
router.get("/:id", userController.getUserById);
router.put("/:id/status", userController.updateUserStatus);
router.get("/:id/orders", userController.getOrdersByUser);
module.exports = router;
