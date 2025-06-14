const Lesson = require('../models/Lesson');
const StudentReport = require('../models/StudentReport');
const MentorMetadata = require('../models/MentorMetadata');

const getAverageScore = async (mentorId) => {
  const studentReports = await StudentReport.find({ mentorId });
  if (studentReports.length === 0) return 0;

  const totalScore = studentReports.reduce((sum, r) => sum + (r.averageScore || 0), 0);
  return totalScore / studentReports.length;
};

const getCompletedLessons = async (mentorId) => {
  return Lesson.find({ tutorUserId: mentorId, status: 'approved' });
};

const countCompletedLessons = async (mentorId) => {
  return Lesson.countDocuments({ tutorUserId: mentorId, status: 'approved' });
};

const ensureMentorExists = async (mentorId) => {
  const exists = await MentorMetadata.exists({ mentorId });
  if (!exists) {
      const err = new Error(`Mentor with id ${mentorId} not found`);
      err.status = 404;
      throw err;
  }
};

module.exports = {
    getAverageScore,
    getCompletedLessons,
    countCompletedLessons,
    ensureMentorExists
  };