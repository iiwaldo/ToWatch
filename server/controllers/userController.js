import User from "../models/User.js";
import Movie from "../models/Movie.js";

async function findOrCreateMovie(card, trailerId) {
  let movie = await Movie.findOne({ id: card.id });
  if (!movie) {
    movie = new Movie({
      id: card.id, // TMDB ID
      original_title: card.original_title || card.original_name,
      overview: card.overview || null,
      poster_path: card.poster_path || null,
      release_date: card.release_date || card.first_air_date || null,
      genre_ids: card.genre_ids || null,
      vote_average: card.vote_average,
      backdrop_path: card.backdrop_path,
      trailerId: trailerId,
      type: card.release_date ? "movie" : "show",
    });
    await movie.save();
  }
  return movie;
}

async function addWatchLater(req, res) {
  try {
    const { userEmail, card, trailerId } = req.body;
    let existingMovie = await findOrCreateMovie(card, trailerId);
    const user = await User.findOne({ email: userEmail });
    if (!user.moviesSaved.includes(existingMovie._id)) {
      user.moviesSaved.push(existingMovie._id);
      await user.save();
    }
    res.status(200).json({
      message: "Movie saved to Watch Later list",
      movie: existingMovie,
    });
  } catch (error) {
    res.status(500).json("Server error saving watch later");
  }
}
async function getWatchLater(req, res) {
  try {
    const { userEmail, page = 1, limit = 20 } = req.query;
    const user = await User.findOne({ email: userEmail });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    // Calculate skip based on the current page and limit
    const skip = (parseInt(page) - 1) * parseInt(limit);
    // Find all saved movies for the user
    const totalMovies = user.moviesSaved.length; // Total number of saved movies
    const totalPages = Math.ceil(totalMovies / parseInt(limit)); // Calculate total pages
    // Retrieve movies for the current page
    const moviesSaved = await Movie.find({
      _id: { $in: user.moviesSaved },
    })
      .skip(skip)
      .limit(parseInt(limit));
    res.status(200).json({
      movies: moviesSaved,
      currentPage: parseInt(page),
      totalPages: totalPages, // Return totalPages
    });
  } catch (error) {
    res.status(500).json("error getting watch later movies");
  }
}
async function deleteWatchLater(req, res) {
  const { userEmail, card } = req.body;
  try {
    const user = await User.findOne({ email: userEmail });
    const movieID = await Movie.findOne({ id: card.id });
    let movieObjectId = movieID._id;
    await User.findOneAndUpdate(
      { email: userEmail },
      { $pull: { moviesSaved: movieObjectId } }
    );
    res.status(200).json("movie deleted from watch later...");
  } catch (error) {
    res.status(500).json("error deleting movie saved...");
  }
}
async function addWatched(req, res) {
  try {
    const { userEmail, card, trailerId } = req.body;
    let existingMovie = await findOrCreateMovie(card, trailerId);
    const user = await User.findOne({ email: userEmail });
    if (!user.moviesWatched.includes(existingMovie._id)) {
      user.moviesWatched.push(existingMovie._id);
      await user.save();
    }
    res.status(200).json({
      message: "Movie saved to Watched list",
      movie: existingMovie,
    });
  } catch (error) {
    console.error("Error saving movie to watched list:", error);
    res.status(500).json("error saving to watched");
  }
}
async function getWatched(req, res) {
  try {
    const { userEmail, page = 1, limit = 20 } = req.query;
    const user = await User.findOne({ email: userEmail });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    // Calculate skip based on the current page and limit
    const skip = (parseInt(page) - 1) * parseInt(limit);
    // Find all watched movies for the user
    const totalMovies = user.moviesWatched.length; // Total number of watched movies
    const totalPages = Math.ceil(totalMovies / parseInt(limit)); // Calculate total pages
    // Retrieve movies for the current page (pagination)
    const moviesWatched = await Movie.find({
      _id: { $in: user.moviesWatched },
    })
      .skip(skip)
      .limit(parseInt(limit));

    res.status(200).json({
      movies: moviesWatched,
      currentPage: parseInt(page),
      totalPages: totalPages,
    });
  } catch (error) {
    res.status(500).json("error getting watched");
  }
}
async function deleteWatched(req, res) {
  const { userEmail, card } = req.body;
  try {
    const user = await User.findOne({ email: userEmail });
    const movieID = await Movie.findOne({ id: card.id });
    let movieObjectId = movieID._id;
    await User.findOneAndUpdate(
      { email: userEmail },
      { $pull: { moviesWatched: movieObjectId } }
    );
    res.status(200).json("movie deleted from watched...");
  } catch (error) {
    res.status(500).json("error deleting movie watched...", error);
  }
}
async function getStatus(req, res) {
  try {
    const { movieID, userEmail } = req.query;
    let isWatched = false;
    let isSaved = false;
    const user = await User.findOne({ email: userEmail });
    const movie = await Movie.findOne({ id: movieID });
    if (!movie) {
      return res.status(200).json({ isSaved: isSaved, isWatched: isWatched });
    }
    const movieObjectId = movie._id.toString();
    isSaved = user.moviesSaved.some(
      (savedID) => movieObjectId === savedID.toString()
    );
    isWatched = user.moviesWatched.some(
      (watchedID) => movieObjectId === watchedID.toString()
    );
    res.status(200).json({ isSaved: isSaved, isWatched: isWatched });
  } catch (error) {
    res.status(500).json("error checking status...");
  }
}
export default {
  addWatchLater,
  getWatchLater,
  deleteWatchLater,
  addWatched,
  getWatched,
  deleteWatched,
  getStatus,
};
