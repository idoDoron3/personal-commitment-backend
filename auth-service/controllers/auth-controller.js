const authService = require("../service/auth-Service");

// Handles the "Forgot Password" process by generating and emailing a reset code to the user
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const { user, resetCode } =
      await authService.findUserAndUpdateWithResetCode(email);

    await authService.sendResetCodeEmail(user.email, resetCode);

    res.status(200).json({ message: "Reset code sent to your email" });
  } catch (error) {
    console.error(error.message);
    if (error.message === "User not found") {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ message: "Something went wrong" });
  }
};

exports.verifyResetCode = async (req, res) => {
  const { email, resetCode } = req.body;

  try {
    const { tempToken, message } =
      await authService.verifyResetCodeAndIssueToken(email, resetCode);
    res.status(200).json({ message, tempToken });
  } catch (error) {
    console.error("Error in verifyResetCode:", error.message);
    res.status(400).json({ error: error.message });
  }
};

exports.updatePassword = async (req, res) => {
  const { tempToken, newPassword, confirmPassword } = req.body;

  try {
    const result = await authService.updatePasswordWithToken(
      tempToken,
      newPassword,
      confirmPassword
    );
    res.status(200).json(result);
  } catch (error) {
    console.error("Error in updatePassword:", error.message);
    if (error.type === "MISSING_FIELDS") {
      return res.status(400).json({ error: error.message });
    }
    if (error.type === "PASSWORD_MISMATCH") {
      return res.status(422).json({ error: error.message });
    }
    if (error.type === "INVALID_OR_EXPIRED_TOKEN") {
      return res.status(401).json({ error: error.message });
    }
    if (error.type === "USER_NOT_FOUND") {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ message: "Something went wrong" });
  }
};

// Registers a new user in the system
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
    if (error.type === "EMAIL_ALREADY_USED") {
      res.status(409).json({ error: error.message }); // Conflict
    } else if (error.type === "EMAIL_NOT_ALLOWED") {
      res.status(403).json({ error: error.message }); // Forbidden
    } else {
      res.status(400).json({ error: "An unexpected error occurred" }); // Bad Request
    }
  }
};

// Authenticates a user and generates tokens
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const { user, accessToken, refreshToken } = await authService.loginUser(
      email,
      password
    );

    //Save refresh token in a cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: "None",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({ accessToken, user });
  } catch (error) {
    console.error("Error in login function:", error.message);
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
  try {
    const { user_id } = req.body;
    await authService.logoutUser(user_id);

    //console.log("Cookies before clearing:", req.cookies);

    res.clearCookie("refreshToken", {
      httpOnly: true,
      sameSite: "Strict",
    });

    // const setCookieHeader = res.getHeaders()["set-cookie"];
    // console.log("Set-Cookie header after clearing:", setCookieHeader);

    res.status(200).json({ message: "User logged out successfully" });
  } catch (error) {
    res.status(500).json({ error: "Logout failed" });
  }
};
