import axios from "axios";
import dotenv from "dotenv";
import Movie from "../models/Movie.js";

dotenv.config();

const TMDB_API_KEY = process.env.TMBD_API_KEY;
const BASE_URL = "https://api.themoviedb.org/3";
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

// ============================================================
// HELPERS
// ============================================================

function normalizeMediaType(type) {
  const normalizedType = String(type || "")
    .trim()
    .toLowerCase();

  if (normalizedType === "movie") {
    return "movie";
  }

  if (
    normalizedType === "show" ||
    normalizedType === "tv" ||
    normalizedType === "series"
  ) {
    return "show";
  }

  return null;
}

async function fetchMovieDetails(movieID, type) {
  const normalizedType = normalizeMediaType(type);

  if (!normalizedType) {
    throw new Error("Invalid media type");
  }

  const url =
    normalizedType === "movie"
      ? `${BASE_URL}/movie/${movieID}`
      : `${BASE_URL}/tv/${movieID}`;

  const response = await axios.get(url, {
    params: {
      api_key: TMDB_API_KEY,
    },
  });

  const movieData = response.data;

  // TMDB detail endpoints normally return "genres"
  // instead of "genre_ids".
  // Convert it so the rest of the application
  // can use one consistent property.
  if (!movieData.genre_ids && Array.isArray(movieData.genres)) {
    movieData.genre_ids = movieData.genres.map((genre) => genre.id);
  }

  return movieData;
}

// ============================================================
// MOVIE / SHOW DETAILS
// ============================================================

async function getMovieDetails(req, res) {
  const { movieID, dataType } = req.query;

  if (!movieID || !dataType) {
    return res.status(400).json({
      message: "movieID and dataType are required",
    });
  }

  const normalizedType = normalizeMediaType(dataType);

  if (!normalizedType) {
    return res.status(400).json({
      message: "dataType must be movie or show",
    });
  }

  try {
    const movieData = await fetchMovieDetails(movieID, normalizedType);

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

// ============================================================
// POPULAR MOVIES
// ============================================================

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
    console.error(
      "Error getting popular movies:",
      error.response?.data || error.message,
    );

    res.status(500).json({
      error: "Failed to fetch popular movies",
    });
  }
}

// ============================================================
// SEARCH MOVIES
// ============================================================

async function getSearchedMovie(req, res) {
  const { query } = req.query;

  if (!query) {
    return res.status(400).json({
      message: "Search query is required",
    });
  }

  try {
    const response = await axios.get(`${BASE_URL}/search/movie`, {
      params: {
        api_key: TMDB_API_KEY,
        query,
      },
    });

    res.json(response.data.results);
  } catch (error) {
    console.error(
      "Error searching movies:",
      error.response?.data || error.message,
    );

    res.status(500).json({
      error: "Failed to fetch searched movies",
    });
  }
}

// ============================================================
// SEARCH TV
// ============================================================

async function getSearchedTv(req, res) {
  const { query } = req.query;

  if (!query) {
    return res.status(400).json({
      message: "Search query is required",
    });
  }

  try {
    const response = await axios.get(`${BASE_URL}/search/tv`, {
      params: {
        api_key: TMDB_API_KEY,
        query,
      },
    });

    res.json(response.data.results);
  } catch (error) {
    console.error("Error searching TV:", error.response?.data || error.message);

    res.status(500).json({
      error: "Failed to fetch searched TV shows",
    });
  }
}

// ============================================================
// TRAILER
// ============================================================

