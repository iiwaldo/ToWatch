import express from "express";
import User from "../models/User.js";
import Movie from "../models/Movie.js";

const router = express.Router();
router.post("/watch-later", async (req, res) => {
  try {
    const { userEmail, card, trailerId } = req.body;
    let existingMovie = await Movie.findOne({ id: card.id });
    if (!existingMovie) {
      existingMovie = new Movie({
        id: card.id, // TMDB ID
        original_title: card.original_title || card.original_name,
        overview: card.overview,
        poster_path: card.poster_path,
        release_date: card.release_date || card.first_air_date || null,
        genre_ids: card.genre_ids,
        vote_average: card.vote_average,
        backdrop_path: card.backdrop_path,
        trailerId: trailerId,
      });
      await existingMovie.save();
    }
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
    console.error("Error saving movie:", error);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/watch-later", async (req, res) => {
  try {
    const { userEmail, page = 1, limit = 20 } = req.query; // Default limit is 20
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
    console.error("Error fetching movies:", error);
    res.status(500).json({ error: "Server error" });
  }
});

router.delete("/watch-later", async (req, res) => {
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
    console.log("error deleting movie saved...", error);
  }
});
router.post("/watched", async (req, res) => {
  try {
    const { userEmail, card, trailerId } = req.body;
    console.log(card);
    let existingMovie = await Movie.findOne({ id: card.id });
    if (!existingMovie) {
      existingMovie = new Movie({
        id: card.id, // TMDB ID
        original_title: card.original_title || card.original_name,
        overview: card.overview,
        poster_path: card.poster_path,
        release_date: card.release_date || card.first_air_date || null,
        genre_ids: card.genre_ids,
        vote_average: card.vote_average,
        backdrop_path: card.backdrop_path,
        trailerId: trailerId,
      });
      await existingMovie.save();
    }
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
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/watched", async (req, res) => {
  try {
    const { userEmail, page = 1, limit = 20 } = req.query; // Default limit is 20
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
      totalPages: totalPages, // Return totalPages
    });
  } catch (error) {
    console.error("Error fetching movies:", error);
    res.status(500).json({ error: "Server error" });
  }
});
router.delete("/watched", async (req, res) => {
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
    console.log("error deleting movie watched...", error);
  }
});
router.get("/movie", async (req, res) => {
  try {
    const { movieID, userEmail } = req.query;
    let isWatched = false;
    let isSaved = false;
    const user = await User.findOne({ email: userEmail });
    const movie = await Movie.findOne({ id: movieID });
    if (!movie) {
      res.status(200).json({ isSaved: isSaved, isWatched: isWatched });
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
    console.log("error checking status...");
  }
});

export default router;
