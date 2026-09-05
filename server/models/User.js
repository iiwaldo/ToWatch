import mongoose from "mongoose";

const watchLaterGroupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    movies: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Movie",
      },
    ],
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
      type: mongoose.Schema.Types.ObjectId,
      ref: "Movie",
    },
  ],
});

const User = mongoose.model("User", userSchema);

export default User;
