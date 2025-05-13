const mongoose = require('mongoose');

const mentorMetadataSchema = new mongoose.Schema({
  mentorId: { type: String, required: true, unique: true },
  fullName: { type: String, required: true },
  mentorEmail: { type: String, required: true }
}, {
  timestamps: true 
});

module.exports = mongoose.model('MentorMetadata', mentorMetadataSchema);
