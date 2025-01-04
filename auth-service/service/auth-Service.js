const { Sequelize } = require('sequelize');
const User = require("../models/user");
const OptionalUser = require("../models/optional-users");
const RefreshToken = require('../models/RefreshToken');
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
// const nodemailer = require('nodemailer');


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

exports.loginUser = async (email, password) => {
  try {
    const user = await User.findOne({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new Error("Invalid email or password");
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not defined in environment variables");
    }

    const accessToken = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1m' });
    const refreshToken = jwt.sign({ id: user.id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '1d' });
    const existingToken = await RefreshToken.findOne({ where: { user_id: user.id } });
    if (existingToken) {
      // update curr token 
      existingToken.token = refreshToken;
      existingToken.expiry = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000); // 1 days
      await existingToken.save();
  } else{
      await RefreshToken.create({
          user_id: user.id,
          token: refreshToken,
          expiry: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 days expiry
      });
    }
    return { user, accessToken, refreshToken };

  } catch (error) {
    console.error("Error in loginUser:", error.message);
    throw new Error("Invalid email or password");
  }
};

exports.refreshAccessToken = async (refreshToken) => {
  const tokenRecord = await RefreshToken.findOne({ where: { token: refreshToken, expiry: { [Sequelize.Op.gt]: new Date() } } });
  if (!tokenRecord) throw new Error('Invalid or expired refresh token');

  const user = await User.findOne({ where: { id: tokenRecord.user_id } });
  if (!user) throw new Error('User not found');

  const newAccessToken = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '15m' });
  const newRefreshToken = jwt.sign({ id: user.id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });

  tokenRecord.token = newRefreshToken;
  tokenRecord.expiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await tokenRecord.save();

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
};

exports.logoutUser = async (refreshToken) => {
  await RefreshToken.destroy({ where: { token: refreshToken } });
};


exports.resetPassword = async (token, newPassword) => {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findOne({ where: { id: decoded.id } });
  if (!user) throw new Error('User not found');

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  user.password = hashedPassword;
  await user.save();
};

// exports.loginUser = async (email, password) => {
//   const user = await User.findOne({ where: { email } });
//   if (!user) throw new Error("User not found");

//   const isValidhashPassword1 = await bcrypt.compare(password, user.password);
//   if (!isValidhashPassword1) throw new Error("Invalid password");

//   const token = jwt.sign(
//     { id: user.id, role: user.role },
//     process.env.JWT_SECRET,
//     { expiresIn: "1h" }
//   );

//   return { user, token };
// };
