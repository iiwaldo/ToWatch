import mongoose from "mongoose";

const watchLaterMovieSchema = new mongoose.Schema(
  {
    movie: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Movie",
      required: true,
    },

    savedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: false,
  },
);

const watchLaterGroupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    movies: [watchLaterMovieSchema],
  },
  {
    _id: true,
  },
);

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },

  password: {
    type: String,
    required: true,
  },

  profilePicture: {
    type: String,
    default: null,
  },

  watchLaterGroups: {
    type: [watchLaterGroupSchema],
    default: () => [
      {
        name: "All",
        movies: [],
      },
    ],
  },

  moviesWatched: [
    {
      movie: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Movie",
        required: true,
      },

      watchedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
});

const User = mongoose.model("User", userSchema);

export default User;