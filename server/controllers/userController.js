import User from "../models/User.js";
import Movie from "../models/Movie.js";

/*
====================================================
HELPER: FIND OR CREATE MOVIE
====================================================

DO NOT CHANGE THIS.
This is your existing movie/trailer logic.
*/
async function findOrCreateMovie(card, trailerId) {
  let movie = await Movie.findOne({ id: card.id });

  const mediaType = card.type === "movie" ? "movie" : "show";

  if (!movie) {
    movie = new Movie({
      id: card.id,
      original_title: card.original_title || card.original_name || "Unknown",
      language: card.original_language || null,
      poster_path: card.poster_path || null,
      genre_ids: Array.isArray(card.genre_ids) ? card.genre_ids : [],
      vote_average:
        typeof card.vote_average === "number" ? card.vote_average : 0,
      type: mediaType,
      trailers: [],
    });

    if (trailerId) {
      movie.trailers.push({
        seasonNumber: null,
        trailerId,
      });
    }

    await movie.save();
  } else {
    // Enrich older/incomplete movie documents

    if (!movie.original_title && (card.original_title || card.original_name)) {
      movie.original_title = card.original_title || card.original_name;
    }

    if (!movie.language && card.original_language) {
      movie.language = card.original_language;
    }

    if (!movie.poster_path && card.poster_path) {
      movie.poster_path = card.poster_path;
    }

    if (
      (!movie.genre_ids || movie.genre_ids.length === 0) &&
      Array.isArray(card.genre_ids)
    ) {
      movie.genre_ids = card.genre_ids;
    }

    if (
      (!movie.vote_average || movie.vote_average === 0) &&
      typeof card.vote_average === "number"
    ) {
      movie.vote_average = card.vote_average;
    }

    // IMPORTANT: use the actual card type
    movie.type = mediaType;

    if (!movie.trailers) {
      movie.trailers = [];
    }

    if (trailerId) {
      const trailerExists = movie.trailers.some(
        (trailer) =>
          trailer.seasonNumber === null && trailer.trailerId === trailerId,
      );

      if (!trailerExists) {
        movie.trailers.push({
          seasonNumber: null,
          trailerId,
        });
      }
    }

    await movie.save();
  }

  return movie;
}

/*
====================================================
WATCH LATER GROUPS
====================================================
*/

// CREATE WATCH LATER GROUP
async function createWatchLaterGroup(req, res) {
  const { userEmail, name } = req.body;

  if (!userEmail || !name) {
    return res.status(400).json({
      message: "userEmail and name are required",
    });
  }

  const trimmedName = name.trim();

  if (!trimmedName) {
    return res.status(400).json({
      message: "Group name cannot be empty",
    });
  }

  try {
    const user = await User.findOne({ email: userEmail });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Make sure "All" exists
    let allGroup = user.watchLaterGroups.find(
      (group) => group.name.toLowerCase() === "all",
    );

    if (!allGroup) {
      user.watchLaterGroups.unshift({
        name: "All",
        movies: [],
      });
    }

    // "All" is reserved
    if (trimmedName.toLowerCase() === "all") {
      return res.status(400).json({
        message: "All is a reserved group name",
      });
    }

    // Prevent duplicate group names
    const groupExists = user.watchLaterGroups.some(
      (group) => group.name.toLowerCase() === trimmedName.toLowerCase(),
    );

    if (groupExists) {
      return res.status(400).json({
        message: "A group with this name already exists",
      });
    }

    user.watchLaterGroups.push({
      name: trimmedName,
      movies: [],
    });

    await user.save();

    const newGroup = user.watchLaterGroups[user.watchLaterGroups.length - 1];

    res.status(201).json({
      message: "Watch Later group created",
      group: {
        id: newGroup._id,
        name: newGroup.name,
        movieCount: newGroup.movies.length,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Error creating Watch Later group",
      error,
    });
  }
}

// GET WATCH LATER GROUPS
async function getWatchLaterGroups(req, res) {
  const { userEmail } = req.query;

  if (!userEmail) {
    return res.status(400).json({
      message: "userEmail is required",
    });
  }

  try {
    const user = await User.findOne({ email: userEmail });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Make sure old users also get the "All" group
    let allGroup = user.watchLaterGroups.find(
      (group) => group.name.toLowerCase() === "all",
    );

    if (!allGroup) {
      allGroup = {
        name: "All",
        movies: [],
      };

      user.watchLaterGroups.unshift(allGroup);
      await user.save();

      allGroup = user.watchLaterGroups[0];
    }

    /*
    "All" should represent every Watch Later movie.

    We use the movies inside All as the total Watch Later count.
    */
    const groups = user.watchLaterGroups.map((group) => ({
      id: group._id,
      name: group.name,
      movieCount: group.movies.length,
    }));

    res.status(200).json({
      groups,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error getting Watch Later groups",
      error,
    });
  }
}

// DELETE WATCH LATER GROUP
async function deleteWatchLaterGroup(req, res) {
  const { userEmail, groupId } = req.body;

  if (!userEmail || !groupId) {
    return res.status(400).json({
      message: "userEmail and groupId are required",
    });
  }

  try {
    const user = await User.findOne({ email: userEmail });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const group = user.watchLaterGroups.id(groupId);

    if (!group) {
      return res.status(404).json({
        message: "Group not found",
      });
    }

    // "All" cannot be deleted
    if (group.name.toLowerCase() === "all") {
      return res.status(400).json({
        message: "The All group cannot be deleted",
      });
    }

    user.watchLaterGroups.pull(groupId);

    await user.save();

    res.status(200).json({
      message: "Watch Later group deleted",
    });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting Watch Later group",
      error,
    });
  }
}

