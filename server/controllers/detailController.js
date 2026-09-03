import axios from "axios";
import express, { response } from "express";
import dotenv from "dotenv"; // Import dotenv
import Movie from "../models/Movie.js";
dotenv.config();

const TMDB_API_KEY = process.env.TMBD_API_KEY;
const BASE_URL = "https://api.themoviedb.org/3";
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

async function fetchMovieDetails(movieID, type) {
  const url =
    type === "movie"
      ? `${BASE_URL}/movie/${movieID}`
      : `${BASE_URL}/tv/${movieID}`;

  const response = await axios.get(url, {
    params: {
      api_key: TMDB_API_KEY,
    },
  });

  const movieData = response.data;

  if (!movieData.genre_ids && Array.isArray(movieData.genres)) {
    movieData.genre_ids = movieData.genres.map((genre) => genre.id);
  }

  return movieData;
}

async function getMovieDetails(req, res) {
  const { movieID, dataType } = req.query;

  if (!movieID || !dataType) {
    return res.status(400).json({
      message: "movieID and dataType are required",
    });
  }

  try {
    const movieData = await fetchMovieDetails(movieID, dataType);

    res.status(200).json(movieData);
  } catch (error) {
    console.error(
      "Error getting movie/show details:",
      error.response?.data || error.message,
    );

    res.status(500).json({
      message: "Error getting movie/show details",
    });
  }
}

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
  const { movieID, title, type, language, seasonNumber, date } = req.query;

  try {
    if (!movieID) {
      return res.status(400).json({
        message: "Movie ID is required",
      });
    }

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
    // Check MongoDB FIRST
    // ==========================

    let movie = await Movie.findOne({
      id: Number(movieID),
    });

    const currentSeason =
      type === "show" && seasonNumber ? Number(seasonNumber) : null;

    // ==========================
    // Check cached trailer
    // ==========================

    if (movie) {
      const cachedTrailer = movie.trailers?.find(
        (trailer) => trailer.seasonNumber === currentSeason,
      );

      if (cachedTrailer) {
        console.log("Trailer found in MongoDB:", cachedTrailer.trailerId);

        return res.status(200).json({
          key: cachedTrailer.trailerId,
          url: `https://www.youtube.com/embed/${cachedTrailer.trailerId}?playsinline=1&autoplay=1&rel=0`,
          label,
        });
      }
    }

    // ==========================
    // Get full movie/show details
    // ==========================

    // We need the full TMDB details so MongoDB
    // gets poster, genres, rating, etc.

    try {
      tmdbDetails = await fetchMovieDetails(movieID, type);

      console.log("TMDB details fetched for movie:", movieID);
    } catch (error) {
      console.error(
        "Error getting TMDB movie/show details:",
        error.response?.data || error.message,
      );

      return res.status(500).json({
        message: "Error getting movie/show details",
      });
    }

    // ==========================
    // YouTube search query
    // ==========================

    let searchQuery;

    let year = date ? date.split("-")[0] : "";

    if (type === "movie") {
      searchQuery = `${title} Official Trailer ${year}`;
    } else if (seasonNumber) {
      if (language?.toLowerCase().startsWith("ar")) {
        searchQuery = `إعلان مسلسل ${title} الموسم ${seasonNumber} ${year}`;
      } else {
        searchQuery = `${title} Season ${seasonNumber} Trailer ${year}`;
      }
    } else {
      searchQuery = `${title} Trailer ${year}`;
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
          key: YOUTUBE_API_KEY,
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

    // ==========================
    // If no exact match,
    // use first result
    // ==========================

    if (!trailer) {
      trailer = results[0];
    }

    const videoId = trailer.id.videoId;

    console.log("Selected trailer:", {
      title: trailer.snippet.title,
      videoId,
      seasonNumber: currentSeason,
    });

    // ==========================
    // SAVE TO MONGODB
    // ==========================

    if (!movie) {
      // ==========================
      // Movie doesn't exist
      // ==========================

      movie = new Movie({
        id: Number(movieID),

        original_title:
          tmdbDetails.original_title || tmdbDetails.original_name || title,

        poster_path: tmdbDetails.poster_path || null,

        genre_ids: genreIds,

        vote_average: tmdbDetails.vote_average || 0,

        type: type === "movie" ? "movie" : "show",

        trailers: [],
      });
    } else {
      // ==========================
      // Movie already exists
      // ==========================
      // Fill missing movie information
      // without replacing good existing data.
      // ==========================

      if (!movie.original_title) {
        movie.original_title =
          tmdbDetails.original_title || tmdbDetails.original_name || title;
      }

      if (!movie.poster_path && tmdbDetails.poster_path) {
        movie.poster_path = tmdbDetails.poster_path;
      }

      if (
        (!movie.genre_ids || movie.genre_ids.length === 0) &&
        genreIds.length > 0
      ) {
        movie.genre_ids = genreIds;
      }

      if (
        (!movie.vote_average || movie.vote_average === 0) &&
        tmdbDetails.vote_average
      ) {
        movie.vote_average = tmdbDetails.vote_average;
      }

      if (!movie.type) {
        movie.type = type === "movie" ? "movie" : "show";
      }

      if (!movie.trailers) {
        movie.trailers = [];
      }
    }

    // ==========================
    // Check if this season
    // already has a trailer
    // ==========================

    const trailerAlreadyExists = movie.trailers?.some(
      (trailer) => trailer.seasonNumber === currentSeason,
    );

    // ==========================
    // Add trailer
    // ==========================

    if (!trailerAlreadyExists) {
      movie.trailers.push({
        seasonNumber: currentSeason,
        trailerId: videoId,
      });
    }

    // ==========================
    // Save movie
    // ==========================

    await movie.save();

    console.log("Movie + trailer saved to MongoDB:", {
      movieID,
      title: movie.original_title,
      posterPath: movie.poster_path,
      genreIds: movie.genre_ids,
      voteAverage: movie.vote_average,
      type: movie.type,
      seasonNumber: currentSeason,
      videoId,
    });

    // ==========================
    // Return trailer
    // ==========================

    return res.status(200).json({
      key: videoId,
      url: `https://www.youtube.com/embed/${videoId}?playsinline=1&autoplay=1&rel=0`,
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

  if (!id || !dataType) {
    return res.status(400).json({
      message: "ID and dataType are required",
    });
  }

  const recommendationUrl =
    dataType === "movie"
      ? `${BASE_URL}/movie/${id}/recommendations`
      : `${BASE_URL}/tv/${id}/recommendations`;

  const similarUrl =
    dataType === "movie"
      ? `${BASE_URL}/movie/${id}/similar`
      : `${BASE_URL}/tv/${id}/similar`;

  try {
    // Fetch both from TMDB at the same time
    const [recommendationResponse, similarResponse] = await Promise.all([
      axios.get(recommendationUrl, {
        params: {
          api_key: TMDB_API_KEY,
        },
      }),

      axios.get(similarUrl, {
        params: {
          api_key: TMDB_API_KEY,
        },
      }),
    ]);

    const recommendations = recommendationResponse.data?.results || [];

    const similar = similarResponse.data?.results || [];

    // ------------------------------------------------
    // Recommendations have higher priority.
    //
    // If the same movie exists in both lists,
    // the recommendation version is kept.
    // ------------------------------------------------
    const combined = [...recommendations, ...similar];

    // ------------------------------------------------
    // Remove:
    // 1. Current movie/show
    // 2. Duplicate movies/shows
    // ------------------------------------------------
    const uniqueMap = new Map();

    for (const item of combined) {
      if (!item?.id) {
        continue;
      }

      // Don't recommend the movie/show we're currently viewing
      if (Number(item.id) === Number(id)) {
        continue;
      }

      // Only add the first occurrence.
      // Because recommendations come first,
      // recommendations get priority over similar.
      if (!uniqueMap.has(item.id)) {
        uniqueMap.set(item.id, item);
      }
    }

    let results = Array.from(uniqueMap.values());

    // ------------------------------------------------
    // Keep the same original language
    //
    // This prevents the carousel from suddenly showing
    // unrelated-language titles.
    // ------------------------------------------------
    const currentLanguage = req.query.language || null;

    if (currentLanguage) {
      results = results.filter(
        (item) => item.original_language === currentLanguage,
      );
    }

    // ------------------------------------------------
    // Sort by popularity
    //
    // Higher popularity = more likely to be useful
    // to the user.
    // ------------------------------------------------
    results.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));

    // ------------------------------------------------
    // Return only the best 20
    // ------------------------------------------------
    results = results.slice(0, 20);

    res.status(200).json(results);
  } catch (error) {
    console.error(
      "Error getting recommendations/similar:",
      error.response?.data || error.message,
    );

    res.status(500).json({
      message: "Error getting recommendations",
    });
  }
}

async function getSimilar(req, res) {
  const { id, dataType } = req.query;
  const url =
    dataType === "movie"
      ? `${BASE_URL}/movie/${id}/similar`
      : `${BASE_URL}/tv/${id}/similar`;
  try {
    const response = await axios.get(url, {
      params: { api_key: TMDB_API_KEY },
    });
    res.status(200).json(response.data.results);
  } catch (error) {
    console.error("Error getting similar:", error.message);
    res.status(500).json("Error getting Similar");
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
  getSimilar,
  getProvider,
  getMovieDetails,
};
