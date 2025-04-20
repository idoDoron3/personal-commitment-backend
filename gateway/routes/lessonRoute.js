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
 *               - grade
 *               - level
 *               - description
 *               - appointedDateTime
 *               - format
 *             properties:
 *               subjectName:
 *                 type: string
 *                 example: "Mathematics"
 *                 description: The subject of the lesson
 *               grade:
 *                 type: string
 *                 example: "10th Grade"
 *                 description: The grade level
 *               level:
 *                 type: string
 *                 example: "Advanced"
 *                 description: The level of the lesson
 *               description:
 *                 type: string
 *                 example: "Introduction to Calculus: Limits and Derivatives"
 *                 description: Detailed description of the lesson
 *               appointedDateTime:
 *                 type: string
 *                 format: date-time
 *                 example: "2024-04-15T14:30:00Z"
 *                 description: The scheduled date and time of the lesson
 *               format:
 *                 type: string
 *                 enum: [online, in-person]
 *                 example: "online"
 *                 description: The format of the lesson
 *               locationOrLink:
 *                 type: string
 *                 example: "https://zoom.us/j/123456789"
 *                 description: Optional location for in-person lessons or link for online lessons
 *     responses:
 *       201:
 *         description: Lesson created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Lesson created successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     lesson:
 *                       type: object
 *                       properties:
 *                         lessonId:
 *                           type: integer
 *                           example: 123
 *                         subjectName:
 *                           type: string
 *                           example: "Mathematics"
 *                         grade:
 *                           type: string
 *                           example: "10th Grade"
 *                         level:
 *                           type: string
 *                           example: "Advanced"
 *                         description:
 *                           type: string
 *                           example: "Introduction to Calculus: Limits and Derivatives"
 *                         appointedDateTime:
 *                           type: string
 *                           format: date-time
 *                           example: "2024-04-15T14:30:00Z"
 *                         status:
 *                           type: string
 *                           example: "created"
 *                         tutorUserId:
 *                           type: string
 *                           example: "tutor123"
 *                         tutorFullName:
 *                           type: string
 *                           example: "John Smith"
 *                         format:
 *                           type: string
 *                           example: "online"
 *                         locationOrLink:
 *                           type: string
 *                           example: "https://zoom.us/j/123456789"
 *       400:
 *         description: Invalid input data or missing required fields
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *       403:
 *         description: Forbidden - User is not a tutor
 *       409:
 *         description: Conflict - Tutor has reached maximum open lessons or has overlapping lesson
 *       500:
 *         description: Internal server error
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
 *     security:
 *       - bearerAuth: []
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
 *                 example: 123
 *                 description: The ID of the lesson to cancel
 *     responses:
 *       200:
 *         description: Lesson canceled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Lesson canceled successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     lesson:
 *                       type: object
 *                       properties:
 *                         lessonId:
 *                           type: integer
 *                           example: 123
 *                         subjectName:
 *                           type: string
 *                           example: "Mathematics"
 *                         grade:
 *                           type: string
 *                           example: "10th Grade"
 *                         level:
 *                           type: string
 *                           example: "Advanced"
 *                         description:
 *                           type: string
 *                           example: "Introduction to Calculus: Limits and Derivatives"
 *                         appointedDateTime:
 *                           type: string
 *                           format: date-time
 *                           example: "2024-04-15T14:30:00Z"
 *                         status:
 *                           type: string
 *                           example: "canceled"
 *                         tutorUserId:
 *                           type: string
 *                           example: "tutor123"
 *                         tutorFullName:
 *                           type: string
 *                           example: "John Smith"
 *                         format:
 *                           type: string
 *                           example: "online"
 *                         locationOrLink:
 *                           type: string
 *                           example: "https://zoom.us/j/123456789"
 *       400:
 *         description: Invalid input data or lesson cannot be canceled in its current status
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *       403:
 *         description: Forbidden - User is not the tutor of this lesson
 *       404:
 *         description: Lesson not found
 *       409:
 *         description: Cannot cancel a lesson whose appointed time has passed
 *       500:
 *         description: Internal server error
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
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Amount of approved lessons retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Amount of approved lessons retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     amountOfApprovedLessons:
 *                       type: integer
 *                       example: 5
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *       403:
 *         description: Forbidden - User is not a tutor
 *       500:
 *         description: Internal server error
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
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Tutor upcoming lessons retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Tutor upcoming lessons retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     lessonsWithEnrolledTutees:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           lessonId:
 *                             type: integer
 *                             example: 123
 *                           subjectName:
 *                             type: string
 *                             example: "Mathematics"
 *                           grade:
 *                             type: string
 *                             example: "10th Grade"
 *                           level:
 *                             type: string
 *                             example: "Advanced"
 *                           description:
 *                             type: string
 *                             example: "Introduction to Calculus: Limits and Derivatives"
 *                           appointedDateTime:
 *                             type: string
 *                             format: date-time
 *                             example: "2024-04-15T14:30:00Z"
 *                           status:
 *                             type: string
 *                             example: "created"
 *                           tutorUserId:
 *                             type: string
 *                             example: "tutor123"
 *                           tutorFullName:
 *                             type: string
 *                             example: "John Smith"
 *                           format:
 *                             type: string
 *                             example: "online"
 *                           locationOrLink:
 *                             type: string
 *                             example: "https://zoom.us/j/123456789"
 *                           enrolledTutees:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 tuteeUserId:
 *                                   type: string
 *                                   example: "tutee123"
 *                                 tuteeFullName:
 *                                   type: string
 *                                   example: "Jane Doe"
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *       403:
 *         description: Forbidden - User is not a tutor
 *       500:
 *         description: Internal server error
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
 *     security:
 *       - bearerAuth: []
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
 *                 example: 123
 *                 description: The ID of the lesson to edit
 *               description:
 *                 type: string
 *                 example: "Updated lesson description"
 *                 description: New description for the lesson
 *               format:
 *                 type: string
 *                 enum: [online, in-person]
 *                 example: "online"
 *                 description: New format for the lesson
 *               locationOrLink:
 *                 type: string
 *                 example: "https://zoom.us/j/987654321"
 *                 description: New location for in-person lessons or link for online lessons
 *     responses:
 *       200:
 *         description: Lesson updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Lesson updated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     lesson:
 *                       type: object
 *                       properties:
 *                         lessonId:
 *                           type: integer
 *                           example: 123
 *                         subjectName:
 *                           type: string
 *                           example: "Mathematics"
 *                         grade:
 *                           type: string
 *                           example: "10th Grade"
 *                         level:
 *                           type: string
 *                           example: "Advanced"
 *                         description:
 *                           type: string
 *                           example: "Updated lesson description"
 *                         appointedDateTime:
 *                           type: string
 *                           format: date-time
 *                           example: "2024-04-15T14:30:00Z"
 *                         status:
 *                           type: string
 *                           example: "created"
 *                         tutorUserId:
 *                           type: string
 *                           example: "tutor123"
 *                         tutorFullName:
 *                           type: string
 *                           example: "John Smith"
 *                         format:
 *                           type: string
 *                           example: "online"
 *                         locationOrLink:
 *                           type: string
 *                           example: "https://zoom.us/j/987654321"
 *       400:
 *         description: Invalid input data or unauthorized update
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *       403:
 *         description: Forbidden - User is not the tutor of this lesson
 *       404:
 *         description: Lesson not found
 *       500:
 *         description: Internal server error
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
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Tutor summary pending lessons retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Tutor summary pending lessons retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     lessonsWithEnrolledTutees:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           lessonId:
 *                             type: integer
 *                             example: 123
 *                           subjectName:
 *                             type: string
 *                             example: "Mathematics"
 *                           grade:
 *                             type: string
 *                             example: "10th Grade"
 *                           level:
 *                             type: string
 *                             example: "Advanced"
 *                           description:
 *                             type: string
 *                             example: "Introduction to Calculus: Limits and Derivatives"
 *                           appointedDateTime:
 *                             type: string
 *                             format: date-time
 *                             example: "2024-04-15T14:30:00Z"
 *                           status:
 *                             type: string
 *                             example: "completed"
 *                           tutorUserId:
 *                             type: string
 *                             example: "tutor123"
 *                           tutorFullName:
 *                             type: string
 *                             example: "John Smith"
 *                           format:
 *                             type: string
 *                             example: "online"
 *                           locationOrLink:
 *                             type: string
 *                             example: "https://zoom.us/j/123456789"
 *                           enrolledTutees:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 tuteeUserId:
 *                                   type: string
 *                                   example: "tutee123"
 *                                 tuteeFullName:
 *                                   type: string
 *                                   example: "Jane Doe"
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *       403:
 *         description: Forbidden - User is not a tutor
 *       500:
 *         description: Internal server error
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
 *     security:
 *       - bearerAuth: []
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
 *                 example: 123
 *                 description: The ID of the lesson to enroll in
 *     responses:
 *       200:
 *         description: Enrolled in lesson successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Enrolled in lesson successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     enrollment:
 *                       type: object
 *                       properties:
 *                         lessonId:
 *                           type: integer
 *                           example: 123
 *                         tuteeUserId:
 *                           type: string
 *                           example: "tutee123"
 *                         tuteeFullName:
 *                           type: string
 *                           example: "Jane Doe"
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *       403:
 *         description: Forbidden - User is not a tutee
 *       404:
 *         description: Lesson not found
 *       409:
 *         description: Already enrolled or lesson is full
 *       500:
 *         description: Internal server error
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
 *     security:
 *       - bearerAuth: []
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
 *                 example: 123
 *                 description: The ID of the lesson to withdraw from
 *     responses:
 *       200:
 *         description: Withdrawn from lesson successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Withdrawn from lesson successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     lesson:
 *                       type: object
 *                       properties:
 *                         lessonId:
 *                           type: integer
 *                           example: 123
 *                         subjectName:
 *                           type: string
 *                           example: "Mathematics"
 *                         grade:
 *                           type: string
 *                           example: "10th Grade"
 *                         level:
 *                           type: string
 *                           example: "Advanced"
 *                         description:
 *                           type: string
 *                           example: "Introduction to Calculus: Limits and Derivatives"
 *                         appointedDateTime:
 *                           type: string
 *                           format: date-time
 *                           example: "2024-04-15T14:30:00Z"
 *                         status:
 *                           type: string
 *                           example: "created"
 *                         tutorUserId:
 *                           type: string
 *                           example: "tutor123"
 *                         tutorFullName:
 *                           type: string
 *                           example: "John Smith"
 *                         format:
 *                           type: string
 *                           example: "online"
 *                         locationOrLink:
 *                           type: string
 *                           example: "https://zoom.us/j/123456789"
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *       403:
 *         description: Forbidden - User is not enrolled in this lesson
 *       404:
 *         description: Lesson not found
 *       500:
 *         description: Internal server error
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
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Tutee upcoming lessons retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Tutee upcoming lessons retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     lessonsWithEnrolledTutees:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           lessonId:
 *                             type: integer
 *                             example: 123
 *                           subjectName:
 *                             type: string
 *                             example: "Mathematics"
 *                           grade:
 *                             type: string
 *                             example: "10th Grade"
 *                           level:
 *                             type: string
 *                             example: "Advanced"
 *                           description:
 *                             type: string
 *                             example: "Introduction to Calculus: Limits and Derivatives"
 *                           appointedDateTime:
 *                             type: string
 *                             format: date-time
 *                             example: "2024-04-15T14:30:00Z"
 *                           status:
 *                             type: string
 *                             example: "created"
 *                           tutorUserId:
 *                             type: string
 *                             example: "tutor123"
 *                           tutorFullName:
 *                             type: string
 *                             example: "John Smith"
 *                           format:
 *                             type: string
 *                             example: "online"
 *                           locationOrLink:
 *                             type: string
 *                             example: "https://zoom.us/j/123456789"
 *                           enrolledTutees:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 tuteeUserId:
 *                                   type: string
 *                                   example: "tutee123"
 *                                 tuteeFullName:
 *                                   type: string
 *                                   example: "Jane Doe"
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *       403:
 *         description: Forbidden - User is not a tutee
 *       500:
 *         description: Internal server error
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
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Tutee review pending lessons retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Tutee review pending lessons retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     lessonsWithEnrolledTutees:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           lessonId:
 *                             type: integer
 *                             example: 123
 *                           subjectName:
 *                             type: string
 *                             example: "Mathematics"
 *                           grade:
 *                             type: string
 *                             example: "10th Grade"
 *                           level:
 *                             type: string
 *                             example: "Advanced"
 *                           description:
 *                             type: string
 *                             example: "Introduction to Calculus: Limits and Derivatives"
 *                           appointedDateTime:
 *                             type: string
 *                             format: date-time
 *                             example: "2024-04-15T14:30:00Z"
 *                           status:
 *                             type: string
 *                             example: "completed"
 *                           tutorUserId:
 *                             type: string
 *                             example: "tutor123"
 *                           tutorFullName:
 *                             type: string
 *                             example: "John Smith"
 *                           format:
 *                             type: string
 *                             example: "online"
 *                           locationOrLink:
 *                             type: string
 *                             example: "https://zoom.us/j/123456789"
 *                           enrolledTutees:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 tuteeUserId:
 *                                   type: string
 *                                   example: "tutee123"
 *                                 tuteeFullName:
 *                                   type: string
 *                                   example: "Jane Doe"
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *       403:
 *         description: Forbidden - User is not a tutee
 *       500:
 *         description: Internal server error
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
 *   post:
 *     summary: Get all available lessons (with optional filters)
 *     tags: [Lessons]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               subjects:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["Mathematics", "Physics"]
 *                 description: Optional list of subjects to filter by
 *     responses:
 *       200:
 *         description: Available lessons retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Available lessons retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     lessons:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           lessonId:
 *                             type: integer
 *                             example: 123
 *                           subjectName:
 *                             type: string
 *                             example: "Mathematics"
 *                           grade:
 *                             type: string
 *                             example: "10th Grade"
 *                           level:
 *                             type: string
 *                             example: "Advanced"
 *                           description:
 *                             type: string
 *                             example: "Introduction to Calculus: Limits and Derivatives"
 *                           appointedDateTime:
 *                             type: string
 *                             format: date-time
 *                             example: "2024-04-15T14:30:00Z"
 *                           status:
 *                             type: string
 *                             example: "created"
 *                           tutorUserId:
 *                             type: string
 *                             example: "tutor123"
 *                           tutorFullName:
 *                             type: string
 *                             example: "John Smith"
 *                           format:
 *                             type: string
 *                             example: "online"
 *                           locationOrLink:
 *                             type: string
 *                             example: "https://zoom.us/j/123456789"
 *                           enrolledTutees:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 tuteeUserId:
 *                                   type: string
 *                                   example: "tutee123"
 *                                 tuteeFullName:
 *                                   type: string
 *                                   example: "Jane Doe"
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *       500:
 *         description: Internal server error
 */
router.post("/available", authenticateToken, (req, res) =>
  gatewayController.handleRequest(req, res, "lesson", "/available")
);

module.exports = router;
