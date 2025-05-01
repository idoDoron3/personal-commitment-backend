const Lesson = require('../models/Lesson');
const MentorReport = require('../models/MentorReport');
const StudentReport = require('../models/StudentReport');
const LESSON_STATUS = require('../constants/lessonStatus');  

exports.fetchReportsByMentor = async (tutorId) => {
  return await MentorReport.find({ tutorId });
};


exports.handleLessonCreated = async (data) => {
  await Lesson.create(data);
  console.log(`✅ Lesson Created saved [${data.lessonId}]`);
};

exports.handleLessonCanceled = async (data) => {
  await Lesson.updateOne({ lessonId: data.id }, { status: 'canceled' });
};
exports.handleLessonEdited = async (data) => {
  try {
    if (!data || !data.lessonId) {
      console.error('❌ Cannot update lesson: missing _id in event data', data);
      return;
    }
    // await Lesson.updateOne({ lessonId: data.lessonId }, { $set: { ...data } });
    await Lesson.updateOne(
      { lessonId: data.lessonId },
      { $set: data }
    );
    console.log(`📄 Updated lesson after edit: ${data.lessonId }`);
  } catch (err) {
    console.error('❌ Failed to update lesson after edit:', err);
    throw err;
  }
};

// exports.handleLessonCompleted = async (data) => {
//   await Lesson.updateOne({ lessonId: data.lessonId }, { status: 'COMPLETED' });
// };

exports.handleMentorReviewPublished = async (data) => {
  try {
    const { lessonId, mentorId, report } = data;

    await MentorReport.create({
      lessonId,
      mentorId,
      summary: report.summary,
      studentsPresence: report.studentsPresence  // Clean names
    });

    console.log(`✅ Mentor report saved for lessonId: ${lessonId}`);
  } catch (err) {
    console.error('❌ Failed to save mentor report:', err);
    throw err;
  }
};

exports.handleStudentReviewSubmitted = async (data) => {
  try {
    const { lessonId, mentorId, studentId, clarity, understanding, focus, helpful } = data;
    console.log("=======mentorId=======");
    console.log(mentorId);
    await StudentReport.create({
      lessonId,
      mentorId,
      studentId,
      clarity,
      understanding,
      focus,
      helpful
    });

    console.log(`✅ Student review saved for lessonId: ${lessonId}, studentId: ${studentId}`);
  } catch (err) {
    console.error('❌ Failed to save student review:', err);
    throw err;
  }
};

exports.handleLessonVerdictUpdated = async (data) => {
  try {
    const { lessonId, isApproved } = data;
    const newStatus = isApproved ? LESSON_STATUS.APPROVED : LESSON_STATUS.NOTAPPROVED;

    // Update the Lesson document
    await Lesson.updateOne(
      { lessonId: lessonId },
      { $set: { status: newStatus } }
    );

    console.log(`✅ Lesson verdict updated in reports for lessonId: ${lessonId}`);
  } catch (err) {
    console.error('❌ Failed to update lesson verdict:', err);
    throw err;
  }
};
