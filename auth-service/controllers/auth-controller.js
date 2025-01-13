const authService = require("../service/auth-Service");

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const { user, resetCode } =
      await authService.findUserAndUpdateWithResetCode(email);

    await authService.sendResetCodeEmail(user.email, resetCode);

    res.status(200).json({ message: "Reset code sent to your email" });
  } catch (error) {
    console.error(error.message);
    res
      .status(500)
      .json({ message: "Something went wrong -- forgotPassword --" });
  }
};

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
    const { user, accessToken, refreshToken } = await authService.loginUser(
      email,
      password
    );

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: false,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({ accessToken, user });
  } catch (error) {
    console.error("Error in login function:", error.message);
    res.status(401).json({ error: "Invalid email or password" });
  }
};

exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.cookies;
    if (!refreshToken) {
      return res.status(401).json({ error: "No refresh token provided" });
    }

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
