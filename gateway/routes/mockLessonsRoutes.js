const express = require("express");
const router = express.Router();
const mockLessonsController = require("../controllers/mockLessons-controller");

// Student
router.get("/student/my-lessons", mockLessonsController.getStudentLessons);
router.get("/student/next", mockLessonsController.getNextStudentLesson);
router.get("/student/last", mockLessonsController.getLastStudentLesson);
router.post("/student/register/:lessonId", mockLessonsController.registerToLesson);
router.post("/student/unregister/:lessonId", mockLessonsController.unregisterFromLesson);
router.post("/lessons/:lessonId/student-review", mockLessonsController.submitStudentReview);
// Mentor
router.post("/create", mockLessonsController.createLesson);
router.put("/update/:id", mockLessonsController.updateLesson); 
router.delete("/delete/:id", mockLessonsController.deleteLesson); 
router.get("/mentor/lesson-count", mockLessonsController.getLessonCount);
router.get("/mentor/next", mockLessonsController.getNextMentorLesson);
router.get("/mentor/upcoming", mockLessonsController.getUpcomingLessons);
router.get("/mentor/my-lessons", mockLessonsController.getMentorLessons);
router.post("/mentor/review/:lessonId", mockLessonsController.submitMentorReview);

// Admin
router.get("/admin/all", mockLessonsController.getAllLessons);
router.post("/admin/approve/:lessonId", mockLessonsController.approveLesson);
router.post("/admin/reject/:lessonId", mockLessonsController.rejectLesson);
router.get("/admin/pending-reviews", mockLessonsController.getPendingReviews);
// General
router.post("/search", mockLessonsController.searchLessons);
router.get("/:id", mockLessonsController.getLessonById);

module.exports = router;
