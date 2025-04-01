const User = require("../models/User");
const OptionalUser = require("../models/optional-users");
const RefreshToken = require("../models/RefreshToken");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const sendEmail = require("../utils/mail");
const ms = require("ms");
require("dotenv").config();

// Registers a new user
exports.registerUser = async (first_name, last_name, email, password) => {
  const signUser = await User.findOne({ email });
  if (signUser) {
    const error = new Error("This email is already in use");
    error.type = "EMAIL_ALREADY_USED";
    throw error;
  }

  const optionalUser = await OptionalUser.findOne({ email });
  if (!optionalUser) {
    const error = new Error("Registration is not allowed for this email");
    error.type = "EMAIL_NOT_ALLOWED";
    throw error;
  }

  const hashPassword = await bcrypt.hash(password, 10);
  const userData = {
    first_name,
    last_name,
    email,
    password: hashPassword,
    role: optionalUser.role,
  };

  if (optionalUser.role === "mentor") {
    userData.subjects = optionalUser.subjects || [];
  }

  const user = new User(userData);

  await user.save();
  return user;
};

// Authenticates a user
exports.loginUser = async (email, password) => {
  const user = await User.findOne({ email });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new Error("Invalid email or password");
  }

  const accessToken = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
  );

  const refreshToken = jwt.sign(
    { id: user._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
  );

  const expiryDate = new Date(
    Date.now() + ms(process.env.REFRESH_TOKEN_EXPIRY)
  );
  const existingToken = await RefreshToken.findOne({ user_id: user._id });

  if (existingToken) {
    existingToken.token = refreshToken;
    existingToken.expiry = expiryDate;
    await existingToken.save();
  } else {
    await new RefreshToken({
      user_id: user._id,
      token: refreshToken,
      expiry: expiryDate,
    }).save();
  }

  return { user, accessToken, refreshToken };
};

// Refreshes the access token
exports.refreshAccessToken = async (req, res) => {
  try {
    const { refreshToken } = req.cookies;
    if (!refreshToken) {
      throw new Error("Refresh token not provided");
    }

    const tokenRecord = await RefreshToken.findOne({
      token: refreshToken,
      expiry: { $gt: new Date() },
    });

    if (!tokenRecord) throw new Error("Invalid or expired refresh token");

    const user = await User.findById(tokenRecord.user_id);
    if (!user) throw new Error("User not found");

    const newAccessToken = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
    );

    const newRefreshToken = jwt.sign(
      { id: user._id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
    );

    tokenRecord.token = newRefreshToken;
    tokenRecord.expiry = new Date(
      Date.now() + ms(process.env.REFRESH_TOKEN_EXPIRY)
    );
    await tokenRecord.save();

    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "Strict",
      maxAge: ms(process.env.REFRESH_TOKEN_EXPIRY),
    });

    return res.status(200).json({ accessToken: newAccessToken });
  } catch (error) {
    console.error("Error in refreshAccessToken:", error.message);
    return res.status(401).json({ error: error.message });
  }
};

// Logout
exports.logoutUser = async (user_id) => {
  await RefreshToken.deleteOne({ user_id });
};

// Reset password using token
exports.resetPassword = async (token, newPassword) => {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findById(decoded.id);
  if (!user) throw new Error("User not found");

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  user.password = hashedPassword;
  await user.save();
};

// Request password reset
exports.findUserAndUpdateWithResetCode = async (email) => {
  const user = await User.findOne({ email });
  if (!user) throw new Error("User not found");

  const resetCode = Math.floor(100000 + Math.random() * 900000);
  const hashedCode = await bcrypt.hash(resetCode.toString(), 10);
  const expiry = new Date(Date.now() + 5 * 60 * 1000);

  user.resetToken = hashedCode;
  user.resetTokenExpiry = expiry;
  await user.save();

  return { user, resetCode };
};

// Send email
exports.sendResetCodeEmail = async (email, resetCode) => {
  await sendEmail(email, `Your reset code is: ${resetCode}`);
};

// Verify reset code and issue temporary token
exports.verifyResetCodeAndIssueToken = async (email, resetCode) => {
  const user = await User.findOne({ email });
  if (!user) throw new Error("User not found");

  const isCodeValid = await bcrypt.compare(
    resetCode.toString(),
    user.resetToken
  );
  if (!isCodeValid || user.resetTokenExpiry < Date.now()) {
    throw new Error("Invalid or expired reset code");
  }

  const tempToken = jwt.sign(
    { id: user._id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "10m" }
  );

  return { tempToken, message: "Reset code verified successfully" };
};

// Update password using token
exports.updatePasswordWithToken = async (
  tempToken,
  newPassword,
  confirmPassword
) => {
  if (!tempToken || !newPassword || !confirmPassword) {
    const error = new Error("All fields are required");
    error.type = "MISSING_FIELDS";
    throw error;
  }

  if (newPassword !== confirmPassword) {
    const error = new Error("Passwords do not match");
    error.type = "PASSWORD_MISMATCH";
    throw error;
  }

  let decoded;
  try {
    decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
  } catch (error) {
    const jwtError = new Error("Invalid or expired token");
    jwtError.type = "INVALID_OR_EXPIRED_TOKEN";
    throw jwtError;
  }

  const user = await User.findById(decoded.id);
  if (!user) {
    const error = new Error("User not found");
    error.type = "USER_NOT_FOUND";
    throw error;
  }

  user.password = await bcrypt.hash(newPassword, 10);
  user.resetToken = null;
  user.resetTokenExpiry = null;
  await user.save();

  return { message: "Password updated successfully" };
};

exports.addSubjectToMentor = async (email, subject) => {
  const user = await User.findOne({ email });
  if (!user || user.role !== "mentor") throw new Error("Mentor not found");
  if (!user.subjects.includes(subject)) user.subjects.push(subject);
  await user.save();
  return user;
};

exports.removeSubjectFromMentor = async (email, subject) => {
  const user = await User.findOne({ email });
  if (!user || user.role !== "mentor") throw new Error("Mentor not found");
  user.subjects = user.subjects.filter((s) => s !== subject);
  await user.save();
  return user;
};

//admin - add to optinal
exports.addUser = async (data) => {
  const existingOptional = await OptionalUser.findOne({ email: data.email });

  if (existingOptional) {
    throw new Error("This email is already in use by OptionalUser");
  }

  const optionalUser = new OptionalUser({
    first_name: data.first_name,
    last_name: data.last_name,
    email: data.email,
    role: data.role,
    subjects: data.subjects || [],
  });

  await optionalUser.save();
  return optionalUser;
};

//delete from users and optianl
exports.deleteUser = async (email) => {
  const deletedUser = await User.findOneAndDelete({ email });
  const deletedOptional = await OptionalUser.findOneAndDelete({ email });

  if (!deletedUser && !deletedOptional) {
    throw new Error("User not found in any collection");
  }

  return {
    deletedFrom: [
      deletedUser ? "User" : null,
      deletedOptional ? "OptionalUser" : null,
    ].filter(Boolean),
    email,
  };
};
