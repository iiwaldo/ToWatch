import User from "../models/User.js";
import bcrypt from "bcryptjs"; // For password hashing
import jwt from "jsonwebtoken";
import dotenv from "dotenv"; // Import dotenv
dotenv.config();

const createToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "3d" });
};

async function verifyToken(req, res) {
  const { token } = req.body;

  if (!token) {
    return res.status(400).send({ message: "Token is required" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.status(200).send({ message: "Token is valid", user: decoded });
  } catch (error) {
    res.status(401).send({ message: "Token is invalid" });
  }
}
async function signUp(req, res) {
  const { email, password } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      email,
      password: hashedPassword,
    });
    await newUser.save();
    const token = createToken(email);
    res.status(201).json({
      message: "User created successfully",
      user: newUser,
      token: token,
    });
  } catch (error) {
    res.status(500).json({ message: "Error creating user", error });
  }
}
async function logIn(req, res) {
  const { email, password } = req.body;
  try {
    const userExists = await User.findOne({ email });
    if (!userExists) {
      return res.status(400).json({ message: "User Does not exist" });
    }
    const isCorrect = await bcrypt.compare(password, userExists.password);
    if (!isCorrect) {
      return res.status(400).json({ message: "Incorrect Password" });
    }
    const token = createToken(userExists.email);
    res.status(200).json({
      message: "User signed in",
      token,
      user: { email: userExists.email },
    });
  } catch (error) {
    res.status(500).json({ message: "Error creating user", error });
  }
}
export default {
  verifyToken,
  signUp,
  logIn,
};
