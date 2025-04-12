import express from "express";
import axios from "axios";
import dotenv from "dotenv"; // Import dotenv
dotenv.config();

const router = express.Router();
const TMDB_API_KEY = process.env.TMBD_API_KEY;
const GOOGLE_API_KEY = process.env.GOOGLE_CLOUD_API_KEY;
const BASE_URL = "https://api.themoviedb.org/3";
const PIPE_URL = "https://pipedapi.adminforge.de/search"; 

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
router.get("/trailer", async (req, res) => {
  const { original_title, original_language, release_date } = req.query;
  console.log(original_language);
  console.log(original_title);
  console.log(release_date);
  const year = release_date.split("-")[0];
  const query =
    original_language === "en"
      ? `${original_title} ${year} trailer`
      : `اعلان فيلم ${original_title} ${year}`;
  console.log(query);

  try {
    const response = await axios.get(`${PIPE_URL}`, {
      params: {
        q: query, // your search string
        filter:"videos",
      },
    });
    const trailerId = response.data.items[0]?.url.split('v=')[1];
    if (trailerId) {
      console.log(trailerId);
      res.status(200).json(trailerId);
    }
  } catch (error) {
    console.log("Error getting trailer");
  }
});

export default router;
