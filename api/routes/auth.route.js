const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");

router.post("/register", authController.registerUser);
router.post("/login", authController.login);
router.post("/forgot-password", authController.forgotPassword);
router.post("/verify-otp", authController.verifyOtp); 
router.post("/verify-otp-forgot", authController.verifyOtpForgot); 
router.post("/reset-password", authController.resetPassword); 
module.exports = router;
