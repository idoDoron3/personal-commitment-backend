const authService = require("../service/auth-Service");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const User = require("../models/User");
const sendEmail = require("../utils/mail");

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // צור קוד OTP ייחודי
    const resetCode = Math.floor(100000 + Math.random() * 900000); // קוד 6 ספרות
    const hashedCode = await bcrypt.hash(resetCode.toString(), 10); // הצפנת הקוד
    const resetCodeExpiry = new Date(Date.now() + 5 * 60 * 1000); // קוד תקף ל-5 דקות

    // שמור את הקוד המוצפן ותאריך התפוגה בבסיס הנתונים
    user.resetToken = hashedCode;
    user.resetTokenExpiry = resetCodeExpiry;
    await user.save();
    console.log(`Reset Code: ${resetCode}`);

    // שלח מייל עם הקוד
    await sendEmail(user.email, `Your reset code is: ${resetCode}`);

    res.status(200).json({ message: "Reset code sent to your email" });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Something went wrong -- forgotPassword --" });
  }
};

exports.resetPassword = async (req, res) => {
  const { email, resetCode, newPassword, confirmPassword } = req.body;

  try {
    // בדיקה שכל השדות קיימים
    if (!email || !resetCode || !newPassword || !confirmPassword) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // בדיקה שסיסמה ו-confirm תואמות
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: "Passwords do not match" });
    }

    // חפש את המשתמש לפי האימייל
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // אימות ה-OTP
    const isCodeValid = await bcrypt.compare(
      resetCode.toString(),
      user.resetToken
    );
    if (!isCodeValid || user.resetTokenExpiry < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired reset code" });
    }

    // עדכן את הסיסמה החדשה
    const hashedPassword = await bcrypt.hash(newPassword, 10); // הצפנת הסיסמה החדשה
    user.password = hashedPassword;
    user.resetToken = null; // ניקוי הטוקן
    user.resetTokenExpiry = null; // ניקוי תאריך התפוגה
    await user.save();

    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

exports.register = async (req, res) => {
  try {
    const { first_name, last_name, email, password } = req.body;
    const user = await authService.registerUser(
      first_name,
      last_name,
      email,
      password
    );
    res.status(201).json({ message: "User registered successfully", user });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await authService.loginUser(email, password);
    console.log(result.token); // TODO
    res.status(200).json(result);
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
};

exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const result = await authService.refreshAccessToken(refreshToken);
    res.status(200).json(result);
  } catch (error) {
    res.status(403).json({ error: error.message });
  }
};

exports.logout = async (req, res) => {
  try {
    const { user_id } = req.body;
    await authService.logoutUser(user_id);
    res.status(200).json({ message: "User logged out successfully" });
  } catch (error) {
    res.status(500).json({ error: "Logout failed" });
  }
};

// exports.logout = async (req, res) => {
//   try {
//     const { refreshToken } = req.body;
//     await authService.logoutUser(refreshToken);
//     res.status(200).json({ message: "User logged out successfully" });
//   } catch (error) {
//     res.status(500).json({ error: "Logout failed" });
//   }
// };
