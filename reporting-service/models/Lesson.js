const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema({
  lessonId: { type: Number, required: true, unique: true },
  subjectName: String,
  grade: String,
  level: String,
  description: String,
  tutorUserId: String,
  tutorFullName: String,
  tutorEmail: String,
  appointedDateTime: Date,
  format: { type: String, enum: ['online', 'in-person'] },
  locationOrLink: { type: String, maxlength: 140 },
  status: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Lesson', lessonSchema);