async function getTrailer(req, res) {
  const { movieID, title, type, language, seasonNumber, date } = req.query;

  try {
    // --------------------------------------------------------
    // Validate request
    // --------------------------------------------------------

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

    const normalizedType = normalizeMediaType(type);

    if (!normalizedType) {
      return res.status(400).json({
        message: "type must be movie or show",
      });
    }

    const numericMovieID = Number(movieID);

    if (!Number.isInteger(numericMovieID)) {
      return res.status(400).json({
        message: "Movie ID must be a valid number",
      });
    }

    // --------------------------------------------------------
    // Season
    // --------------------------------------------------------

    const currentSeason =
      normalizedType === "show" && seasonNumber ? Number(seasonNumber) : null;

    // --------------------------------------------------------
    // Label
    // --------------------------------------------------------

    let label;

    if (language?.toLowerCase().startsWith("ar")) {
      label = normalizedType === "movie" ? "إعلان فيلم" : "إعلان مسلسل";
    } else {
      label = "Trailer";
    }

    // --------------------------------------------------------
    // Find movie in MongoDB
    // --------------------------------------------------------

    let movie = await Movie.findOne({
      id: numericMovieID,
    });

    // --------------------------------------------------------
    // If movie exists, make sure the type is correct.
    //
    // This is important because some older documents may have
    // been saved with the wrong type.
    // --------------------------------------------------------

    if (movie) {
      const expectedType = normalizedType;

      if (movie.type !== expectedType) {
        console.log("Correcting movie type:", {
          movieID: numericMovieID,
          oldType: movie.type,
          newType: expectedType,
        });

        movie.type = expectedType;
      }

      if (!movie.trailers) {
        movie.trailers = [];
      }
    }

    // --------------------------------------------------------
    // Get TMDB details
    //
    // We do this before returning a cached trailer so that an
    // existing incomplete MongoDB document can be repaired.
    // --------------------------------------------------------

    let tmdbDetails;

    try {
      tmdbDetails = await fetchMovieDetails(numericMovieID, normalizedType);

      console.log("TMDB details fetched:", {
        movieID: numericMovieID,
        type: normalizedType,
      });
    } catch (error) {
      console.error(
        "Error getting TMDB movie/show details:",
        error.response?.data || error.message,
      );

      return res.status(500).json({
        message: "Error getting movie/show details",
      });
    }

    // --------------------------------------------------------
    // Extract TMDB data
    // --------------------------------------------------------

    const genreIds = Array.isArray(tmdbDetails.genre_ids)
      ? tmdbDetails.genre_ids
      : [];

    const tmdbTitle =
      tmdbDetails.original_title || tmdbDetails.original_name || title;

    const tmdbLanguage = tmdbDetails.original_language || null;

    // --------------------------------------------------------
    // Create movie document if it doesn't exist
    // --------------------------------------------------------

    if (!movie) {
      movie = new Movie({
        id: numericMovieID,

        original_title: tmdbTitle,

        poster_path: tmdbDetails.poster_path || null,

        genre_ids: genreIds,

        vote_average:
          typeof tmdbDetails.vote_average === "number"
            ? tmdbDetails.vote_average
            : 0,

        language: tmdbLanguage,

        type: normalizedType,

        trailers: [],
      });

      console.log("Creating new MongoDB movie:", {
        movieID: numericMovieID,
        type: normalizedType,
        language: tmdbLanguage,
      });
    } else {
      // ------------------------------------------------------
      // Repair / enrich existing document
      // ------------------------------------------------------

      if (!movie.original_title && tmdbTitle) {
        movie.original_title = tmdbTitle;
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
        typeof tmdbDetails.vote_average === "number"
      ) {
        movie.vote_average = tmdbDetails.vote_average;
      }

      // NEW:
      // Save language if the existing document doesn't have it.
      if (!movie.language && tmdbLanguage) {
        movie.language = tmdbLanguage;
      }

      // Always make sure the stored type matches the request.
      movie.type = normalizedType;

      if (!movie.trailers) {
        movie.trailers = [];
      }
    }

    // --------------------------------------------------------
    // Check cached trailer AFTER metadata repair
    // --------------------------------------------------------

    const cachedTrailer = movie.trailers?.find(
      (trailer) => trailer.seasonNumber === currentSeason && trailer.trailerId,
    );

    if (cachedTrailer) {
      // Save any metadata/type corrections we made above.
      await movie.save();

      console.log("Trailer found in MongoDB:", {
        movieID: numericMovieID,
        type: normalizedType,
        seasonNumber: currentSeason,
        trailerId: cachedTrailer.trailerId,
      });

      return res.status(200).json({
        key: cachedTrailer.trailerId,
        url: `https://www.youtube.com/embed/${cachedTrailer.trailerId}?playsinline=1&autoplay=1&rel=0`,
        label,
      });
    }

    // --------------------------------------------------------
    // YouTube search query
    // --------------------------------------------------------

    let searchQuery;

    const year = date ? String(date).split("-")[0] : "";

    if (normalizedType === "movie") {
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

    console.log("YouTube search:", {
      query: searchQuery,
      type: normalizedType,
      seasonNumber: currentSeason,
    });

    // --------------------------------------------------------
    // YouTube API
    // --------------------------------------------------------

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

    const results = response.data?.items || [];

    if (results.length === 0) {
      return res.status(404).json({
        message: "No trailer found",
      });
    }

    // --------------------------------------------------------
    // Find best result
    // --------------------------------------------------------

    const lowerTitle = title.toLowerCase();

    let trailer;

    if (normalizedType === "show" && seasonNumber) {
      trailer = results.find((video) => {
        const videoTitle = video.snippet?.title?.toLowerCase() || "";

        return (
          videoTitle.includes(lowerTitle) &&
          videoTitle.includes(`season ${seasonNumber}`) &&
          videoTitle.includes("trailer")
        );
      });
    } else {
      trailer = results.find((video) => {
        const videoTitle = video.snippet?.title?.toLowerCase() || "";

        return (
          videoTitle.includes(lowerTitle) && videoTitle.includes("trailer")
        );
      });
    }

    // --------------------------------------------------------
    // Fallback to first result
    // --------------------------------------------------------

    if (!trailer) {
      trailer = results[0];
    }

    const videoId = trailer?.id?.videoId;

    if (!videoId) {
      console.error("YouTube result did not contain a video ID:", trailer);

      return res.status(404).json({
        message: "No valid trailer video found",
      });
    }

    console.log("Selected trailer:", {
      title: trailer.snippet?.title,
      videoId,
      type: normalizedType,
      seasonNumber: currentSeason,
    });

    // --------------------------------------------------------
    // Check again in case the trailer already exists
    // --------------------------------------------------------

    const trailerAlreadyExists = movie.trailers?.some(
      (existingTrailer) => existingTrailer.seasonNumber === currentSeason,
    );

    // --------------------------------------------------------
    // Add trailer
    // --------------------------------------------------------

    if (!trailerAlreadyExists) {
      movie.trailers.push({
        seasonNumber: currentSeason,
        trailerId: videoId,
      });

      console.log("Trailer added to MongoDB:", {
        movieID: numericMovieID,
        type: normalizedType,
        seasonNumber: currentSeason,
        trailerId: videoId,
      });
    } else {
      console.log(
        "Trailer already exists for this season. No duplicate added.",
      );
    }

    // --------------------------------------------------------
    // Save movie
    // --------------------------------------------------------

    await movie.save();

    console.log("Movie saved to MongoDB:", {
      movieID: numericMovieID,
      title: movie.original_title,
      posterPath: movie.poster_path,
      genreIds: movie.genre_ids,
      voteAverage: movie.vote_average,
      language: movie.language,
      type: movie.type,
      seasonNumber: currentSeason,
      videoId,
    });

    // --------------------------------------------------------
    // Return trailer
    // --------------------------------------------------------

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

// ============================================================
// MOVIE GENRES
// ============================================================

async function getMovieGenres(req, res) {
  try {
    const response = await axios.get(`${BASE_URL}/genre/movie/list`, {
      params: {
        api_key: TMDB_API_KEY,
      },
    });

    res.status(200).json(response.data.genres);
  } catch (error) {
    console.error(
      "Error getting movie genres:",
      error.response?.data || error.message,
    );

    res.status(500).json("Error getting movie genres");
  }
}

// ============================================================
// TV GENRES
// ============================================================

async function getTvGenres(req, res) {
  try {
    const response = await axios.get(`${BASE_URL}/genre/tv/list`, {
      params: {
        api_key: TMDB_API_KEY,
      },
    });

    res.status(200).json(response.data.genres);
  } catch (error) {
    console.error(
      "Error getting TV genres:",
      error.response?.data || error.message,
    );

    res.status(500).json("Error getting TV genres");
  }
}

// ============================================================
// FILTER
// ============================================================

async function getFilter(req, res) {
  try {
    const { type, sortOrder, year, genres, language, page } = req.query;

    const normalizedType = normalizeMediaType(type);

    if (!normalizedType) {
      return res.status(400).json({
        message: "type must be movie or show",
      });
    }

    const dateType =
      normalizedType === "movie"
        ? "primary_release_year"
        : "first_air_date_year";

    const discoverType = normalizedType === "movie" ? "movie" : "tv";

    const response = await axios.get(`${BASE_URL}/discover/${discoverType}`, {
      params: {
        api_key: TMDB_API_KEY,
        page,
        sort_by: `popularity.${sortOrder}`,
        with_original_language: language,
        with_genres: genres,
        [dateType]: year,
      },
    });

    res.status(200).json(response.data);
  } catch (error) {
    console.error("Error filtering:", error.response?.data || error.message);

    res.status(500).json("Error filtering");
  }
}

// ============================================================
// CAST
// ============================================================

async function getCast(req, res) {
  try {
    const { movieID, datatype } = req.query;

    const normalizedType = normalizeMediaType(datatype);

    if (!movieID || !normalizedType) {
      return res.status(400).json({
        message: "movieID and valid datatype are required",
      });
    }

    const url =
      normalizedType === "movie"
        ? `${BASE_URL}/movie/${movieID}/credits`
        : `${BASE_URL}/tv/${movieID}/credits`;

    const response = await axios.get(url, {
      params: {
        api_key: TMDB_API_KEY,
      },
    });

    res.status(200).json(response.data.cast);
  } catch (error) {
    console.error("Error getting cast:", error.response?.data || error.message);

    return res.status(500).json({
      message: "Error getting cast",
      error: error.message,
    });
  }
}

// ============================================================
// ACTOR COMBINED CREDITS
// ============================================================

async function getCombinedCredits(req, res) {
  try {
    const { actorID } = req.query;

    if (!actorID) {
      return res.status(400).json({
        message: "actorID is required",
      });
    }

    const response = await axios.get(
      `${BASE_URL}/person/${actorID}/combined_credits`,
      {
        params: {
          api_key: TMDB_API_KEY,
        },
      },
    );

    res.status(200).json(response.data.cast);
  } catch (error) {
    console.error(
      "Error getting combined credits:",
      error.response?.data || error.message,
    );

    res.status(500).json("Error getting combined credits");
  }
}

// ============================================================
// TV DETAILS / SEASONS
// ============================================================

async function getTvDetails(req, res) {
  const { tvID } = req.query;

  if (!tvID) {
    return res.status(400).json({
      message: "tvID is required",
    });
  }

  try {
    const response = await axios.get(`${BASE_URL}/tv/${tvID}`, {
      params: {
        api_key: TMDB_API_KEY,
      },
    });

    const numberOfSeasons = response.data.number_of_seasons;

    const seasonsArr = response.data.seasons;

    res.status(200).json({
      numberOfSeasons,
      seasonsArr,
    });
  } catch (error) {
    console.error(
      "Error getting TV details:",
      error.response?.data || error.message,
    );

    res.status(500).json("Error getting Show Details");
  }
}

async function getTVSeason(req, res) {
  const { tvID, seasonNumber } = req.query;

  if (!tvID || seasonNumber === undefined) {
    return res.status(400).json({
      message: "tvID and seasonNumber are required",
    });
  }

  try {
    const response = await axios.get(
      `${BASE_URL}/tv/${tvID}/season/${seasonNumber}`,
      {
        params: {
          api_key: TMDB_API_KEY,
        },
      },
    );

    res.status(200).json({
      id: response.data.id,
      name: response.data.name,
      seasonNumber: response.data.season_number,
      airDate: response.data.air_date,
      overview: response.data.overview,
      posterPath: response.data.poster_path,
      episodes: response.data.episodes,
    });
  } catch (error) {
    console.error(
      "Error getting TV season:",
      error.response?.data || error.message,
    );

    res.status(500).json({
      message: "Error getting TV season",
    });
  }
}
// ============================================================
// RECOMMENDATIONS
// ============================================================

async function getRecommendation(req, res) {
  const { id, dataType } = req.query;

  if (!id || !dataType) {
    return res.status(400).json({
      message: "ID and dataType are required",
    });
  }

  const normalizedType = normalizeMediaType(dataType);

  if (!normalizedType) {
    return res.status(400).json({
      message: "dataType must be movie or show",
    });
  }

  const recommendationUrl =
    normalizedType === "movie"
      ? `${BASE_URL}/movie/${id}/recommendations`
      : `${BASE_URL}/tv/${id}/recommendations`;

  const similarUrl =
    normalizedType === "movie"
      ? `${BASE_URL}/movie/${id}/similar`
      : `${BASE_URL}/tv/${id}/similar`;

  try {
    // Fetch both at the same time.
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

    // Recommendations have higher priority.
    const combined = [...recommendations, ...similar];

    // --------------------------------------------------------
    // Remove duplicates and current movie/show
    // --------------------------------------------------------

    const uniqueMap = new Map();

    for (const item of combined) {
      if (!item?.id) {
        continue;
      }

      if (Number(item.id) === Number(id)) {
        continue;
      }

      if (!uniqueMap.has(item.id)) {
        uniqueMap.set(item.id, item);
      }
    }

    let results = Array.from(uniqueMap.values());

    // --------------------------------------------------------
    // Same original language
    // --------------------------------------------------------

    const currentLanguage = req.query.language || null;

    if (currentLanguage) {
      results = results.filter(
        (item) => item.original_language === currentLanguage,
      );
    }

    // --------------------------------------------------------
    // Sort by popularity
    // --------------------------------------------------------

    results.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));

    // --------------------------------------------------------
    // Return best 20
    // --------------------------------------------------------

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

// ============================================================
// SIMILAR
// ============================================================

async function getSimilar(req, res) {
  const { id, dataType } = req.query;

  if (!id || !dataType) {
    return res.status(400).json({
      message: "ID and dataType are required",
    });
  }

  const normalizedType = normalizeMediaType(dataType);

  if (!normalizedType) {
    return res.status(400).json({
      message: "dataType must be movie or show",
    });
  }

  const url =
    normalizedType === "movie"
      ? `${BASE_URL}/movie/${id}/similar`
      : `${BASE_URL}/tv/${id}/similar`;

  try {
    const response = await axios.get(url, {
      params: {
        api_key: TMDB_API_KEY,
      },
    });

    res.status(200).json(response.data.results);
  } catch (error) {
    console.error(
      "Error getting similar:",
      error.response?.data || error.message,
    );

    res.status(500).json("Error getting Similar");
  }
}

// ============================================================
// WATCH PROVIDERS
// ============================================================

async function getProvider(req, res) {
  const { id, dataType } = req.query;

  if (!id || !dataType) {
    return res.status(400).json({
      message: "ID and dataType are required",
    });
  }

  const normalizedType = normalizeMediaType(dataType);

  if (!normalizedType) {
    return res.status(400).json({
      message: "dataType must be movie or show",
    });
  }

  const url =
    normalizedType === "movie"
      ? `${BASE_URL}/movie/${id}/watch/providers`
      : `${BASE_URL}/tv/${id}/watch/providers`;

  try {
    const response = await axios.get(url, {
      params: {
        api_key: TMDB_API_KEY,
      },
    });

    // First try UAE, then Egypt
    let providers = response.data?.results?.AE?.flatrate;

    if (!providers) {
      providers = response.data?.results?.EG?.flatrate;
    }

    providers = providers || [];

    // Get Disney+ from GB
    const gbProviders = response.data?.results?.GB?.flatrate || [];

    const gbDisney = gbProviders.find(
      (provider) => provider.provider_id === 337,
    );

    // Add GB Disney+ only if it exists and isn't already included
    if (
      gbDisney &&
      !providers.some(
        (provider) => provider.provider_id === gbDisney.provider_id,
      )
    ) {
      providers.push(gbDisney);
    }

    if (providers.length > 0) {
      return res.status(200).json(providers);
    }

    return res.status(404).json({
      message: "No providers found for AE, EG, or GB Disney+.",
    });
  } catch (error) {
    console.error(
      "Error getting providers:",
      error.response?.data || error.message,
    );

    return res.status(500).json({
      message: "Failed to fetch providers.",
    });
  }
}

// ============================================================
// EXPORTS
// ============================================================

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
  getTVSeason,
  getRecommendation,
  getSimilar,
  getProvider,
  getMovieDetails,
};
