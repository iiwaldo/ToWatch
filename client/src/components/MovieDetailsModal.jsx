import React, { useEffect, useState } from "react";
import axios from "axios";
import "../styles/modal.css";
import { useAuth } from "../context/AuthContext";
import Button from "./Button";
import { FaRegBookmark, FaCheckCircle } from "react-icons/fa"; // FontAwesome icons

const MovieDetailsModal = ({ movie, onClose }) => {
  const id = movie.id;
  const [trailerId, setTrailerId] = useState(null);
  const [showTrailer, setShowTrailer] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const fetchTrailer = async () => {
      try {
        const response = await axios.get(
          `http://localhost:3000/api/movies/${id}`
        );
        setTrailerId(response.data.trailerId);
      } catch (error) {
        console.error("Error fetching trailer", error);
      }
    };

    if (id) {
      fetchTrailer();
    }
  }, [id]);

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
                <button className="icon-btn">
                  <FaRegBookmark size={24} />
                </button>
                <button className="icon-btn">
                  <FaCheckCircle size={24} />
                </button>
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

            {trailerId && !showTrailer && (
              <button onClick={() => setShowTrailer(true)}>
                Watch Trailer
              </button>
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
