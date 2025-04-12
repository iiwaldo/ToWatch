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

const MovieDetailsModal = ({ card, onClose, type, setCards }) => {
  const id = card.id;
  const [trailerId, setTrailerId] = useState(card.trailerId || null);
  const [showTrailer, setShowTrailer] = useState(false);
  const { user } = useAuth();
  const [watched, isWatched] = useState(false);
  const [saved, isSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [originalIndex, setOriginalIndex] = useState(null);
  const datatype = card.original_title ? "movie" : "show";
  console.log("trailer id=", card.trailerId);
  console.log(card);

  useEffect(() => {
    if (type !== "home") {
      setTrailerId(card.trailerId);
      if (trailerId) {
        setLoading(false);
      }
      if (type === "watch-later") {
        isSaved(true);
      }
      if (type === "watched") {
        isWatched(true);
      }
      console.log("fetch trailer failed", card);
      return;
    }
    const checkStatus = async () => {
      try {
        const response = await axios.get(
          `http://localhost:3000/api/user/movie`,
          { params: { movieID: card.id, userEmail: user.email } }
        );
        isWatched(response.data.isWatched);
        isSaved(response.data.isSaved);
      } catch (error) {
        console.log("error getting status");
      }
    };
    const fetchTrailer = async () => {
      console.log(card.original_title);
      try {
        const response = await axios.get(
          "http://localhost:3000/api/movies/trailer",
          {
            params: {
              original_title: card.original_title || card.original_name,
              original_language: card.original_language,
              release_date: card.release_date || card.first_air_date || null,
              type : datatype,
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
    const data = {
      userEmail: user.email,
      card,
      trailerId,
    };

    if (!saved) {
      try {
        const response = await axios.post(
          `http://localhost:3000/api/user/watch-later`,
          data
        );
        isSaved(true);
        if (type === "watch-later" && originalIndex !== null) {
          setMovies((prevCards) => {
            console.log("card id after adding = ", card.id);
            const updated = [...prevCards];
            updated.splice(originalIndex, 0, card);
            return updated;
          });
          setOriginalIndex(null); // Reset after reinserting
        }
      } catch (error) {
        console.log("Error adding to watched");
      }
    } else {
      try {
        const response = await axios.delete(
          `http://localhost:3000/api/user/watch-later`,
          {
            data,
          }
        );
        isSaved(false);
        if (type === "watch-later") {
          setMovies((prevCards) => {
            console.log("card id before removing = ", card.id);
            const index = prevCards.findIndex((card) => card.id === card.id);
            if (index !== -1) {
              setOriginalIndex(index); // store index before removal
              return prevCards.filter((card) => card.id !== card.id);
            }
            return prevCards;
          });
        }
      } catch (error) {
        console.log("Error removing from watch later");
      }
    }
  };

  const handleWatched = async () => {
    const data = {
      userEmail: user.email,
      card,
      trailerId,
    };

    if (!watched) {
      try {
        const response = await axios.post(
          `http://localhost:3000/api/user/watched`,
          data
        );
        isWatched(true);
        if (type === "watched" && originalIndex !== null) {
          setMovies((prevCards) => {
            console.log("card id after adding = ", card.id);
            const updated = [...prevCards];
            updated.splice(originalIndex, 0, card);
            return updated;
          });
          setOriginalIndex(null); // Reset after reinserting
        }
      } catch (error) {
        console.log("Error adding to watched");
      }
    } else {
      try {
        const response = await axios.delete(
          `http://localhost:3000/api/user/watched`,
          {
            data,
          }
        );
        isWatched(false);
        if (type === "watched") {
          setCards((prevCards) => {
            console.log("movie id before removing = ", card.id);
            const index = prevCards.findIndex((card) => card.id === card.id);
            if (index !== -1) {
              setOriginalIndex(index); // store index before removal
              return prevCards.filter((card) => card.id !== card.id);
            }
            return prevCards;
          });
        }
      } catch (error) {
        console.log("Error removing from watched");
      }
    }
  };

  const renderWatchLaterButton = () => {
    if (saved) {
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
    if (watched) {
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
              src={`https://image.tmdb.org/t/p/w500${card.poster_path}`}
              alt={card.original_title || card.original_name}
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
            <h1>{card.original_title || card.original_name}</h1>
            <p>{card.overview}</p>
            <p>
              <strong>Release Date:</strong> {card.release_date || card.first_air_date}
            </p>
            <p>
              <strong>Rating:</strong> {card.vote_average}
            </p>

            {loading || !trailerId ? (
              <div>Loading trailer...</div>
            ) : (
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