/*
====================================================
ADD TO WATCH LATER
====================================================
*/

async function addWatchLater(req, res) {
  const { userEmail, card, trailerId, groupId } = req.body;

  if (!userEmail || !card) {
    return res.status(400).json({
      message: "userEmail and card are required",
    });
  }

  try {
    const user = await User.findOne({ email: userEmail });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    /*
    Make sure "All" exists.
    */
    let allGroup = user.watchLaterGroups.find(
      (group) => group.name.toLowerCase() === "all",
    );

    if (!allGroup) {
      user.watchLaterGroups.unshift({
        name: "All",
        movies: [],
      });

      allGroup = user.watchLaterGroups[0];
    }

    /*
    Find/create the movie.

    IMPORTANT:
    This uses your existing trailer logic unchanged.
    */
    const movie = await findOrCreateMovie(card, trailerId);

    /*
    Always add movie to "All".
    */
    const alreadyInAll = allGroup.movies.some(
      (movieId) => movieId.toString() === movie._id.toString(),
    );

    if (!alreadyInAll) {
      allGroup.movies.push(movie._id);
    }

    /*
    If a specific group was selected,
    also add the movie to that group.
    */
    if (groupId) {
      const selectedGroup = user.watchLaterGroups.id(groupId);

      if (!selectedGroup) {
        return res.status(404).json({
          message: "Selected group not found",
        });
      }

      const alreadyInGroup = selectedGroup.movies.some(
        (movieId) => movieId.toString() === movie._id.toString(),
      );

      if (!alreadyInGroup) {
        selectedGroup.movies.push(movie._id);
      }
    }

    await user.save();

    res.status(200).json({
      message: "Movie added to Watch Later",
      movie,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error adding movie to Watch Later",
      error,
    });
  }
}

/*
====================================================
GET WATCH LATER MOVIES
====================================================
*/

async function getWatchLater(req, res) {
  const { userEmail, groupId, page = 1, limit = 20 } = req.query;

  if (!userEmail || !groupId) {
    return res.status(400).json({
      message: "userEmail and groupId are required",
    });
  }

  try {
    const user = await User.findOne({ email: userEmail });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const group = user.watchLaterGroups.id(groupId);

    if (!group) {
      return res.status(404).json({
        message: "Group not found",
      });
    }

    const movieIds = group.movies;

    const totalMovies = movieIds.length;

    const currentPage = Math.max(Number(page), 1);
    const moviesPerPage = Math.max(Number(limit), 1);

    const totalPages = Math.ceil(totalMovies / moviesPerPage);

    const startIndex = (currentPage - 1) * moviesPerPage;

    const paginatedIds = movieIds.slice(startIndex, startIndex + moviesPerPage);

    const movies = await Movie.find({
      _id: { $in: paginatedIds },
    });

    res.status(200).json({
      movies,
      currentPage,
      totalPages,
      totalMovies,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error getting Watch Later movies",
      error,
    });
  }
}

/*
====================================================
DELETE FROM WATCH LATER
====================================================
*/

