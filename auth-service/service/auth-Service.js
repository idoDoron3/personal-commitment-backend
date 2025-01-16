const { Sequelize } = require("sequelize");
const User = require("../models/user");
const OptionalUser = require("../models/optional-users");
const RefreshToken = require("../models/RefreshToken");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const sendEmail = require("../utils/mail");
const crypto = require("crypto");
const ms = require("ms");
require("dotenv").config();

// Registers a new user, ensuring the email is allowed and unique
exports.registerUser = async (first_name, last_name, email, password) => {
  // Check if the user exists in optional_users
  const signUser = await User.findOne({ where: { email } });
  if (signUser) throw new Error("This email is already been used");

  const optionalUser = await OptionalUser.findOne({ where: { email } });
  if (!optionalUser)
    throw new Error("Registration is not allowed for this email");

  const hashPassword = await bcrypt.hash(password, 10);
  const user = await User.create({
    first_name: first_name,
    last_name: last_name,
    email: email,
    password: hashPassword,
    role: optionalUser.role,
  });
  return user;
};

// Authenticates a user and returns access and refresh tokens
exports.loginUser = async (email, password) => {
  const user = await User.findOne({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new Error("Invalid email or password");
  }

  const accessToken = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
  );
  const refreshToken = jwt.sign(
    { id: user.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
  );

  const existingToken = await RefreshToken.findOne({
    where: { user_id: user.id },
  });
  const expiryDate = new Date(
    Date.now() + ms(process.env.REFRESH_TOKEN_EXPIRY)
  );
  if (existingToken) {
    existingToken.token = refreshToken;
    existingToken.expiry = expiryDate;
    await existingToken.save();
  } else {
    await RefreshToken.create({
      user_id: user.id,
      token: refreshToken,
      expiry: expiryDate,
    });
  }

  return { user, accessToken, refreshToken };
};

// Refreshes the access token using a valid refresh token
exports.refreshAccessToken = async (req, res) => {
  try {
    const { refreshToken } = req.cookies;
    if (!refreshToken) {
      throw new Error("Refresh token not provided");
    }

    const tokenRecord = await RefreshToken.findOne({
      where: { token: refreshToken, expiry: { [Sequelize.Op.gt]: new Date() } },
    });
    if (!tokenRecord) throw new Error("Invalid or expired refresh token");

    const user = await User.findOne({ where: { id: tokenRecord.user_id } });
    if (!user) throw new Error("User not found");

    const newAccessToken = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
    );
    const newRefreshToken = jwt.sign(
      { id: user.id },
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

// Logs out a user by deleting their refresh token
exports.logoutUser = async (user_id) => {
  await RefreshToken.destroy({ where: { user_id: user_id } });
};

// Resets the password using a token
exports.resetPassword = async (token, newPassword) => {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findOne({ where: { id: decoded.id } });
  if (!user) throw new Error("User not found");

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  user.password = hashedPassword;
  await user.save();
};

// Finds a user and generates a reset code for password recovery
exports.findUserAndUpdateWithResetCode = async (email) => {
  const user = await User.findOne({ where: { email } });
  if (!user) {
    throw new Error("User not found");
  }

  const resetCode = Math.floor(100000 + Math.random() * 900000); // Generate 6-digit code
  const hashedCode = await bcrypt.hash(resetCode.toString(), 10);
  const expiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiry

  user.resetToken = hashedCode;
  user.resetTokenExpiry = expiry;
  await user.save();

  return { user, resetCode };
};

// Sends an email with the reset code for password recovery
exports.sendResetCodeEmail = async (email, resetCode) => {
  await sendEmail(email, `Your reset code is: ${resetCode}`);
};

// Handles password reset with validation and updates the password
exports.resetPasswordProcess = async (
  email,
  resetCode,
  newPassword,
  confirmPassword
) => {
  if (!email || !resetCode || !newPassword || !confirmPassword) {
    throw new Error("All fields are required");
  }

  if (newPassword !== confirmPassword) {
    throw new Error("Passwords do not match");
  }

  const user = await User.findOne({ where: { email } });
  if (!user) {
    throw new Error("User not found");
  }

  const isCodeValid = await bcrypt.compare(
    resetCode.toString(),
    user.resetToken
  );
  if (!isCodeValid || user.resetTokenExpiry < Date.now()) {
    throw new Error("Invalid or expired reset code");
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  user.password = hashedPassword;
  user.resetToken = null;
  user.resetTokenExpiry = null;
  await user.save();

  return { message: "Password updated successfully" }; // מחזיר הודעת הצלחה
};

// Updates the user's password directly
exports.updatePassword = async (user, newPassword) => {
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  user.password = hashedPassword;
  user.resetToken = null;
  user.resetTokenExpiry = null;
  await user.save();
};
