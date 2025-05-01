const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticateToken } = require('../middleware/authenticateToken ');


router.get(
    "/average-mentor",
    authenticateToken,
    reportController.getMentorAverageReview
);

router.get(
    "/completed-mentoer-lessons",
    authenticateToken,
    reportController.getMentorCompletedLessonsCount
);

router.get(
    "/top-mentors-completed-lessons",
    authenticateToken,
    reportController.getTopMentors
);

module.exports = router;
