const express = require("express");
const router = express.Router();
const authController = require("../controllers/gateway-controller");
const { authenticateToken } = require("../middleware/auth-middleware");

/**
 * @swagger
 * /register:
 *   post:
 *     summary: Register a new user
 *     description: Registers a new user by providing their details.
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - first_name
 *               - last_name
 *               - email
 *               - password
 *             properties:
 *               first_name:
 *                 type: string
 *                 example: John
 *               last_name:
 *                 type: string
 *                 example: Doe
 *               email:
 *                 type: string
 *                 example: john.doe@example.com
 *               password:
 *                 type: string
 *                 example: Password123
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "User registered successfully"
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     first_name:
 *                       type: string
 *                       example: John
 *                     last_name:
 *                       type: string
 *                       example: Doe
 *                     email:
 *                       type: string
 *                       example: john.doe@example.com
 *       400:
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "An unexpected error occurred"
 *       403:
 *         description: Registration is not allowed for this email
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Registration is not allowed for this email"
 *       409:
 *         description: Email is already in use
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "This email is already in use"
 */
router.post("/register", (req, res) =>
  authController.handleRequest(req, res, "auth", "/register")
);
/**
 * @swagger
 * /login:
 *   post:
 *     summary: Log in an existing user
 *     description: Logs in a user by providing their email and password.
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: john.doe@example.com
 *               password:
 *                 type: string
 *                 example: Password123
 *     responses:
 *       200:
 *         description: Successfully logged in
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     first_name:
 *                       type: string
 *                       example: John
 *                     last_name:
 *                       type: string
 *                       example: Doe
 *                     email:
 *                       type: string
 *                       example: john.doe@example.com
 *       401:
 *         description: Invalid email or password
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Invalid email or password"
 */
router.post("/login", (req, res) =>
  authController.handleRequest(req, res, "auth", "/login")
);
/**
 * @swagger
 * /refresh:
 *   post:
 *     summary: Refresh access token
 *     description: Refreshes the user's access token using a valid refresh token sent in the body.
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: The refresh token used to generate a new access token.
 *                 example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *     responses:
 *       200:
 *         description: Access token refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                 refreshToken:
 *                   type: string
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       401:
 *         description: Refresh token not provided or invalid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Refresh token not provided"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Internal Server Error"
 */

router.post("/refresh", (req, res) =>
  authController.handleRequest(req, res, "auth", "/refresh")
);

/**
 * @swagger
 * /logout:
 *   post:
 *     summary: Log out a user
 *     description: Logs out the user by invalidating the refresh token in the database and clearing the refresh token cookie.
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_id
 *             properties:
 *               user_id:
 *                 type: integer
 *                 example: 4
 *     responses:
 *       200:
 *         description: Successfully logged out
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "User logged out successfully"
 *       400:
 *         description: Bad request - missing or invalid user ID
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "User ID is required"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Logout failed"
 */

router.post("/logout", (req, res) =>
  authController.handleRequest(req, res, "auth", "/logout")
);

/**
 * @swagger
 * /verify-reset-code:
 *   post:
 *     summary: Verify reset code
 *     description: Verifies the reset code and forwards the request to the Auth Service.
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - resetCode
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@example.com
 *               resetCode:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Reset code verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Reset code verified successfully"
 *                 tempToken:
 *                   type: string
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       400:
 *         description: Invalid or expired reset code
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Invalid or expired reset code"
 */

router.post("/verify-reset-code", (req, res) =>
  authController.handleRequest(req, res, "auth", "/verify-reset-code")
);
/**
 * @swagger
 * /update-password:
 *   patch:
 *     summary: Update user password
 *     description: Updates the user's password by forwarding the request to the Auth Service.
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tempToken
 *               - newPassword
 *               - confirmPassword
 *             properties:
 *               tempToken:
 *                 type: string
 *                 description: Temporary token issued during reset code verification.
 *                 example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *               newPassword:
 *                 type: string
 *                 example: "NewSecurePassword123"
 *               confirmPassword:
 *                 type: string
 *                 example: "NewSecurePassword123"
 *     responses:
 *       200:
 *         description: Password updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Password updated successfully"
 *       400:
 *         description: Bad Request - Missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "All fields are required"
 *       401:
 *         description: Unauthorized - Invalid or expired token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Invalid or expired token"
 *       404:
 *         description: Not Found - User does not exist
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "User not found"
 *       422:
 *         description: Unprocessable Entity - Passwords do not match
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Passwords do not match"
 *       500:
 *         description: Internal Server Error - Unexpected error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Something went wrong"
 */

