const authService = require('../service/auth-Service');

exports.register = async (req, res) => {
  try {
    const { firstname, lastname, email, password } = req.body;
    const user = await authService.registerUser(firstname, lastname, email, password);
    res.status(201).json({ message: 'User registered successfully', user });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await authService.loginUser(email, password);
    res.status(200).json(result);
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
};

exports.logout = (req, res) => {
  try {
    // Invalidate the token (for stateless JWT, just inform the client to delete it)
    res.status(200).json({ message: 'User logged out successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Logout failed' });
  }
};