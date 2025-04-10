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
    const movies = response.data.results.slice(0, limit);
    const totalPages = response.data.total_pages;
    const totalResults = response.data.total_results;
    res.json({
      movies,
      currentPage: page,
      totalPages,
      totalResults,
    });
  } catch (error) {
    //console.error("Failed to fetch movies from TMDB:", error.message);
    //res.status(500).json({ error: "Failed to fetch movies" });
  }
});
router.get("/search", async (req, res) => {
  const { query } = req.query;
  console.log("Searching for movies with query:", query);

  try {
    const response = await axios.get(`${BASE_URL}/search/movie`, {
      params: {
        api_key: TMDB_API_KEY,
        query: query, // query from the user's search input
      },
    });
    res.json(response.data.results); // Send the search results back to the client
  } catch (error) {
    console.log("Error searching for movies:");
    res.status(500).json({ error: "Failed to fetch searched movies" });
  }
});
router.get("/:id", async (req, res) => {
  const movieId = req.params.id; // Correctly accessing the movie ID from the URL params
  try {
    const response = await axios.get(`${BASE_URL}/movie/${movieId}/videos`, {
      // Fixed URL to include "movie"
      params: {
        api_key: TMDB_API_KEY, // API key from environment
      },
    });
    const videos = response.data.results;
    const trailer = videos.find(
      (video) => video.type === "Trailer" && video.site === "YouTube"
    );
    if (trailer) {
      res.json({ trailerId: trailer.key });
    } else {
      res.status(404).json({ error: "Trailer not found" });
    }
    res.json(response.data); // Return the movie details
  } catch (error) {
    console.error("Error fetching movie details:", error);
    res.status(500).json({ error: "Failed to fetch movie details" });
  }
});

export default router;
