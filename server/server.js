import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes.js";
import detailRoutes from "./routes/detailRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import cors from "cors";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 3000;

const allowedOrigins = [process.env.CLIENT_URL];

app.use(cors({
  origin: allowedOrigins
}));

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("✅ MongoDB connected");
  } catch (error) {
    console.error("❌ MongoDB connection failed");
    console.error("⚠️ Server will continue running without MongoDB");
  }
};

// Try to connect, but DON'T stop the server if it fails
connectDB();

app.use(express.json());

app.use("/api/auth", authRoutes);

app.use("/api/details", detailRoutes);

app.use("/api/user", userRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
