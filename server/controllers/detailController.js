import axios from "axios";
import express, { response } from "express";
import dotenv from "dotenv"; // Import dotenv
dotenv.config();

const TMDB_API_KEY = process.env.TMBD_API_KEY;
const BASE_URL = "https://api.themoviedb.org/3";
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

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
  const { title, type, language, seasonNumber } = req.query;

  try {
    if (!title) {
      return res.status(400).json({
        message: "Title is required",
      });
    }

    // ==========================
    // Label
    // ==========================

    let label;

    if (language?.toLowerCase().startsWith("ar")) {
      label = type === "movie" ? "إعلان فيلم" : "إعلان مسلسل";
    } else {
      label = "Trailer";
    }

    // ==========================
    // YouTube search query
    // ==========================

    let searchQuery;

    if (type === "movie") {
      searchQuery = `${title} Official Trailer`;
    } else if (seasonNumber) {
      if (language?.toLowerCase().startsWith("ar")) {
        searchQuery = `${title} الموسم ${seasonNumber} إعلان`;
      } else {
        searchQuery = `${title} Season ${seasonNumber} Trailer`;
      }
    } else {
      searchQuery = `${title} Trailer`;
    }

    console.log("YouTube search:", searchQuery);

    // ==========================
    // YouTube API
    // ==========================

    const response = await axios.get(
      "https://www.googleapis.com/youtube/v3/search",
      {
        params: {
          part: "snippet",
          q: searchQuery,
          type: "video",
          maxResults: 5,
          videoEmbeddable: true,
          key: process.env.YOUTUBE_API_KEY,
        },
      },
    );

    const results = response.data.items;

    if (!results || results.length === 0) {
      return res.status(404).json({
        message: "No trailer found",
      });
    }

    // ==========================
    // Find best result
    // ==========================

    const lowerTitle = title.toLowerCase();

    let trailer;

    if (type === "show" && seasonNumber) {
      trailer = results.find((video) => {
        const videoTitle = video.snippet.title.toLowerCase();

        return (
          videoTitle.includes(lowerTitle) &&
          videoTitle.includes(`season ${seasonNumber}`) &&
          videoTitle.includes("trailer")
        );
      });
    } else {
      trailer = results.find((video) => {
        const videoTitle = video.snippet.title.toLowerCase();

        return (
          videoTitle.includes(lowerTitle) && videoTitle.includes("trailer")
        );
      });
    }

    // If no exact match, use first result
    if (!trailer) {
      trailer = results[0];
    }

    const videoId = trailer.id.videoId;

    console.log("Selected trailer:", {
      title: trailer.snippet.title,
      videoId,
      seasonNumber,
    });

    return res.status(200).json({
      key: videoId,
      url: `https://www.youtube.com/embed/${videoId}`,
      label,
    });
  } catch (error) {
    console.error(
      "Error getting trailer:",
      error.response?.data || error.message,
    );

    return res.status(500).json({
      message: "Error getting trailer",
    });
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
    res
      .status(200)
      .json({ numberOfSeasons: numberOfSeasons, seasonsArr: seasonsArr });
  } catch (error) {
    res.status(500).json("error getting Show Details");
  }
}

async function getRecommendation(req, res) {
  const { id, dataType } = req.query;
  const url =
    dataType === "movie"
      ? `${BASE_URL}/movie/${id}/recommendations`
      : `${BASE_URL}/tv/${id}/recommendations`;
  try {
    const response = await axios.get(url, {
      params: { api_key: TMDB_API_KEY },
    });
    res.status(200).json(response.data.results);
  } catch (error) {
    res.status(500).json("Error getting Reccomendations");
  }
}
async function getProvider(req, res) {
  const { id, dataType } = req.query;
  const url =
    dataType === "movie"
      ? `${BASE_URL}/movie/${id}/watch/providers`
      : `${BASE_URL}/tv/${id}/watch/providers`;

  try {
    const response = await axios.get(url, {
      params: {
        api_key: TMDB_API_KEY,
      },
    });

    // First try to get providers from AE (UAE)
    let providers = response.data?.results?.AE?.flatrate;

    // If no AE providers, try to get from EG (Egypt)
    if (!providers) {
      providers = response.data?.results?.EG?.flatrate;
    }

    // If providers found, send them, otherwise send a 404
    if (providers && providers.length > 0) {
      res.status(200).json(providers);
    } else {
      res.status(404).json({ message: "No providers found for AE or EG." });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch providers." });
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
  getTvDetails,
  getRecommendation,
  getProvider,
};
