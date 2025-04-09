import express from "express";
import User from "../models/User.js";
import bcrypt from "bcryptjs"; // For password hashing
import jwt from "jsonwebtoken";

const router = express.Router();
const createToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "3d" });
};

router.post("/signup", async (req, res) => {
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
    res
      .status(201)
      .json({ message: "User created successfully", user: newUser });
  } catch (error) {
    res.status(500).json({ message: "Error creating user", error });
  }
});

router.post("/login", async (req, res) => {
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
    res
      .status(200)
      .json({
        message: "User signed in",
        token,
        user: { email: userExists.email },
      });
  } catch (error) {
    res.status(500).json({ message: "Error creating user", error });
  }
});
export default router;
