const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');


router.get(
    "/average-mentor/:mentorId",
    reportController.getMentorAverageReview
);

router.get(
    "/average-mentor",
    reportController.getAllMentorsAverageReview
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
    "/average-lessons-per-mentor",
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

router.get(
    "/get-all-mentors-metadata",
    reportController.getAllMentorsMetadata
  );

router.get(
  "/get-all-approved-lessons",
  reportController.getAllApprovedLessons
);

module.exports = router;
