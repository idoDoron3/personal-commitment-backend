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
    getLessonsByTutorSchema,
    getAvailableLessonsBySubjectSchema ,
    editLessonSchema
} = require('../validators/lesson-validator');

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

// Abort a lesson
router.patch(
    "/cancel",
    extractUserInfo,
    validateBody(cancelLessonSchema),
    lessonController.cancelLesson
);

// Get all lessons by tutor
// ! we also need to ask for the tutorId to verify that it is the same tutor that is logged in
router.post(
    "/tutor-upcoming-lessons",
    extractUserInfo,
    validateBody(getLessonsByTutorSchema),
    lessonController.getLessonsByTutor
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

// Enroll to a lesson
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

// Get all available lessons by subject
router.post(
    "/available",
    validateBody(getAvailableLessonsBySubjectSchema),
    lessonController.getAvailableLessonsBySubject
  );
  

// Get all lessons a tutee is enrolled in
// ? check if need to change the get request because of the body used to send data instead of the URL
// router.get("/tutee/:tuteeId", lessonController.getTuteeLessons);


module.exports = router;
