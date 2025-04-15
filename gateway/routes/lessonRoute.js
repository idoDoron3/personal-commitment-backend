const express = require("express");
const router = express.Router();
const gatewayController = require("../controllers/gateway-controller");
const { authenticateToken } = require("../middleware/auth-middleware");

/**
 * @swagger
 * tags:
 *   name: Lessons
 *   description: Lesson service routes for tutors and tutees
 */

/**
 * @swagger
 * /lessons/create:
 *   post:
 *     summary: Create a new lesson (Tutor only)
 *     tags: [Lessons]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - subjectName
 *               - level
 *               - tutorId
 *               - dateTime
 *             properties:
 *               subjectName:
 *                 type: string
 *               level:
 *                 type: string
 *               tutorId:
 *                 type: integer
 *               dateTime:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Lesson created
 *       400:
 *         description: Missing fields
 *       404:
 *         description: Tutor not found
 */
router.post("/create",authenticateToken, (req, res) =>
  
  gatewayController.handleRequest(req, res, "lesson", "/create")
);

/**
 * @swagger
 * /lessons/abort:
 *   patch:
 *     summary: Abort a lesson (Tutor only)
 *     tags: [Lessons]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - lessonId
 *               - tutorId
 *             properties:
 *               lessonId:
 *                 type: integer
 *               tutorId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Lesson aborted
 *       404:
 *         description: Lesson not found
 */
router.patch("/abort", (req, res) =>
  gatewayController.handleRequest(req, res, "lesson", "/abort")
);

/**
 * @swagger
 * /lessons/tutor/{tutorId}:
 *   get:
 *     summary: Get all lessons by a tutor
 *     tags: [Lessons]
 *     parameters:
 *       - in: path
 *         name: tutorId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of lessons
 *       404:
 *         description: Tutor not found
 */
router.get("/tutor/:tutorId", (req, res) =>
  gatewayController.handleRequest(req, res, "lesson", `/tutor/${req.params.tutorId}`)
);

/**
 * @swagger
 * /lessons/enroll:
 *   post:
 *     summary: Enroll a tutee into a lesson
 *     tags: [Lessons]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - lessonId
 *               - tuteeId
 *             properties:
 *               lessonId:
 *                 type: integer
 *               tuteeId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Enrolled successfully
 *       404:
 *         description: Lesson or tutee not found
 *       409:
 *         description: Already enrolled
 *       403:
 *         description: Lesson full
 */
router.post("/enroll", (req, res) =>
  gatewayController.handleRequest(req, res, "lesson", "/enroll")
);

/**
 * @swagger
 * /lessons/withdraw:
 *   delete:
 *     summary: Withdraw a tutee from a lesson
 *     tags: [Lessons]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - lessonId
 *               - tuteeId
 *             properties:
 *               lessonId:
 *                 type: integer
 *               tuteeId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Tutee withdrawn
 *       404:
 *         description: Not enrolled or lesson not found
 */
router.delete("/withdraw", (req, res) =>
  gatewayController.handleRequest(req, res, "lesson", "/withdraw")
);

/**
 * @swagger
 * /lessons/tutee/{tuteeId}:
 *   get:
 *     summary: Get all lessons a tutee is enrolled in
 *     tags: [Lessons]
 *     parameters:
 *       - in: path
 *         name: tuteeId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of enrolled lessons
 *       404:
 *         description: Tutee not found
 */
router.get("/tutee/:tuteeId", (req, res) =>
  gatewayController.handleRequest(req, res, "lesson", `/tutee/${req.params.tuteeId}`)
);

/**
 * @swagger
 * /lessons/available:
 *   get:
 *     summary: Get all available lessons (with optional filters)
 *     tags: [Lessons]
 *     parameters:
 *       - in: query
 *         name: subjects
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *         explode: true
 *         style: form
 *         required: false
 *         description: List of subjects to filter by (e.g., ?subjects=Math&subjects=History)
 *     responses:
 *       200:
 *         description: List of available lessons
 */
router.get("/available", (req, res) =>
  gatewayController.handleRequest(req, res, "lesson", "/available")
);

module.exports = router;
