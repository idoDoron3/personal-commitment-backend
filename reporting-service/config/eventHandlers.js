const reportService = require('../services/reportService');


const eventHandlers = {
    'lesson.created': reportService.handleLessonCreated,
    'lesson.canceled': reportService.handleLessonCanceled,
    'lesson.completed': reportService.handleLessonCompleted,
    'mentor.review.published': reportService.handleMentorReviewPublished,
    'student.review.submitted': reportService.handleStudentReviewSubmitted
  };

  module.exports = eventHandlers;