router.patch("/update-password", (req, res) =>
  authController.handleRequest(req, res, "auth", "/update-password")
);

/**
 * @swagger
 * /forgot-password:
 *   post:
 *     summary: Forgot password
 *     description: Sends a reset code to the user's email for password recovery.
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 example: john.doe@example.com
 *     responses:
 *       200:
 *         description: Reset code sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Reset code sent to your email"
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "User not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Internal Server Error"
 */

router.post("/forgot-password", (req, res) =>
  authController.handleRequest(req, res, "auth", "/forgot-password")
);

/**
 * @swagger
 * /admin/add-subject:
 *   patch:
 *     summary: Add subject to mentor (admin only)
 *     description: Adds a subject to a mentor’s list of subjects if not already present.
 *       Requires a valid JWT token with `admin` role.
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - subject
 *             properties:
 *               email:
 *                 type: string
 *                 example: mentor@example.com
 *               subject:
 *                 type: string
 *                 example: היסטוריה
 *     responses:
 *       200:
 *         description: Subject added to mentor
 *       400:
 *         description: Mentor not found or invalid input
 *       401:
 *         description: Missing or invalid token
 *       403:
 *         description: Access denied - admin only
 */

router.patch("/admin/add-subject", authenticateToken, (req, res) =>
  authController.handleRequest(req, res, "auth", "/admin/add-subject")
);

/**
 * @swagger
 * /admin/remove-subject:
 *   patch:
 *     summary: Remove subject from mentor (admin only)
 *     description: Removes a subject from a mentor’s subject list if present.
 *       Requires a valid JWT token with `admin` role.
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - subject
 *             properties:
 *               email:
 *                 type: string
 *                 example: mentor@example.com
 *               subject:
 *                 type: string
 *                 example: היסטוריה
 *     responses:
 *       200:
 *         description: Subject removed from mentor
 *       400:
 *         description: Mentor not found or invalid input
 *       401:
 *         description: Missing or invalid token
 *       403:
 *         description: Access denied - admin only
 */
router.patch("/admin/remove-subject", authenticateToken, (req, res) =>
  authController.handleRequest(req, res, "auth", "/admin/remove-subject")
);

/**
 * @swagger
 * /admin/add-user:
 *   post:
 *     summary: Add a new optional user (admin only)
 *     description: Adds a user to the OptionalUsers collection so they can register later.
 *       Requires a valid JWT token with `admin` role.
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - first_name
 *               - last_name
 *               - email
 *               - role
 *             properties:
 *               first_name:
 *                 type: string
 *                 example: רות
 *               last_name:
 *                 type: string
 *                 example: כהן
 *               email:
 *                 type: string
 *                 example: ruth@example.com
 *               role:
 *                 type: string
 *                 enum: [mentor, trainee]
 *               subjects:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["אנגלית", "מתמטיקה"]
 *     responses:
 *       201:
 *         description: Optional user added successfully
 *       400:
 *         description: Email already exists or invalid input
 *       401:
 *         description: Missing or invalid token
 *       403:
 *         description: Access denied - admin only
 */

router.post("/admin/add-user", authenticateToken, (req, res) =>
  authController.handleRequest(req, res, "auth", "/admin/add-user")
);

/**
 * @swagger
 * /admin/delete-user:
 *   delete:
 *     summary: Delete user from both User and OptionalUser collections (admin only)
 *     description: Deletes user by email from both collections.
 *       Requires a valid JWT token with `admin` role.
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 example: ruth@example.com
 *     responses:
 *       200:
 *         description: User deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User deleted
 *                 deleted:
 *                   type: object
 *                   properties:
 *                     deletedFrom:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["User", "OptionalUser"]
 *                     email:
 *                       type: string
 *       400:
 *         description: User not found
 *       401:
 *         description: Missing or invalid token
 *       403:
 *         description: Access denied - admin only
 */
router.delete("/admin/delete-user", authenticateToken, (req, res) =>
  authController.handleRequest(req, res, "auth", "/admin/delete-user")
);

//TODO - add to swagger



module.exports = router;
