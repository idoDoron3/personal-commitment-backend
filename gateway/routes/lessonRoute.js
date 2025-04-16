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
router.post("/create", authenticateToken, (req, res) =>
  gatewayController.handleRequest(req, res, "lesson", "/create")
);

/**
 * @swagger
 * /lessons/cancel:
 *   patch:
 *     summary: Cancel a lesson (Tutor only)
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
 *         description: Lesson canceled
 *       404:
 *         description: Lesson not found
 */
router.patch("/cancel", authenticateToken, (req, res) =>
  gatewayController.handleRequest(req, res, "lesson", "/cancel")
);


/**
 * @swagger
 * /lessons/approved-lessons-amount:
 *   get:
 *     summary: Get the amount of approved lessons (Tutor only)
 *     tags: [Lessons]
 *     responses:
 *       200:
 *         description: Amount of approved lessons
 */
router.get("/approved-lessons-amount", authenticateToken, (req, res) =>
  gatewayController.handleRequest(req, res, "lesson", "/approved-lessons-amount")
);


/**
 * @swagger
 * /lessons/tutor-upcoming-lessons:
 *   get:
 *     summary: Get all upcoming lessons of tutor
 *     tags: [Lessons]
 *     responses:
 *       200:
 *         description: List of upcoming lessons
 *       404:
 *         description: Tutor not found
 */
router.get("/tutor-upcoming-lessons", authenticateToken, (req, res) =>
  gatewayController.handleRequest(req, res, "lesson", "/tutor-upcoming-lessons")
);

/**
 * @swagger
 * /lessons/edit:
 *   patch:
 *     summary: Edit an existing lesson (Tutor only)
 *     tags: [Lessons]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - lessonId
 *             properties:
 *               lessonId:
 *                 type: integer
 *               description:
 *                 type: string
 *               format:
 *                 type: string
 *                 enum: [online, in-person]
 *               locationOrLink:
 *                 type: string
 *     responses:
 *       200:
 *         description: Lesson updated successfully
 *       400:
 *         description: Invalid input or unauthorized update
 *       404:
 *         description: Lesson not found
 */
router.patch("/edit", authenticateToken, (req, res) =>
  gatewayController.handleRequest(req, res, "lesson", "/edit")
);


/**
 * @swagger
 * /lessons/tutor-summary-pending-lessons:
 *   get:
 *     summary: Get all summary pending lessons of tutor
 *     tags: [Lessons]
 *     responses:
 *       200:
 *         description: List of summary pending lessons
 *       404:
 *         description: Tutor not found
 */
router.get("/tutor-summary-pending-lessons", authenticateToken, (req, res) =>
  gatewayController.handleRequest(req, res, "lesson", "/tutor-summary-pending-lessons")
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
router.post("/enroll", authenticateToken, (req, res) =>
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
router.delete("/withdraw", authenticateToken, (req, res) =>
  gatewayController.handleRequest(req, res, "lesson", "/withdraw")
);

/**
 * @swagger
 * /lessons/tutee-upcoming-lessons:
 *   get:
 *     summary: Get all upcoming lessons of tutee
 *     tags: [Lessons]
 *     responses:
 *       200:
 *         description: List of upcoming lessons
 *       404:
 *         description: Tutor not found
 */
router.get("/tutee-upcoming-lessons", authenticateToken, (req, res) =>
  gatewayController.handleRequest(req, res, "lesson", "/tutee-upcoming-lessons")
);

/**
 * @swagger
 * /lessons/tutee-review-pending-lessons:
 *   get:
 *     summary: Get all review pending lessons of tutee
 *     tags: [Lessons]
 *     responses:
 *       200:
 *         description: List of review pending lessons
 *       404:
 *         description: Tutor not found
 */
router.get("/tutee-review-pending-lessons", authenticateToken, (req, res) =>
  gatewayController.handleRequest(req, res, "lesson", "/tutee-review-pending-lessons")
);


// /**
//  * @swagger
//  * /lessons/upload-lesson-summary:
//  *   patch:
//  *     summary: Upload a lesson summary
//  *     tags: [Lessons]
//  *     responses:
//  *       200:
//  *         description: Lesson summary uploaded
//  *       404:
//  *         description: Lesson not found
// */

// router.patch("/upload-lesson-summary", authenticateToken, (req, res) =>
//   gatewayController.handleRequest(req, res, "lesson", "/upload-lesson-summary")
// );


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
router.post("/available", authenticateToken, (req, res) =>
  gatewayController.handleRequest(req, res, "lesson", "/available")
);

module.exports = router;
