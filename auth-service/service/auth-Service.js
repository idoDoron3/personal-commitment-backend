const User = require("../models/user");
const OptionalUser = require("../models/optional-users");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

exports.registerUser = async (firstname, lastname, email, password) => {
  // Check if the user exists in optional_users
  const signUser = await User.findOne({ where: { email } });
  if (signUser) throw new Error("This email is already been used");

  const optionalUser = await OptionalUser.findOne({ where: { email } });
  if (!optionalUser)
    throw new Error("Registration is not allowed for this email");

  const role = optionalUser.role;
  const hashPassword = await bcrypt.hash(password, 10);
  const user = await User.create({
    first_name: firstname,
    last_name: lastname,
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

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return { user, token };
  } catch (error) {
    console.error("Error in loginUser:", error.message);
    throw new Error("Invalid email or password");
  }
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
