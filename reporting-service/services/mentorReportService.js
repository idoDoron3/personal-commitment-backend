const Lesson = require('../models/Lesson');
const StudentReport = require('../models/StudentReport');

const getAverageScore = async (mentorId) => {
  const studentReports = await StudentReport.find({ mentorId });
  if (studentReports.length === 0) return 0;

  const totalScore = studentReports.reduce((sum, r) => sum + (r.averageScore || 0), 0);
  return totalScore / studentReports.length;
};

const getCompletedLessons = async (mentorId) => {
  return Lesson.find({ tutorUserId: mentorId, status: 'complete' });
};

const countCompletedLessons = async (mentorId) => {
  return Lesson.countDocuments({ tutorUserId: mentorId, status: 'complete' });
};

module.exports = {
    getAverageScore,
    getCompletedLessons,
    countCompletedLessons
  };