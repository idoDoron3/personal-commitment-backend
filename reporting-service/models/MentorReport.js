const mongoose = require('mongoose');

const mentorReportSchema = new mongoose.Schema({
  lessonId: { type: Number, required: true },
  mentorId: { type: String, required: true },
  summary: String,
  rate: Number,
  tuteesPresence: [
    {
      studentId: String,
      attendanceStatus: { type: String, enum: ['present', 'absent'] }
    }
  ],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('MentorReport', mentorReportSchema);
