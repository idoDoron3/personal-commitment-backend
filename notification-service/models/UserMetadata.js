const mongoose = require('mongoose');

const userMetadataSchema = new mongoose.Schema({
  userId: { type: String, unique: true, required: true },
  email: { type: String, required: true },
  fullName: { type: String, required: true },
  role: { type: String, required: true },
}, { timestamps: true });

const UserMetadata = mongoose.model('UserMetadata', userMetadataSchema);
module.exports = UserMetadata;