async function deleteWatchLater(req, res) {
  const { userEmail, card, groupId } = req.body;

  if (!userEmail || !card) {
    return res.status(400).json({
      message: "userEmail and card are required",
    });
  }

  try {
    const user = await User.findOne({ email: userEmail });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const movie = await Movie.findOne({
      id: card.id,
    });

    if (!movie) {
      return res.status(404).json({
        message: "Movie not found",
      });
    }

    /*
    If a group was specified:
    */

    if (groupId) {
      const group = user.watchLaterGroups.id(groupId);

      if (!group) {
        return res.status(404).json({
          message: "Group not found",
        });
      }

      /*
      Removing from "All" means removing
      the movie completely from Watch Later.
      */
      if (group.name.toLowerCase() === "all") {
        user.watchLaterGroups.forEach((watchLaterGroup) => {
          watchLaterGroup.movies.pull(movie._id);
        });
      } else {
        /*
        Otherwise only remove it from
        the selected custom group.
        */
        group.movies.pull(movie._id);
      }
    } else {
      /*
      No group specified:
      remove the movie from every Watch Later group.
      */
      user.watchLaterGroups.forEach((watchLaterGroup) => {
        watchLaterGroup.movies.pull(movie._id);
      });
    }

    await user.save();

    res.status(200).json({
      message: "Movie removed from Watch Later",
    });
  } catch (error) {
    res.status(500).json({
      message: "Error removing movie from Watch Later",
      error,
    });
  }
}

/*
====================================================
WATCHED
====================================================
*/

async function addWatched(req, res) {
  const { userEmail, card, trailerId } = req.body;

  if (!userEmail || !card) {
    return res.status(400).json({
      message: "userEmail and card are required",
    });
  }

  try {
    const user = await User.findOne({
      email: userEmail,
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    /*
    Same existing movie/trailer logic.
    */
    const movie = await findOrCreateMovie(card, trailerId);

    const alreadyWatched = user.moviesWatched.some(
      (movieId) => movieId.toString() === movie._id.toString(),
    );

    if (!alreadyWatched) {
      user.moviesWatched.push(movie._id);
      await user.save();
    }

    res.status(200).json({
      message: "Movie added to Watched",
      movie,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error adding movie to Watched",
      error,
    });
  }
}

async function getWatched(req, res) {
  const { userEmail, page = 1, limit = 20 } = req.query;

  if (!userEmail) {
    return res.status(400).json({
      message: "userEmail is required",
    });
  }

  try {
    const user = await User.findOne({
      email: userEmail,
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const totalMovies = user.moviesWatched.length;

    const currentPage = Math.max(Number(page), 1);
    const moviesPerPage = Math.max(Number(limit), 1);

    const totalPages = Math.ceil(totalMovies / moviesPerPage);

    const startIndex = (currentPage - 1) * moviesPerPage;

    const paginatedIds = user.moviesWatched.slice(
      startIndex,
      startIndex + moviesPerPage,
    );

    const movies = await Movie.find({
      _id: { $in: paginatedIds },
    });

    res.status(200).json({
      movies,
      currentPage,
      totalPages,
      totalMovies,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error getting Watched movies",
      error,
    });
  }
}

async function deleteWatched(req, res) {
  const { userEmail, card } = req.body;

  if (!userEmail || !card) {
    return res.status(400).json({
      message: "userEmail and card are required",
    });
  }

  try {
    const user = await User.findOne({
      email: userEmail,
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const movie = await Movie.findOne({
      id: card.id,
    });

    if (!movie) {
      return res.status(404).json({
        message: "Movie not found",
      });
    }

    user.moviesWatched.pull(movie._id);

    await user.save();

    res.status(200).json({
      message: "Movie removed from Watched",
    });
  } catch (error) {
    res.status(500).json({
      message: "Error removing movie from Watched",
      error,
    });
  }
}

/*
====================================================
STATUS
====================================================
*/

async function getStatus(req, res) {
  const { userEmail, card } = req.query;

  if (!userEmail || !card) {
    return res.status(400).json({
      message: "userEmail and card are required",
    });
  }

  try {
    const user = await User.findOne({
      email: userEmail,
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const movie = await Movie.findOne({
      id: Number(card),
    });

    if (!movie) {
      return res.status(200).json({
        isSaved: false,
        isWatched: false,
      });
    }

    /*
    Movie is considered saved if it exists
    in ANY Watch Later group.
    */
    const isSaved = user.watchLaterGroups.some((group) =>
      group.movies.some(
        (movieId) => movieId.toString() === movie._id.toString(),
      ),
    );

    const isWatched = user.moviesWatched.some(
      (movieId) => movieId.toString() === movie._id.toString(),
    );

    res.status(200).json({
      isSaved,
      isWatched,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error getting movie status",
      error,
    });
  }
}

/*
====================================================
EXPORTS
====================================================
*/

export default {
  createWatchLaterGroup,
  getWatchLaterGroups,
  deleteWatchLaterGroup,

  addWatchLater,
  getWatchLater,
  deleteWatchLater,

  addWatched,
  getWatched,
  deleteWatched,

  getStatus,
};
