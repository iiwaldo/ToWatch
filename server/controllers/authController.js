import User from "../models/User.js";

import bcrypt from "bcryptjs";

import jwt from "jsonwebtoken";

import dotenv from "dotenv";

dotenv.config();

const createToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "3d" });
};

// MARK: - Verify Token

async function verifyToken(req, res) {
  const { token } = req.body;

  if (!token) {
    return res.status(400).send({
      message: "Token is required",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // The JWT currently stores the user's email in `id`
    const user = await User.findOne({
      email: decoded.id,
    });

    if (!user) {
      return res.status(401).send({
        message: "User not found",
      });
    }

    res.status(200).send({
      message: "Token is valid",

      user: {
        id: user.email,
        profilePicture: user.profilePicture || null,
      },
    });
  } catch (error) {
    res.status(401).send({
      message: "Token is invalid",
    });
  }
}

// MARK: - Sign Up

async function signUp(req, res) {
  const { email, password } = req.body;

  try {
    const userExists = await User.findOne({
      email,
    });

    if (userExists) {
      return res.status(400).json({
        message: "User already exists",
      });
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

      user: {
        email: newUser.email,
        profilePicture: newUser.profilePicture || null,
      },

      token: token,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error creating user",
      error,
    });
  }
}

// MARK: - Log In

async function logIn(req, res) {
  const { email, password } = req.body;

  try {
    const userExists = await User.findOne({
      email,
    });

    if (!userExists) {
      return res.status(400).json({
        message: "User Does not exist",
      });
    }

    const isCorrect = await bcrypt.compare(password, userExists.password);

    if (!isCorrect) {
      return res.status(400).json({
        message: "Incorrect Password",
      });
    }

    const token = createToken(userExists.email);

    res.status(200).json({
      message: "User signed in",

      token,

      user: {
        email: userExists.email,
        profilePicture: userExists.profilePicture || null,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Error creating user",
      error,
    });
  }
}

export default {
  verifyToken,

  signUp,

  logIn,
};
