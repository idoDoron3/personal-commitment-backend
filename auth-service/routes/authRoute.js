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
 *   patch:
 *     summary: Reset the user's password
 *     description: Resets the user's password after verifying the OTP.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@example.com
 *               resetCode:
 *                 type: string
 *                 example: "123456"
 *               newPassword:
 *                 type: string
 *                 example: "NewSecurePassword123"
 *               confirmPassword:
 *                 type: string
 *                 example: "NewSecurePassword123"
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       400:
 *         description: Invalid or expired reset code
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */

router.patch("/reset-password", authController.resetPassword);
/**
 * @swagger
 * /forgot-password:
 *   post:
 *     summary: Send a password reset code
 *     description: Sends a one-time password (OTP) to the user's email for password reset.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@example.com
 *     responses:
 *       200:
 *         description: Reset code sent successfully
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.post("/forgot-password", authController.forgotPassword);

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
router.post("/refresh", authController.refreshToken);

module.exports = router;
