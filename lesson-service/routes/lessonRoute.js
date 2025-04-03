const express = require("express");
const lessonController = require("../controllers/lesson-controller");

const router = express.Router();

//
// TUTOR ROUTES
//

// Create a new lesson
router.post("/create", lessonController.createLesson);

// Abort a lesson
router.patch("/abort", lessonController.abortLesson);

// Get all lessons by tutor
// ? check if need to change the get request because of the body used to send data instead of the URL
router.get("/tutor/:tutorId", lessonController.getLessonsByTutor);

//
// TUTEE ROUTES
//

// Enroll in a lesson
router.post("/enroll", lessonController.enrollToLesson);

// Withdraw from a lesson
router.delete("/withdraw", lessonController.withdrawFromLesson);

// Get all lessons a tutee is enrolled in
// ? check if need to change the get request because of the body used to send data instead of the URL
router.get("/tutee/:tuteeId", lessonController.getTuteeLessons);

// Get all available lessons (with optional query filter)
// ? check if need to change the get request because of the body used to send data instead of the URL
router.get("/available", lessonController.getAvailableLessons);

module.exports = router;
