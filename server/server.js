import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv"; // Import dotenv
dotenv.config();
import authRoutes from "./routes/authRoutes.js";
import moviesRoute from "./routes/movies.js";
import cors from "cors";

const app = express();
const port = 3000;

app.use(cors());

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

app.use(express.json()); // For parsing JSON data
app.use("/api/auth", authRoutes); // Use auth routes for login/signup
app.use("/api/movies", moviesRoute);

app.listen(port, () => {
  console.log("works");
});
