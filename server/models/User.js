import mongoose from "mongoose";

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
  moviesSaved: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Movie", // Reference to the Movie model
    },
  ],
  moviesWatched: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Movie", // Reference to the Movie model
    },
  ],
});

// Creating the User model
const User = mongoose.model("User", userSchema);
export default User;
