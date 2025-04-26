const mongoose = require('mongoose');

const studentReportSchema = new mongoose.Schema({
  lessonId: { type: Number, required: true },
  studentId: { type: String, required: true },
  clarity: Number,
  understanding: Number,
  focus: Number,
  helpful: Number,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('StudentReport', studentReportSchema);
