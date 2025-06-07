const authService = require("../service/auth-Service");
const { logRequest } = require("../utils/logger");

// Handles the "Forgot Password" process by generating and emailing a reset code to the user
exports.forgotPassword = async (req, res) => {
  const start = Date.now(); // Start time for duration
  const { email } = req.body;

  try {
    const { user, resetCode } =
      await authService.findUserAndUpdateWithResetCode(email);

    await authService.sendResetCodeEmail(user.email, resetCode);

    const duration = Date.now() - start;

    logRequest({
      success: true,
      req,
      action: "ForgotPassword",
      email,
      role: user.role, // assuming it's present
      status: 200,
      duration,
    });

    res.status(200).json({ message: "Reset code sent to your email" });
  } catch (error) {
    const duration = Date.now() - start;

    const statusCode = error.message === "User not found" ? 404 : 500;

    logRequest({
      success: false,
      req,
      action: "ForgotPassword",
      email,
      reason: error.message,
      status: statusCode,
      duration,
    });

    res.status(statusCode).json({ error: error.message });
  }
};

exports.verifyResetCode = async (req, res) => {
  const start = Date.now(); // Start timer
  const { email, resetCode } = req.body;

  try {
    const { tempToken, message } =
      await authService.verifyResetCodeAndIssueToken(email, resetCode);

    const duration = Date.now() - start;

    logRequest({
      success: true,
      req,
      action: "VerifyResetCode",
      email,
      status: 200,
      duration,
    });

    res.status(200).json({ message, tempToken });
  } catch (error) {
    const duration = Date.now() - start;

    logRequest({
      success: false,
      req,
      action: "VerifyResetCode",
      email,
      reason: error.message,
      status: 400,
      duration,
    });

    res.status(400).json({ error: error.message });
  }
};

exports.updatePassword = async (req, res) => {
  const start = Date.now();
  const { tempToken, newPassword, confirmPassword } = req.body;

  try {
    const result = await authService.updatePasswordWithToken(
      tempToken,
      newPassword,
      confirmPassword
    );

    const duration = Date.now() - start;

    logRequest({
      success: true,
      req,
      action: "UpdatePassword",
      email: result.email,
      role: result.role,
      status: 200,
      duration,
    });

    res.status(200).json(result);
  } catch (error) {
    const duration = Date.now() - start;

    let statusCode;
    if (error.type === "MISSING_FIELDS") {
      statusCode = 400;
    } else if (error.type === "PASSWORD_MISMATCH") {
      statusCode = 422;
    } else if (error.type === "INVALID_OR_EXPIRED_TOKEN") {
      statusCode = 401;
    } else if (error.type === "USER_NOT_FOUND") {
      statusCode = 404;
    } else {
      statusCode = 500;
    }

    logRequest({
      success: false,
      req,
      action: "UpdatePassword",
      email: req.body.email || "unknown",
      reason: error.message,
      status: statusCode,
      duration,
    });

    res.status(statusCode).json({ error: error.message });
  }
};

exports.register = async (req, res) => {
  const start = Date.now();

  // Move email outside the try block so it's available in catch too
  const { email } = req.body;

  try {
    const { first_name, last_name, password } = req.body;
    const user = await authService.registerUser(
      first_name,
      last_name,
      email,
      password
    );

    const duration = Date.now() - start;
    logRequest({
      success: true,
      req,
      action: "Registration",
      email,
      role: user.role,
      status: 201,
      duration,
    });

    res.status(201).json({ message: "User registered successfully", user });
  } catch (error) {
    const duration = Date.now() - start;

    let statusCode;
    if (error.type === "EMAIL_ALREADY_USED") {
      statusCode = 409;
    } else if (error.type === "EMAIL_NOT_ALLOWED") {
      statusCode = 403;
    } else {
      statusCode = 400;
    }

    logRequest({
      success: false,
      req,
      action: "Registration",
      email,
      reason: error.message,
      status: statusCode,
      duration,
    });

    res.status(statusCode).json({ error: error.message });
  }
};

// Authenticates a user and generates tokens
exports.login = async (req, res) => {
  const start = Date.now();
  const { email, password } = req.body;

  try {
    const { user, accessToken, refreshToken } = await authService.loginUser(
      email,
      password
    );

    const duration = Date.now() - start;
    logRequest({
      success: true,
      req,
      action: "Login",
      email,
      role: user.role,
      status: 200,
      duration,
    });

    res.status(200).json({ user, accessToken, refreshToken });
  } catch (error) {
    const duration = Date.now() - start;

    logRequest({
      success: false,
      req,
      action: "Login",
      email,
      reason: error.message,
      status: 401,
      duration,
    });

    res.status(401).json({ error: "Invalid email or password" });
  }
};

// Generates a new access token using a valid refresh token
exports.refreshToken = async (req, res) => {
  try {
    await authService.refreshAccessToken(req, res);
  } catch (error) {
    console.error("Error in refresh:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Logs out the user by invalidating their session or tokens
exports.logout = async (req, res) => {
  const start = Date.now();
  const { user_id } = req.body;

  try {
    await authService.logoutUser(user_id);

    res.clearCookie("refreshToken", {
      httpOnly: true,
      sameSite: "Strict",
    });

    const duration = Date.now() - start;

    logRequest({
      success: true,
      req,
      action: "Logout",
      email: "unknown", // if you have email, insert here
      status: 200,
      duration,
    });

    res.status(200).json({ message: "User logged out successfully" });
  } catch (error) {
    const duration = Date.now() - start;

    logRequest({
      success: false,
      req,
      action: "Logout",
      email: "unknown",
      reason: error.message,
      status: 500,
      duration,
    });

    res.status(500).json({ error: "Logout failed" });
  }
};

exports.addSubject = async (req, res) => {
  try {
    const { email, subject } = req.body;
    const updatedUser = await authService.addSubjectToMentor(email, subject);
    res.status(200).json(updatedUser);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.removeSubject = async (req, res) => {
  try {
    const { email, subject } = req.body;
    const updatedUser = await authService.removeSubjectFromMentor(
      email,
      subject
    );
    res.status(200).json(updatedUser);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.addUser = async (req, res) => {
  try {
    const user = await authService.addUser(req.body);
    res.status(201).json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { email } = req.body;
    const deleted = await authService.deleteUser(email);
    res.status(200).json({ message: "User deleted", deleted });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
