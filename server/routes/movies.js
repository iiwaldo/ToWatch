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
router.get("/search/movie", async (req, res) => {
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
router.get("/search/tv", async (req, res) => {
  const { query } = req.query;
  console.log("Searching for tv-shows with query:", query);

  try {
    const response = await axios.get(`${BASE_URL}/search/tv`, {
      params: {
        api_key: TMDB_API_KEY,
        query: query,
      },
    });
    console.log(response.data.results);
    res.json(response.data.results); // Send the search results back to the client
  } catch (error) {
    console.log("Error searching for movies:");
    res.status(500).json({ error: "Failed to fetch searched tv shows" });
  }
});
router.get("/trailer", async (req, res) => {
  const { original_title, original_language, release_date, type } = req.query;
  console.log(original_language);
  console.log(original_title);
  console.log(release_date);
  const year = release_date.split("-")[0];
  let query = "";
  if (original_language === "ar") {
    if (type === "movie") {
      query = `اعلان فيلم ${original_title} ${year}`;
    } else {
      query = `اعلان مسلسل ${original_title} ${year}`;
    }
  } else {
    query = `${original_title} ${year} trailer`;
  }

  try {
    const response = await axios.get(`${PIPE_URL}`, {
      params: {
        q: query, // your search string
        filter: "videos",
      },
    });
    const trailerId = response.data.items[0]?.url.split("v=")[1];
    if (trailerId) {
      console.log(trailerId);
      res.status(200).json(trailerId);
    }
  } catch (error) {
    console.log("Error getting trailer");
  }
});

router.get("/movie-genres", async (req, res) => {
  try {
    const response = await axios.get(`${BASE_URL}/genre/movie/list`, {
      params: { api_key: TMDB_API_KEY },
    });
    res.status(200).json(response.data.genres);
  } catch (error) {
    console.log("error getting movie genres");
  }
});

router.get("/tv-genres", async (req, res) => {
  try {
    const response = await axios.get(`${BASE_URL}/genre/tv/list`, {
      params: { api_key: TMDB_API_KEY },
    });
    res.status(200).json(response.data.genres);
  } catch (error) {
    console.log("error getting movie genres");
  }
});
router.get("/filter", async (req, res) => {
  try {
    const { type, sortOrder, year, genres, language, page } = req.query;
    const dateType =
      type === "movie" ? "primary_release_year" : "first_air_date_year";

    const response = await axios.get(`${BASE_URL}/discover/${type}`, {
      params: {
        api_key: TMDB_API_KEY,
        page: page,
        sort_by: `popularity.${sortOrder}`,
        with_original_language: language,
        with_genres: genres,
        [dateType]: year,
      },
    });
    console.log(page);
    console.log(language);
    console.log(response.data.total_pages);
    res.status(200).json(response.data);
  } catch (error) {
    console.log("error filter", error);
  }
});

export default router;
