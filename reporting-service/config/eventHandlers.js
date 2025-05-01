const reportService = require('../services/reportService');


const eventHandlers = {
    'lesson.created': reportService.handleLessonCreated, //CONE
    'lesson.canceled': reportService.handleLessonCanceled, //DONE
    'lesson.edited': reportService.handleLessonEdited, //DONE
    'mentor.review.published': reportService.handleMentorReviewPublished, //DONE
    'student.review.submitted': reportService.handleStudentReviewSubmitted,//DONE
    'lesson.verdict.updated': reportService.handleLessonVerdictUpdated,//DONE


  };

  module.exports = eventHandlers;
