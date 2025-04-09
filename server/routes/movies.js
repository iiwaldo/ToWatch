import express from "express";
import axios from "axios";
import dotenv from "dotenv"; // Import dotenv
dotenv.config();

const router = express.Router();
const TMDB_API_KEY = process.env.TMBD_API_KEY;


router.get("/popular", async (req, res) => {
  try {
    const response = await axios.get(
      `https://api.themoviedb.org/3/movie/popular?api_key=${TMDB_API_KEY}&language=en-US&page=${
        req.query.page || 1
      }`
    );
    res.json(response.data);
  } catch (error) {
    console.error("Failed to fetch movies from TMDB:", error.message);
    res.status(500).json({ error: "Failed to fetch movies" });
  }
});
export default router;
