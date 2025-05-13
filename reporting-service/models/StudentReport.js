const mongoose = require('mongoose');

const studentReportSchema = new mongoose.Schema({
  lessonId: { type: Number, required: true },
  mentorId: { type: String, required: true },
  studentId: { type: String, required: true },
  clarity: Number,
  understanding: Number,
  focus: Number,
  helpful: Number,
  averageScore: Number,
  createdAt: { type: Date, default: Date.now }
});

studentReportSchema.pre('save', function (next) {
  const fields = ['clarity', 'understanding', 'focus', 'helpful'];
  let sum = 0;
  let count = 0;

  fields.forEach(field => {
    if (this[field] !== undefined && this[field] !== null) {
      sum += this[field];
      count++;
    }
  });

  this.averageScore = count > 0 ? (sum / count) : null;

  next();
});

module.exports = mongoose.model('StudentReport', studentReportSchema);
