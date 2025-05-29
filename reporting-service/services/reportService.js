const Lesson = require('../models/Lesson');
const MentorReport = require('../models/MentorReport');
const StudentReport = require('../models/StudentReport');
const MentorMetadata = require('../models/MentorMetadata');
const LESSON_STATUS = require('../constants/lessonStatus');  
const { getAverageScore, getCompletedLessons, countCompletedLessons, ensureMentorExists } = require('./mentorReportHelper');

//===========================mq handling of insert data to report service ==========================

exports.handleLessonCreated = async (data) => {
  await Lesson.create(data);
  console.log(`✅ Lesson Created saved [${data.lessonId}]`);
};

exports.handleLessonCanceled = async (data) => {
  await Lesson.updateOne({ lessonId: data.lessonId }, { status: 'canceled' });
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
  await ensureMentorExists(mentorId);
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

exports.getAllMentorsAverageReview = async () => {
  const reports = await StudentReport.find();

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

exports.getMentorCompletedLessonsCount = async (mentorId) => {
  await ensureMentorExists(mentorId);
  return await countCompletedLessons(mentorId);
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


exports.calculateAverageLessonsPerMentor = async () => {
  const completedLessons = await Lesson.find({ status: 'completed' });
  const totalLessons = completedLessons.length;
  const totalMentors = await MentorMetadata.countDocuments();

  if (totalMentors === 0) {
    return 0; 
  }
  const average = totalLessons / totalMentors;

  return average;
};


exports.countLessonsCreatedLastWeek = async () => {
  const today = new Date();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(today.getDate() - 7);

  const count = await Lesson.countDocuments({
    createdAt: { $gte: sevenDaysAgo, $lte: today },
    status: { $ne: 'cancelled' } // exclude cancelled lessons
  });

  return count;
};

exports.getMentorOverview = async (mentorId) => {
  await ensureMentorExists(mentorId);
  const metadata = await MentorMetadata.findOne({ mentorId });
  if (!metadata) return null;

  const { fullName, mentorEmail } = metadata;
  const averageScore = await getAverageScore(mentorId);
  // const completedLessons = await getCompletedLessons(mentorId);
  const totalCompletedLessons = countCompletedLessons(mentorId);

  return {
    mentorId,
    fullName,
    mentorEmail,
    averageScore: Number(averageScore.toFixed(2)),
    totalCompletedLessons
  };
};

exports.getLessonGradeDistribution = async () => {
  const results = await Lesson.aggregate([
    {
      $match: {
        status: { $ne: 'cancelled' } // Exclude cancelled lessons
      }
    },
    {
      $group: {
        _id: { subjectName: "$subjectName", grade: "$grade" },
        count: { $sum: 1 }
      }
    },
    {
      $project: {
        _id: 0,
        subjectName: "$_id.subjectName",
        grade: "$_id.grade",
        count: 1
      }
    },
    {
      $sort: { subjectName: 1, grade: 1 } // Optional: Sort nicely
    }
  ]);

  return results;
};

exports.getAllMentorsMetadata = async () => {
  const metadataList = await MentorMetadata.find().lean();
  const enrichedList = await Promise.all(
    metadataList.map(async (item) => {
      const averageScore = await getAverageScore(item.mentorId);
      return {
        mentorId: item.mentorId,
        mentorName: item.fullName,
        mentorEmail: item.mentorEmail,
        averageScore: averageScore.toFixed(2)
      };
    })
  );

  return enrichedList;
};



exports.getAllApprovedLessons = async () => {
  const count = await Lesson.countDocuments({ status: "approved" });
  return { approvedLessonsCount: count };
};
