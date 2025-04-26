const Lesson = require('../models/Lesson');
const MentorReport = require('../models/MentorReport');
const StudentReport = require('../models/StudentReport');

exports.fetchReportsByMentor = async (tutorId) => {
  return await MentorReport.find({ tutorId });
};


exports.handleLessonCreated = async (data) => {
  await Lesson.create(data);
  console.log(`✅ Lesson Created saved [${data.lessonId}]`);
};

exports.handleLessonCanceled = async (data) => {
  await Lesson.updateOne({ lessonId: data.lessonId }, { status: 'CANCELED' });
};

exports.handleLessonCompleted = async (data) => {
  await Lesson.updateOne({ lessonId: data.lessonId }, { status: 'COMPLETED' });
};

exports.handleMentorReviewPublished = async (data) => {
  await MentorReport.create(data);
};

exports.handleStudentReviewSubmitted = async (data) => {
  await StudentReport.create(data);
};

