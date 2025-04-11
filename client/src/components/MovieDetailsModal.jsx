import React, { useEffect, useState } from "react";
import axios from "axios";
import "../styles/modal.css";
import { useAuth } from "../context/AuthContext";
import {
  FaRegBookmark,
  FaCheckCircle,
  FaRegCheckCircle,
  FaBookmark,
} from "react-icons/fa"; // Import both filled and outlined icons

const MovieDetailsModal = ({ movie, onClose, type }) => {
  const id = movie.id;
  const [trailerId, setTrailerId] = useState(null);
  const [showTrailer, setShowTrailer] = useState(false);
  const { user } = useAuth();
  const [watched, isWatched] = useState(false);
  const [saved, isSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  console.log(movie);

  useEffect(() => {
    if(movie.trailerId) {
      setLoading(false);
    }
    if (type !== "home") {
      setTrailerId(movie.trailerId);
      console.log("fetch trailer failed", movie);
      return;
    }
    const checkStatus = async () => {
      try {
        const response = await axios.get(
          `http://localhost:3000/api/user/movie`,
          { params: { movieID: movie.id, userEmail: user.email } }
        );
        isWatched(response.data.isWatched);
        isSaved(response.data.isSaved);
      } catch (error) {
        console.log("error getting status");
      }
    };
    const fetchTrailer = async () => {
      console.log(movie.original_title);
      try {
        const response = await axios.get(
          "http://localhost:3000/api/movies/trailer",
          {
            params: {
              original_title: movie.original_title,
              original_language: movie.original_language,
              release_date: movie.release_date,
            },
          }
        );
        console.log(response.data);
        setTrailerId(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching trailer", error);
      }
    };

    if (id) {
      fetchTrailer();
      checkStatus();
    }
  }, [id, type]);

  const handleWatchLater = async () => {
    console.log(user);
    const data = {
      userEmail: user.email,
      movie: movie,
      trailerId: trailerId,
    };
    try {
      const response = await axios.post(
        `http://localhost:3000/api/user/watch-later`,
        data
      );

      isSaved((prev) => !prev);
    } catch (error) {
      console.log("Error adding to watch later");
    }
  };

  const handleWatched = async () => {
    console.log(user);
    const data = {
      userEmail: user.email,
      movie: movie,
      trailerId: trailerId,
    };
    try {
      const response = await axios.post(
        `http://localhost:3000/api/user/watched`,
        data
      );
      isWatched((prev) => !prev);
    } catch (error) {
      console.log("Error marking as watched");
    }
  };

  const renderWatchLaterButton = () => {
    if (type === "watch-later" || saved) {
      return (
        <button onClick={handleWatchLater} className="icon-btn active">
          <FaBookmark size={24} />
        </button>
      );
    } else {
      return (
        <button onClick={handleWatchLater} className="icon-btn">
          <FaRegBookmark size={24} />
        </button>
      );
    }
  };

  const renderWatchedButton = () => {
    if (type === "watched" || watched) {
      return (
        <button onClick={handleWatched} className="icon-btn active">
          <FaCheckCircle size={24} />
        </button>
      );
    } else {
      return (
        <button onClick={handleWatched} className="icon-btn">
          <FaRegCheckCircle size={24} />
        </button>
      );
    }
  };

  return (
    <div className="movie-details-modal">
      <div className="modal-content animated-glow">
        <button className="close-btn" onClick={onClose}>
          &times;
        </button>

        <div className="modal-body">
          <div className="movie-image">
            <img
              src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
              alt={movie.title}
              className="movie-poster"
            />
            {/* Watch Later and Watched icons */}
            {user && (
              <div className="button-group">
                {renderWatchLaterButton()}
                {renderWatchedButton()}
              </div>
            )}
          </div>

          <div className="movie-description">
            <h1>{movie.title}</h1>
            <p>{movie.overview}</p>
            <p>
              <strong>Release Date:</strong> {movie.release_date}
            </p>
            <p>
              <strong>Rating:</strong> {movie.vote_average}
            </p>

            {loading ? (
              <div>Loading trailer...</div>
            ) : (
              trailerId &&
              !showTrailer && (
                <button onClick={() => setShowTrailer(true)}>
                  Watch Trailer
                </button>
              )
            )}

            {showTrailer && (
              <div className="trailer-container">
                <iframe
                  width="100%"
                  height="315"
                  src={`https://www.youtube.com/embed/${trailerId}?autoplay=1`}
                  title="YouTube video player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieDetailsModal;
