const express = require("express");
const router = express.Router();
const mockLessonsController = require("../controllers/mockLessons-controller");

// Student
router.get("/student/my-lessons", mockLessonsController.getStudentLessons);
router.get("/student/next", mockLessonsController.getNextStudentLesson);
router.get("/student/last", mockLessonsController.getLastStudentLesson);
router.post("/student/register/:lessonId", mockLessonsController.registerToLesson);
router.post("/student/unregister/:lessonId", mockLessonsController.unregisterFromLesson);

// Mentor
router.post("/create", mockLessonsController.createLesson);
router.get("/mentor/lesson-count", mockLessonsController.getLessonCount);
router.get("/mentor/next", mockLessonsController.getNextMentorLesson);
router.get("/mentor/upcoming", mockLessonsController.getUpcomingLessons);
router.get("/mentor/my-lessons", mockLessonsController.getMentorLessons);

// Admin
router.get("/admin/all", mockLessonsController.getAllLessons);
router.post("/admin/approve/:lessonId", mockLessonsController.approveLesson);
router.post("/admin/reject/:lessonId", mockLessonsController.rejectLesson);

// General
router.post("/search", mockLessonsController.searchLessons);
router.get("/:id", mockLessonsController.getLessonById);

module.exports = router;
