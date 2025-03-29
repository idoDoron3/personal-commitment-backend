const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  first_name: { type: String, required: true },
  last_name:  { type: String, required: true },
  email:      { type: String, required: true, unique: true },
  password:   { type: String, required: true },
  role:       { type: String, enum: ['student', 'mentor', 'admin'], default: 'student' },
  subjects: {
    type: [String],
    default: undefined 
  },
  resetToken: String,
  resetTokenExpiry: Date,
});

module.exports = mongoose.model('User', UserSchema);
