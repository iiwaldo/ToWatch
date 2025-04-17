import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv"; // Import dotenv
dotenv.config();
import authRoutes from "./routes/authRoutes.js";
import detailRoutes from "./routes/detailRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3000;

const allowedOrigins = [process.env.CLIENT_URL]; // from .env

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
  })
);

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  } catch (error) {
    console.error("Failed to connect to MongoDB:");
    process.exit(1);
  }
};

connectDB();

app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/details", detailRoutes);
app.use("/api/user", userRoutes);

app.listen(PORT, () => {
  console.log("works");
});
