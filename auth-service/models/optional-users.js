const mongoose = require('mongoose');

const OptionalUserSchema = new mongoose.Schema({
  first_name: { type: String, required: true },
  last_name:  { type: String, required: true },
  email:      { type: String, required: true, unique: true },
  role:       { type: String, enum: ['student', 'mentor', 'admin'], default: 'student' },
  subjects:   {
    type: [String],
    default: undefined, 
  }
});

module.exports = mongoose.model('OptionalUser', OptionalUserSchema);
