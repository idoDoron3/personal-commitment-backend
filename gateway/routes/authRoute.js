const express = require('express');
const router = express.Router();
const authController = require('../controllers/gateway-controller');
const { authenticateToken } = require('../middleware/auth-middleware');

// public routes (no token required)
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
router.post('/register', (req, res) => authController.handleRequest(req, res, 'auth', '/register'));
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
router.post('/login', (req, res) => authController.handleRequest(req, res, 'auth', '/login'));
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
router.post('/refresh', (req, res) => authController.handleRequest(req, res, 'auth', '/refresh'));
// router.post('/forgot-password', (req, res) => authController.handleRequest(req, res, 'auth', '/forgot-password'));
// protected routes (require token)
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
router.post('/logout', (req, res) => authController.handleRequest(req, res, 'auth', '/logout'));
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
router.post('/reset-password', authenticateToken, (req, res) => authController.handleRequest(req, res, 'auth', '/reset-password'));


module.exports = router;
