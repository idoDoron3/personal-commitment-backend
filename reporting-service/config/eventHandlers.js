const reportService = require('../services/reportService');


const eventHandlers = {
    'lesson.created': reportService.handleLessonCreated, //CONE
    'lesson.canceled': reportService.handleLessonCanceled, //DONE
    'lesson.edited': reportService.handleLessonEdited, //DONE
    // 'lesson.completed': reportService.handleLessonCompleted,
    'mentor.review.published': reportService.handleMentorReviewPublished,
    'student.review.submitted': reportService.handleStudentReviewSubmitted,
    'lesson.verdict.updated': reportService.handleLessonVerdictUpdated,

  };

  module.exports = eventHandlers;
