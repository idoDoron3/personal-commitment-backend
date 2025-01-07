const authService = require("../service/auth-Service");
const jwt = require("jsonwebtoken");

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

exports.logout = async(req, res) => {
  try {
    const { refreshToken } = req.body;
    await authService.logoutUser(refreshToken);
    // Invalidate the token (for stateless JWT, just inform the client to delete it)
    res.status(200).json({ message: "User logged out successfully" });
  } catch (error) {
    res.status(500).json({ error: "Logout failed" });
  }
};

exports.resetPassword = async (req, res) => {
  try {
      const { token, newPassword } = req.body;
      await authService.resetPassword(token, newPassword);
      res.status(200).json({ message: 'Password reset successfully' });
  } catch (error) {
      console.log("must provide tokem in body request")
      res.status(400).json({ error: error.message });
  }
};
