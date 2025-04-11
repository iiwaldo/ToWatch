import mongoose from "mongoose";

const movieSchema = new mongoose.Schema(
  {
    id: {
      type: Number, // TMDB movie ID
      required: true,
      unique: true, // Ensure each movie is unique by its ID
    },
    original_title: {
      type: String,
      required: true,
    },
    overview: {
      type: String,
      required: true,
    },
    poster_path: {
      type: String,
      required: true,
    },
    release_date: {
      type: Date,
    },
    genre_ids: [
      {
        type: Number,
      },
    ],
    vote_average: {
      type: Number,
      default: 0,
    },
    backdrop_path: {
      type: String,
    },
    // Any other fields you'd like to store
    trailerId: {
      type: String,
    },
  },
  { timestamps: true }
); // Adds createdAt and updatedAt fields automatically

// Creating the Movie model
const Movie = mongoose.model("Movie", movieSchema);

export default Movie;
