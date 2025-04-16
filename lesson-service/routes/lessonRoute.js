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
    getAvailableLessonsBySubjectSchema,
    editLessonSchema

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

router.patch(
    "/edit",
    extractUserInfo,
    validateRole("mentor"),
    validateBody(editLessonSchema),
    lessonController.editLesson
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

// TODO: Amit: need to implement this route
// router.patch(
//     "/upload-lesson-summary",
//     extractUserInfo,
//     validateRole('tutee'),
//     validateBody(uploadLessonSummarySchema),
//     lessonController.uploadLessonSummary
// );



// Enroll to a lesson
router.post(
    "/enroll",
    extractUserInfo,
    validateRole('student'),
    validateBody(enrollLessonSchema),
    lessonController.enrollToLesson
);

// Withdraw from a lesson
router.delete(
    "/withdraw",
    extractUserInfo,
    validateRole('student'),
    validateBody(withdrawLessonSchema),
    lessonController.withdrawFromLesson
);

// Get all available lessons by subject
router.post(
    "/available",
    extractUserInfo,
    validateRole('student'),
    validateBody(getAvailableLessonsBySubjectSchema),
    lessonController.getAvailableLessonsBySubject
);



module.exports = router;
