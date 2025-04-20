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
 *           examples:
 *             minimal:
 *               summary: Only updating format
 *               value:
 *                 lessonId: 12
 *                 format: in-person
 *             fullUpdate:
 *               summary: Updating all optional fields
 *               value:
 *                 lessonId: 12
 *                 description: "New lesson description"
 *                 format: online
 *                 locationOrLink: "https://zoom.us/lesson-link"
 *     responses:
 *       200:
 *         description: Lesson updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 lessonId:
 *                   type: integer
 *                 subjectName:
 *                   type: string
 *                 grade:
 *                   type: string
 *                 level:
 *                   type: string
 *                 description:
 *                   type: string
 *                 tutorUserId:
 *                   type: string
 *                 tutorFullName:
 *                   type: string
 *                 appointedDateTime:
 *                   type: string
 *                   format: date-time
 *                 format:
 *                   type: string
 *                   enum: [online, in-person]
 *                 locationOrLink:
 *                   type: string
 *                 status:
 *                   type: string
 *                   enum: [created, completed, approved, notapproved, canceled, unattended]
 *                 summary:
 *                   type: string
 *                   nullable: true
 *       400:
 *         description: Invalid status for update
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Cannot edit lesson in current status: completed"
 *                 code:
 *                   type: string
 *                   example: INVALID_STATUS
 *       403:
 *         description: Tutor is not authorized to edit this lesson
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Unauthorized: You are not the tutor of this lesson"
 *                 code:
 *                   type: string
 *                   example: UNAUTHORIZED
 *       404:
 *         description: Lesson not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Lesson not found"
 *                 code:
 *                   type: string
 *                   example: NOT_FOUND
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Failed to edit lesson"
 *                 code:
 *                   type: string
 *                   example: EDIT_LESSON_ERROR
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
 *     responses:
 *       200:
 *         description: Tutee enrolled successfully, returns updated lesson
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 lessonId:
 *                   type: integer
 *                 subjectName:
 *                   type: string
 *                 grade:
 *                   type: string
 *                 level:
 *                   type: string
 *                 description:
 *                   type: string
 *                 tutorUserId:
 *                   type: string
 *                 tutorFullName:
 *                   type: string
 *                 appointedDateTime:
 *                   type: string
 *                   format: date-time
 *                 format:
 *                   type: string
 *                   enum: [online, in-person]
 *                 locationOrLink:
 *                   type: string
 *                 status:
 *                   type: string
 *                   enum: [created, completed, approved, notapproved, canceled, unattended]
 *                 summary:
 *                   type: string
 *                   nullable: true
 *                 attendanceRecords:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       tuteeUserId:
 *                         type: string
 *                       tuteeFullName:
 *                         type: string
 *                       presence:
 *                         type: boolean
 *       400:
 *         description: Enrollment validation errors
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 code:
 *                   type: string
 *             examples:
 *               alreadySignedUp:
 *                 summary: Tutee already enrolled
 *                 value:
 *                   message: "Tutee is already signed up for lesson 5"
 *                   code: ALREADY_SIGNED_UP
 *               pastLesson:
 *                 summary: Lesson is in the past
 *                 value:
 *                   message: "Cannot sign up for past lesson 5"
 *                   code: PAST_LESSON
 *               invalidStatus:
 *                 summary: Lesson is not in 'created' status
 *                 value:
 *                   message: "Lesson 5 is in an invalid status: completed"
 *                   code: INVALID_LESSON_STATUS
 *       404:
 *         description: Lesson not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 code:
 *                   type: string
 *             example:
 *               message: "Lesson 5 not found"
 *               code: LESSON_NOT_FOUND
 *       409:
 *         description: Enrollment conflict
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 code:
 *                   type: string
 *             examples:
 *               lessonFull:
 *                 summary: Lesson is full
 *                 value:
 *                   message: "Lesson 5 is full (max 2)"
 *                   code: LESSON_FULL
 *               tuteeLimitReached:
 *                 summary: Tutee has too many future lessons
 *                 value:
 *                   message: "Tutee 12 has reached the max of 2 future lessons"
 *                   code: TUTEE_LIMIT_REACHED
 *               signupConflict:
 *                 summary: Lost race condition
 *                 value:
 *                   message: "Could not enroll right now. Please try again."
 *                   code: SIGNUP_CONFLICT
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 code:
 *                   type: string
 *             example:
 *               message: "Unexpected error occurred"
 *               code: INTERNAL_ERROR
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
 *     responses:
 *       200:
 *         description: Tutee withdrawn successfully, returns updated lesson
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 lessonId:
 *                   type: integer
 *                 subjectName:
 *                   type: string
 *                 grade:
 *                   type: string
 *                 level:
 *                   type: string
 *                 description:
 *                   type: string
 *                 tutorUserId:
 *                   type: string
 *                 tutorFullName:
 *                   type: string
 *                 appointedDateTime:
 *                   type: string
 *                   format: date-time
 *                 format:
 *                   type: string
 *                   enum: [online, in-person]
 *                 locationOrLink:
 *                   type: string
 *                 status:
 *                   type: string
 *                   enum: [created, completed, approved, notapproved, canceled, unattended]
 *                 summary:
 *                   type: string
 *                   nullable: true
 *       400:
 *         description: Cannot withdraw from this lesson
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Cannot cancel lesson 5 in status completed"
 *                 code:
 *                   type: string
 *                   example: TOO_LATE_TO_CANCEL
 *       404:
 *         description: Lesson or enrollment not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               oneOf:
 *                 - properties:
 *                     message:
 *                       type: string
 *                       example: "Lesson 5 not found"
 *                     code:
 *                       type: string
 *                       example: LESSON_NOT_FOUND
 *                 - properties:
 *                     message:
 *                       type: string
 *                       example: "Tutee 7 is not enrolled in lesson 5"
 *                     code:
 *                       type: string
 *                       example: NOT_ENROLLED
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Failed to withdraw tutee from lesson"
 *                 code:
 *                   type: string
 *                   example: WITHDRAW_ERROR
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


