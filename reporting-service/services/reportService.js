const Lesson = require('../models/Lesson');
const MentorReport = require('../models/MentorReport');
const StudentReport = require('../models/StudentReport');
const MentorMetadata = require('../models/MentorMetadata');
const LESSON_STATUS = require('../constants/lessonStatus');  

//===========================mq handling of insert data to report service ==========================

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
//==============================handle register new mentor=======================================

exports.handleMentorRegistered = async (mentorData) => {
  const { mentorId, fullName, mentorEmail } = mentorData;

  // Upsert (update if exists, insert if not)
  await MentorMetadata.findOneAndUpdate(
    { mentorId },
    { fullName, mentorEmail },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  console.log(`✅ MentorMetadata saved/updated for mentorId: ${mentorId}`);
};

 //=============================fetch report with controller to the gateway======================

 exports.getMentorAverageScore = async (mentorId) => {
  const reports = await StudentReport.find({ mentorId });

  if (!reports.length) {
      return {
          averageScore: 0,
          clarity: 0,
          understanding: 0,
          focus: 0,
          helpful: 0
      };
  }

  const sums = reports.reduce((acc, report) => {
      acc.clarity += report.clarity || 0;
      acc.understanding += report.understanding || 0;
      acc.focus += report.focus || 0;
      acc.helpful += report.helpful || 0;
      acc.averageScore += report.averageScore || 0;
      return acc;
  }, { clarity: 0, understanding: 0, focus: 0, helpful: 0, averageScore: 0 });

  const count = reports.length;

  return {
      averageScore: Math.round((sums.averageScore / count) * 100) / 100,
      clarity: Math.round((sums.clarity / count) * 100) / 100,
      understanding: Math.round((sums.understanding / count) * 100) / 100,
      focus: Math.round((sums.focus / count) * 100) / 100,
      helpful: Math.round((sums.helpful / count) * 100) / 100
  };
};

exports.getCompletedLessonsCount = async (mentorId) => {
  const count = await Lesson.countDocuments({
      tutorUserId: mentorId,
      status: 'completed'
  });

  return count;
};


exports.getTopMentorsByCompletedLessons = async () => {
  const topMentors = await Lesson.aggregate([
      { $match: { status: 'completed' } },
      {
          $group: {
              _id: "$tutorUserId",
              tutorFullName: { $first: "$tutorFullName" },
              tutorEmail: { $first: "$tutorEmail" },
              lessonCount: { $sum: 1 }
          }
      },
      { $sort: { lessonCount: -1 } },
      { $limit: 10 } //we want to change it? let the admin decide???
  ]);

  return topMentors.map(item => ({
      mentorId: item._id,
      mentorName: item.tutorFullName,
      mentorEmail: item.tutorEmail,
      lessonCount: item.lessonCount
  }));
};