import express from "express";
import mongoose from "mongoose";
import dotenv from 'dotenv'; // Import dotenv
import authRoutes from './routes/authRoutes.js';  

const app = express();
const port = 3000;
dotenv.config();


const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  } catch (err) {
    console.error("Failed to connect to MongoDB:");
    process.exit(1);
  }
};

connectDB();

app.use(express.json()); // For parsing JSON data
app.use('/api/auth', authRoutes); // Use auth routes for login/signup


app.listen(port, () => {
  console.log("works");
});
