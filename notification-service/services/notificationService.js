const { sendEmail } = require('../utils/mail');
const UserMetadata = require('../models/UserMetadata');
const formatDate = require('../utils/formatDate');

exports.notifyStudentsOnLessonCancellation = async ({ studentIds, subject, date }) => {
  const readableDate = formatDate(date);
  const msg = `The lesson "${subject}" scheduled for ${readableDate} has been cancelled by the mentor.`;
  const students = await UserMetadata.find({ userId: { $in: studentIds } });
  for (const student  of students) {
    await sendEmail(student.email, 'Lesson Cancelled', msg);
  }
};

exports.notifyMentorOnStudentCancellation = async ({ mentorId, studentId, subject, date }) => {
  const readableDate = formatDate(date);
  const mentor = await UserMetadata.findOne({ userId: mentorId });
  const student = await UserMetadata.findOne({ userId: studentId });
  if (!mentor || !student) {
    console.warn(`⚠️ Missing metadata: mentorId=${mentorId}, studentId=${studentId}`);
    return;
  }

  const msg = `${student.fullName} has cancelled their registration for "${subject}" on ${readableDate}.`;
  await sendEmail(mentor.email, 'Student Cancelled Registration', msg);
};


exports.saveUserMetadata = async ({ userId, email, fullName, role }) => {
  try {
    console.log("📥 Received user.registered event with payload:", { userId, email, fullName, role });
    await UserMetadata.findOneAndUpdate(
      { userId },
      { email, fullName, role },
      { upsert: true, new: true }
    );
    console.log(`👤 Saved user metadata: ${fullName} (${email})`);
  } catch (err) {
    console.error(`❌ Failed to save user metadata:`, err.message);
  }
};