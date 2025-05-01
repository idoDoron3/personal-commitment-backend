const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticateToken } = require('../middleware/authenticateToken ');


router.get(
    "/average-mentor/:mentorId",
    reportController.getMentorAverageReview
);

router.get(
    "/completed-mentoer-lessons/:mentorId",
    reportController.getMentorCompletedLessonsCount
);

router.get(
    "/top-mentors-completed-lessons",
    reportController.getTopMentors
);

router.get(
    "/avarage-lessons-per-mentor",
    reportController.getAverageLessonsPerMentor 
);

router.get(
    "/lessons-created-last-week",
    reportController.getLessonsCreatedLastWeek 
);

router.get(
    "/mentor-overview/:mentorId",
    reportController.getMentorOverview 
);

router.get(
    "/lesson-grade-distribution",
    reportController.getLessonGradeDistribution
);



module.exports = router;
