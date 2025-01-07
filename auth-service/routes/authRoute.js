const express = require("express");
const authController = require("../controllers/auth-controller");
const router = express.Router();
/**
 * @swagger
 * /register:
 *   post:
 *     summary: Register a new user
 *     description: Registers a new user by providing first name, last name, email, and password.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               first_name:
 *                 type: string
 *               last_name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Invalid input
 */
router.post("/register", authController.register);
/**
 * @swagger
 * /login:
 *   post:
 *     summary: Log in an existing user
 *     description: Logs in an existing user by providing email and password.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successfully logged in
 *       401:
 *         description: Invalid email or password
 */
router.post("/login", authController.login);
/**
 * @swagger
 * /logout:
 *   post:
 *     summary: Log out a user
 *     description: Logs out the user by invalidating the refresh token.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successfully logged out
 *       500:
 *         description: Error during logout
 */
router.post("/logout", authController.logout);
/**
 * @swagger
 * /reset-password:
 *   post:
 *     summary: Reset user password
 *     description: Allows the user to reset their password using a valid token.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       400:
 *         description: Invalid token or password
 */
router.post('/reset-password', authController.resetPassword);
/**
 * @swagger
 * /refresh:
 *   post:
 *     summary: Refresh access token
 *     description: Refreshes the access token using the provided refresh token.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Access token refreshed successfully
 *       403:
 *         description: Invalid or expired refresh token
 */
router.post('/refresh', authController.refreshToken);

//router.post("/forgotPassword", authController.forgotPassword);
// router.patch("/resetPassword/:token", authController.resetPassword);
// router.patch(
//   "/updateMyPassword",
//   authController.protect,
//   authController.updatePassword
// );

// router.patch('/updateMe', authController.protect, userController.updateMe);
// router.delete('/deleteMe', authController.protect, userController.deleteMe);

module.exports = router;
