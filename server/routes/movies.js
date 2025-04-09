import express from "express";
import axios from "axios";
import dotenv from "dotenv"; // Import dotenv
dotenv.config();

const router = express.Router();
const TMDB_API_KEY = process.env.TMBD_API_KEY;
const BASE_URL = "https://api.themoviedb.org/3";

router.get("/popular", async (req, res) => {
  const page = req.query.page;
  const limit = req.query.limit || 10;
  const language = "en-US";
  try {
    const response = await axios.get(`${BASE_URL}/movie/popular`, {
      params: {
        api_key: TMDB_API_KEY,
        page,
        language,
      },
    });
    const movies = response.data.results.slice(0,limit);
    const totalPages = response.data.total_pages;
    const totalResults = response.data.total_results;
    res.json({
      movies,
      currentPage: page,
      totalPages,
      totalResults,
    });
  } catch (error) {
    console.error("Failed to fetch movies from TMDB:", error.message);
    res.status(500).json({ error: "Failed to fetch movies" });
  }
});
export default router;
