import mongoose from "mongoose";
const movieSchema = new mongoose.Schema(
  {
    id: {
      type: Number,
      required: true,
      unique: true,
    },

    original_title: {
      type: String,
      required: true,
    },

    language: String,
    poster_path: String,

    genre_ids: [
      {
        type: Number,
      },
    ],

    vote_average: {
      type: Number,
      default: 0,
    },

    type: {
      type: String,
      enum: ["movie", "show"],
      required: true,
    },

    trailers: [
      {
        seasonNumber: {
          type: Number,
          default: null,
        },

        trailerId: {
          type: String,
          required: true,
        },
      },
    ],
  },
  { timestamps: true },
);

const Movie = mongoose.model("Movie", movieSchema);

export default Movie;
