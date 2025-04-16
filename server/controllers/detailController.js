import axios from "axios";
import express, { response } from "express";
import dotenv from "dotenv"; // Import dotenv
dotenv.config();

const TMDB_API_KEY = process.env.TMBD_API_KEY;
const BASE_URL = "https://api.themoviedb.org/3";
const PIPE_URL = "https://pipedapi.adminforge.de/search";

async function getPopularMovies(req, res) {
  const page = req.query.page;
  const language = "en-US";
  try {
    const response = await axios.get(`${BASE_URL}/movie/popular`, {
      params: {
        api_key: TMDB_API_KEY,
        page,
        language,
      },
    });
    const movies = response.data.results;
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
    res.status(500).json({ error: "Failed to fetch  popular movies" });
  }
}
async function getSearchedMovie(req, res) {
  const { query } = req.query;
  try {
    const response = await axios.get(`${BASE_URL}/search/movie`, {
      params: {
        api_key: TMDB_API_KEY,
        query: query,
      },
    });
    res.json(response.data.results);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch searched movies" });
  }
}
async function getSearchedTv(req, res) {
  const { query } = req.query;
  try {
    const response = await axios.get(`${BASE_URL}/search/tv`, {
      params: {
        api_key: TMDB_API_KEY,
        query: query,
      },
    });
    res.json(response.data.results);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch searched tv shows" });
  }
}
async function getTrailer(req, res) {
  const { original_title, original_language, release_date, type } = req.query;
  let year = null;
  if (release_date) {
    year = release_date.split("-")[0];
  }
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
        q: query,
        filter: "videos",
      },
    });
    console.log(query);
    const trailerId = response.data.items[0]?.url.split("v=")[1];
    if (trailerId) {
      res.status(200).json(trailerId);
    }
  } catch (error) {
    res.status(500).json("Error getting trailer");
  }
}
async function getMovieGenres(req, res) {
  try {
    const response = await axios.get(`${BASE_URL}/genre/movie/list`, {
      params: { api_key: TMDB_API_KEY },
    });
    res.status(200).json(response.data.genres);
  } catch (error) {
    res.status(500).json("Error getting movie genres");
  }
}
async function getTvGenres(req, res) {
  try {
    const response = await axios.get(`${BASE_URL}/genre/tv/list`, {
      params: { api_key: TMDB_API_KEY },
    });
    res.status(200).json(response.data.genres);
  } catch (error) {
    res.status(500).json("Error getting TV genres");
  }
}
async function getFilter(req, res) {
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
    res.status(200).json(response.data);
  } catch (error) {
    res.status(500).json("Error filtering");
  }
}
async function getCast(req, res) {
  try {
    const { movieID, datatype } = req.query;
    console.log(movieID);
    console.log(datatype);
    const url =
      datatype === "movie"
        ? `${BASE_URL}/movie/${movieID}/credits`
        : `${BASE_URL}/tv/${movieID}/credits`;
    const response = await axios.get(url, {
      params: { api_key: TMDB_API_KEY },
    });
    res.status(200).json(response.data.cast);
  } catch (error) {
    console.log(error.message);
    return res
      .status(500)
      .json({ message: "Error getting cast", error: error.message });
  }
}
async function getCombinedCredits(req, res) {
  try {
    const { actorID } = req.query;
    const url = `${BASE_URL}/person/${actorID}/combined_credits`;
    const response = await axios.get(url, {
      params: { api_key: TMDB_API_KEY },
    });
    res.status(200).json(response.data.cast);
  } catch (error) {
    res.status(500).json("Error getting combined credits");
  }
}
async function getTvDetails(req, res) {
  const { tvID } = req.query;
  try {
    const response = await axios.get(`${BASE_URL}/tv/${tvID}`, {
      params: { api_key: TMDB_API_KEY },
    });
    const numberOfSeasons = response.data.number_of_seasons;
    const seasonsArr = response.data.seasons;
    res.status(200).json({numberOfSeasons:numberOfSeasons,seasonsArr:seasonsArr});
  } catch (error) {
    res.status(500).json("error getting Show Details");
  }
}
export default {
  getPopularMovies,
  getSearchedMovie,
  getSearchedTv,
  getTrailer,
  getMovieGenres,
  getTvGenres,
  getFilter,
  getCast,
  getCombinedCredits,
  getTvDetails
};