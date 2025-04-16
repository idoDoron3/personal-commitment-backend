const express = require("express");
const lessonController = require("../controllers/lesson-controller");
const validateBody = require('../middleware/validate-body');
const validateRole = require('../middleware/validate-role');
const { extractUserInfo } = require('../middleware/auth-middleware');
const {
    createLessonSchema,
    enrollLessonSchema,
    withdrawLessonSchema,
    cancelLessonSchema,
} = require('../validators/lesson-validator');
const Joi = require('joi');

const router = express.Router();
//
// TUTOR ROUTES
//

// Create a new lesson
router.post(
    "/create",
    extractUserInfo,
    validateRole('mentor'),
    validateBody(createLessonSchema),
    lessonController.createLesson
);

// Cancel a lesson
router.patch(
    "/cancel",
    extractUserInfo,
    validateRole('mentor'),
    validateBody(cancelLessonSchema),
    lessonController.cancelLesson
);

// Get the amount of approved lessons
router.get(
    "/approved-lessons-amount",
    extractUserInfo,
    validateRole('mentor'),
    lessonController.getAmountOfApprovedLessons
);


router.get(
    "/tutor-upcoming-lessons",
    extractUserInfo,
    validateRole('mentor'),
    lessonController.getLessonsOfTutor
);

router.get(
    "/tutor-summary-pending-lessons",
    extractUserInfo,
    validateRole('mentor'),
    lessonController.getLessonsOfTutor
);

//
// TUTEE ROUTES
//

router.get(
    "/tutee-upcoming-lessons",
    extractUserInfo,
    validateRole('tutee'),
    lessonController.getLessonsOfTutee
);


router.get(
    "/tutee-review-pending-lessons",
    extractUserInfo,
    validateRole('tutee'),
    lessonController.getLessonsOfTutee
);


// router.patch(
//     "/upload-lesson-summary",
//     extractUserInfo,
//     validateRole('tutee'),
//     validateBody(uploadLessonSummarySchema),
//     lessonController.uploadLessonSummary
// );




// Enroll in a lesson
router.post(
    "/enroll",
    extractUserInfo,
    validateBody(enrollLessonSchema),
    lessonController.enrollToLesson
);

// Withdraw from a lesson
router.delete(
    "/withdraw",
    extractUserInfo,
    validateBody(withdrawLessonSchema),
    lessonController.withdrawFromLesson
);

// Get all lessons a tutee is enrolled in
// ? check if need to change the get request because of the body used to send data instead of the URL
// router.get("/tutee/:tuteeId", lessonController.getTuteeLessons);

// Get all available lessons (with optional query filter)
// ? check if need to change the get request because of the body used to send data instead of the URL
router.get("/available", lessonController.getAvailableLessons);

module.exports = router;