/**
 * @swagger
 * /lessons/upload-lesson-summary:
 *   patch:
 *     summary: Upload a lesson summary
 *     tags: [Lessons]
 *     responses:
 *       200:
 *         description: Lesson summary uploaded
 *       404:
 *         description: Lesson not found
*/

router.patch("/upload-lesson-report", authenticateToken, (req, res) =>
  gatewayController.handleRequest(req, res, "lesson", "/upload-lesson-report")
);


/**
 * @swagger
 * /lessons/available:
 *   post:
 *     summary: Get all available lessons (with optional subject filtering)
 *     tags: [Lessons]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               subjects:
 *                 type: array
 *                 description: Optional list of subjects to filter by
 *                 example: ["math", "english"]
 *                 items:
 *                   type: string
 *                   enum: ["math", "english"]
 *     responses:
 *       200:
 *         description: List of available lessons with enrolled tutees
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   lessonId:
 *                     type: integer
 *                   subjectName:
 *                     type: string
 *                   grade:
 *                     type: string
 *                   level:
 *                     type: string
 *                   description:
 *                     type: string
 *                   tutorUserId:
 *                     type: string
 *                   tutorFullName:
 *                     type: string
 *                   appointedDateTime:
 *                     type: string
 *                     format: date-time
 *                   format:
 *                     type: string
 *                     enum: [online, in-person]
 *                   locationOrLink:
 *                     type: string
 *                   status:
 *                     type: string
 *                     enum: [created, completed, approved, notapproved, canceled, unattended]
 *                   summary:
 *                     type: string
 *                     nullable: true
 *                   attendanceRecords:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         tutee_user_id:
 *                           type: string
 *                         tutee_full_name:
 *                           type: string
 *       400:
 *         description: Invalid subjects format
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Invalid subjects: must be an array of strings"
 *                 code:
 *                   type: string
 *                   example: INVALID_SUBJECTS
 *                 type:
 *                   type: string
 *                   example: appError
 *                 source:
 *                   type: string
 *                   example: lesson-service:getAvailableLessons
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Failed to get available lessons"
 *                 type:
 *                   type: string
 *                   example: SERVICE_ERROR
 */


router.post("/available", authenticateToken, (req, res) =>
  gatewayController.handleRequest(req, res, "lesson", "/available")

);

module.exports = router;
