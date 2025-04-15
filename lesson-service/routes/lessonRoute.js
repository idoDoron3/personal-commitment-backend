const express = require("express");
const lessonController = require("../controllers/lesson-controller");
const validateBody = require('../middleware/validate-body');
const {
    createLessonSchema,
    enrollLessonSchema,
    withdrawLessonSchema,
    cancelLessonSchema,
    getLessonsByTutorSchema
} = require('../validators/lesson-validator');
const Joi = require('joi');


const router = express.Router();
//
// TUTOR ROUTES
//

// Create a new lesson
router.post(
    "/create",
    validateBody(createLessonSchema),
    lessonController.createLesson
);

// Abort a lesson
router.patch(
    "/cancel",
    validateBody(cancelLessonSchema),
    lessonController.cancelLesson
);

// Get all lessons by tutor
// ! we also need to ask for the tutorId to verify that it is the same tutor that is logged in
router.post(
    "/tutor-upcoming-lessons",
    validateBody(getLessonsByTutorSchema),
    lessonController.getLessonsByTutor
);

//
// TUTEE ROUTES
//

// Enroll in a lesson
// router.post("/enroll", lessonController.enrollToLesson);

// Withdraw from a lesson
// router.delete("/withdraw", lessonController.withdrawFromLesson);

// Get all lessons a tutee is enrolled in
// ? check if need to change the get request because of the body used to send data instead of the URL
// router.get("/tutee/:tuteeId", lessonController.getTuteeLessons);

// Get all available lessons (with optional query filter)
// ? check if need to change the get request because of the body used to send data instead of the URL
// router.get("/available", lessonController.getAvailableLessons);

module.exports = router;
