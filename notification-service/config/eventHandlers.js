const notificationService = require('../services/notificationService');

const eventHandlers = {
  'notifyStudentsOnLessonCancellation': notificationService.notifyStudentsOnLessonCancellation,
  'notifyMentorOnStudentCancellation': notificationService.notifyMentorOnStudentCancellation,
  'user.registered': notificationService.saveUserMetadata,

};

module.exports = eventHandlers;
