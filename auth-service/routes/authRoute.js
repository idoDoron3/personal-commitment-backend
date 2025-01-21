const express = require("express");
const authController = require("../controllers/auth-controller");
const router = express.Router();

router.post("/register", authController.register);

router.post("/login", authController.login);

router.post("/logout", authController.logout);

router.post("/verify-reset-code", authController.verifyResetCode);

router.patch("/update-password", authController.updatePassword);

router.post("/forgot-password", authController.forgotPassword);

router.post("/refresh", authController.refreshToken);

module.exports = router;
