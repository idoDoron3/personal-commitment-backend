const User = require('../models/user');
const OptionalUser = require('../models/optional-users');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.registerUser = async (firstname, lastname, email, password) => {
  // Check if the user exists in optional_users
  const optionalUser = await OptionalUser.findOne({ where: { email } });
  if (!optionalUser) throw new Error('Registration is not allowed for this email');

  const user_role = optionalUser.role;
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({firstname, lastname, email, hashedPassword ,user_role});
  return user;
};

exports.loginUser = async (email, password) => {
  const user = await User.findOne({ where: { email } });
  if (!user) throw new Error('User not found');

  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) throw new Error('Invalid password');

  const token = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  return { user, token };
};

