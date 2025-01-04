const express = require('express');
const router = express.Router();
const authController = require('../controllers/gateway-controller');
const { authenticateToken } = require('../middleware/auth-middleware');

// public routes (no token required)
router.post('/register', (req, res) => authController.handleRequest(req, res, 'auth', '/register'));
router.post('/login', (req, res) => authController.handleRequest(req, res, 'auth', '/login'));
router.post('/refresh', (req, res) => authController.handleRequest(req, res, 'auth', '/refresh'));
// router.post('/forgot-password', (req, res) => authController.handleRequest(req, res, 'auth', '/forgot-password'));
// protected routes (require token)
router.post('/logout', (req, res) => authController.handleRequest(req, res, 'auth', '/logout'));
router.post('/reset-password', authenticateToken, (req, res) => authController.handleRequest(req, res, 'auth', '/reset-password'));


module.exports = router;
