import React from "react";
import "../styles/modal.css";

const MovieDetailsModal = ({ movie, onClose }) => {
  return (
    <div className="movie-details-modal">
      <div className="modal-content animated-glow">
        <button className="close-btn" onClick={onClose}>&times;</button>
        
        <div className="modal-body">
          <div className="movie-image">
            <img
              src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
              alt={movie.title}
              className="movie-poster"
            />
          </div>

          <div className="movie-description">
            <h1>{movie.title}</h1>
            <p>{movie.overview}</p>
            <p><strong>Release Date:</strong> {movie.release_date}</p>
            <p><strong>Rating:</strong> {movie.vote_average}</p>

            {movie.trailerId && (
              <button 
                onClick={() => window.open(`https://www.youtube.com/watch?v=${movie.trailerId}`, "_blank")}
              >
                Watch Trailer
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieDetailsModal;
