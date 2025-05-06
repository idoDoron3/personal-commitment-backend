const express = require("express");
const router = express.Router();
const gatewayController = require("../controllers/gateway-controller");
const { authenticateToken } = require("../middleware/auth-middleware");

/**
 * @swagger
 * tags:
 *   name: Reports
 *   description: Administrative reporting endpoints
 */


/**
 * @swagger
 * /average-mentor/{mentorId}:
 *   get:
 *     summary: Get mentor's average review scores
 *     tags: [Reports]
 *     parameters:
 *       - in: path
 *         name: mentorId
 *         required: true
 *         schema:
 *           type: string
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Mentor's average review scores
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 averageScore:
 *                   type: number
 *                   example: 4.25
 *                 clarity:
 *                   type: number
 *                   example: 4.5
 *                 understanding:
 *                   type: number
 *                   example: 4.0
 *                 focus:
 *                   type: number
 *                   example: 4.2
 *                 helpful:
 *                   type: number
 *                   example: 4.3
 *       401:
 *         description: Unauthorized - Token missing or invalid
 *       403:
 *         description: Forbidden - Admins only
 *       404:
 *         description: Mentor not found
 */
router.get("/average-mentor/:mentorId", authenticateToken, (req, res) =>
    gatewayController.handleRequest(req, res, "report", `/average-mentor/${req.params.mentorId}`)
);
/**
 * @swagger
 * /completed-mentoer-lessons/{mentorId}:
 *   get:
 *     summary: Get count of mentor's completed lessons
 *     tags: [Reports]
 *     parameters:
 *       - in: path
 *         name: mentorId
 *         required: true
 *         schema:
 *           type: string
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Number of completed lessons
 *         content:
 *           application/json:
 *             example:
 *               completedLessons: 18
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admins only
 *       404:
 *         description: Mentor not found
 */
router.get("/completed-mentoer-lessons/:mentorId", authenticateToken, (req, res) =>
    gatewayController.handleRequest(req, res, "report", `/completed-mentoer-lessons/${req.params.mentorId}`)
  );

/**
 * @swagger
 * /top-mentors-completed-lessons:
 *   get:
 *     summary: Top 10 mentors by completed lessons
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of top mentors
 *         content:
 *           application/json:
 *             example:
 *               - mentorId: "123abc"
 *                 mentorName: "David Cohen"
 *                 mentorEmail: "david@example.com"
 *                 lessonCount: 22
 *               - mentorId: "456def"
 *                 mentorName: "Sarah Levi"
 *                 mentorEmail: "sarah@example.com"
 *                 lessonCount: 20
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admins only
 */
router.get("/top-mentors-completed-lessons", authenticateToken, (req, res) =>
    gatewayController.handleRequest(req, res, "report", "/top-mentors-completed-lessons")
);
/**
 * @swagger
 * /average-lessons-per-mentor:
 *   get:
 *     summary: Get average number of lessons per mentor
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Average lessons per mentor
 *         content:
 *           application/json:
 *             example:
 *               averageLessonsPerMentor: 5.4
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admins only
 */

router.get("/average-lessons-per-mentor", authenticateToken, (req, res) =>
    gatewayController.handleRequest(req, res, "report", "/average-lessons-per-mentor")
);
/**
 * @swagger
 * /lessons-created-last-week:
 *   get:
 *     summary: Get number of lessons created in the last week
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Number of lessons created
 *         content:
 *           application/json:
 *             example:
 *               lessonsCreated: 12
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admins only
 */
router.get("/lessons-created-last-week", authenticateToken, (req, res) =>
    gatewayController.handleRequest(req, res, "report", "/lessons-created-last-week")
);
/**
 * @swagger
 * /mentor-overview/{mentorId}:
 *   get:
 *     summary: Get mentor's overview
 *     tags: [Reports]
 *     parameters:
 *       - in: path
 *         name: mentorId
 *         required: true
 *         schema:
 *           type: string
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Mentor overview
 *         content:
 *           application/json:
 *             example:
 *               mentorId: "123abc"
 *               fullName: "David Cohen"
 *               mentorEmail: "david@example.com"
 *               averageScore: 4.35
 *               totalCompletedLessons: 15
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admins only
 *       404:
 *         description: Mentor not found
 */

router.get("/mentor-overview/:mentorId", authenticateToken, (req, res) =>
    gatewayController.handleRequest(req, res, "report", `/mentor-overview/${req.params.mentorId}`)
);
/**
 * @swagger
 * /lesson-grade-distribution:
 *   get:
 *     summary: Get lesson grade distribution
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lesson grade distribution
 *         content:
 *           application/json:
 *             example:
 *               - subjectName: "Mathematics"
 *                 grade: "7"
 *                 count: 8
 *               - subjectName: "Science"
 *                 grade: "8"
 *                 count: 5
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admins only
 */

router.get("/lesson-grade-distribution", authenticateToken, (req, res) =>
    gatewayController.handleRequest(req, res, "report", "/lesson-grade-distribution")
);



module.exports = router;
