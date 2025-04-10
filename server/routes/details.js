import express from "express";
import User from "../models/User.js";
import Movie from "../models/Movie.js";

const router = express.Router();
router.post("/watch-later", async (req, res) => {
  try {
    const { userEmail, movie, trailerId } = req.body;
    let existingMovie = await Movie.findOne({ id: movie.id });
    if (!existingMovie) {
      existingMovie = new Movie({
        id: movie.id, // TMDB ID
        title: movie.title,
        overview: movie.overview,
        poster_path: movie.poster_path,
        release_date: movie.release_date,
        genre_ids: movie.genre_ids,
        vote_average: movie.vote_average,
        backdrop_path: movie.backdrop_path,
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
router.post("/watched", async (req, res) => {
  try {
    const { userEmail, movie, trailerId } = req.body;
    let existingMovie = await Movie.findOne({ id: movie.id });
    if (!existingMovie) {
      existingMovie = new Movie({
        id: movie.id, // TMDB ID
        title: movie.title,
        overview: movie.overview,
        poster_path: movie.poster_path,
        release_date: movie.release_date,
        genre_ids: movie.genre_ids,
        vote_average: movie.vote_average,
        backdrop_path: movie.backdrop_path,
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
router.get("/watch-later", async (req, res) => {});
router.get("/watched", async (req, res) => {});
export default router;
