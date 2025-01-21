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
    res
      .status(500)
      .json({ message: "Something went wrong -- forgotPassword --" });
  }
};

// Handles the password reset process using a reset code
exports.resetPassword = async (req, res) => {
  const { email, resetCode, newPassword, confirmPassword } = req.body;

  try {
    const result = await authService.resetPasswordProcess(
      email,
      resetCode,
      newPassword,
      confirmPassword
    );
    res.status(200).json(result);
  } catch (error) {
    console.error(error.message);
    res.status(400).json({ error: error.message });
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
    res.status(400).json({ error: error.message });
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
    //res.status(200).json({ user });
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

    console.log("Cookies before clearing:", req.cookies);

    res.clearCookie("refreshToken", {
      httpOnly: true,
      sameSite: "Strict",
    });

    const setCookieHeader = res.getHeaders()["set-cookie"];
    console.log("Set-Cookie header after clearing:", setCookieHeader);

    res.status(200).json({ message: "User logged out successfully" });
  } catch (error) {
    res.status(500).json({ error: "Logout failed" });
  }
};
