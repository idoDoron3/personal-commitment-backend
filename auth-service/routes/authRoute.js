const express = require("express");
const authController = require("../controllers/auth-controller");
const router = express.Router();

router.post("/register", authController.register);

router.post("/login", authController.login);

router.post("/logout", authController.logout);

router.patch("/reset-password", authController.resetPassword);

router.post("/forgot-password", authController.forgotPassword);

router.post("/refresh", authController.refreshToken);

module.exports = router;
