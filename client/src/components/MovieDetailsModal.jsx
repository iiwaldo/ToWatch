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
import ActorCard from "./ActorCard";
import useFetchDetails from "../hooks/useFetchDetails";

const MovieDetailsModal = ({ card, onClose, type, setCards }) => {
  const { user } = useAuth();
  const [originalIndex, setOriginalIndex] = useState(null);
  const [showTrailer, setShowTrailer] = useState(false);
  const {
    trailerId,
    isWatched,
    isSaved,
    setIsSaved,
    setIsWatched,
    cast,
    numberOfSeasons,
    seasonsArr,
    loading,
  } = useFetchDetails(card, type);
  const dataType = card.type || (card.release_date ? "movie" : "show");
  const imageUrl = card.poster_path
    ? `https://image.tmdb.org/t/p/w500${card.poster_path}`
    : "https://m.media-amazon.com/images/I/61s8vyZLSzL._AC_UF894,1000_QL80_.jpg";
  let date = card.release_date || card.first_air_date;
  let formattedDate = null;
  if (date) {
    date = new Date(date);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-indexed
    const year = date.getFullYear();
    formattedDate = `${day}/${month}/${year}`;
  }
  const checkStatus = async (statusType) => {
    const data = {
      userEmail: user.email,
      card,
      trailerId,
    };
    if (statusType === "watch-later") {
      if (!isSaved) {
        try {
          const response = await axios.post(
            `http://localhost:3000/api/user/watch-later`,
            data
          );
          setIsSaved(true);
          if (type === "watch-later" && originalIndex !== null) {
            setCards((prevCards) => {
              const updated = [...prevCards];
              updated.splice(originalIndex, 0, card);
              return updated;
            });
            setOriginalIndex(null); // Reset after reinserting
          }
        } catch (error) {
          console.log("Error adding to watch later");
          setIsSaved(false);
        }
      }
      //else
      else {
        try {
          const response = await axios.delete(
            `http://localhost:3000/api/user/watch-later`,
            {
              data,
            }
          );
          setIsSaved(false);
          if (type === "watch-later") {
            setCards((prevCards) => {
              const index = prevCards.findIndex((c) => c.id === card.id);
              if (index !== -1) {
                setOriginalIndex(index); // store index before removal
                return prevCards.filter((c) => c.id !== card.id);
              }
              return prevCards;
            });
          }
        } catch (error) {
          console.log("Error removing from watch later", error);
          setIsSaved(true);
        }
      }
    } else if (statusType === "watched") {
      if (!isWatched) {
        try {
          const response = await axios.post(
            `http://localhost:3000/api/user/watched`,
            data
          );
          setIsWatched(true);
          if (type === "watched" && originalIndex !== null) {
            setCards((prevCards) => {
              const updated = [...prevCards];
              updated.splice(originalIndex, 0, card);
              return updated;
            });
            setOriginalIndex(null);
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
          setIsWatched(false);
          if (type === "watched") {
            setCards((prevCards) => {
              console.log("movie id before removing = ", card.id);
              const index = prevCards.findIndex((c) => c.id === card.id);
              if (index !== -1) {
                setOriginalIndex(index); // store index before removal
                return prevCards.filter((c) => c.id !== card.id);
              }
              return prevCards;
            });
          }
        } catch (error) {
          console.log("Error removing from watched");
        }
      }
    }
  };
  const handleWatchLater = async () => {
    checkStatus("watch-later");
  };

  const handleWatched = async () => {
    checkStatus("watched");
  };

  const renderWatchLaterButton = () => {
    if (isSaved) {
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
    if (isWatched) {
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
            <div className="datatype-label">{dataType}</div>

            <img
              src={imageUrl}
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
              <strong>Release Date:</strong> {formattedDate}
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
            {/* Add the cast section */}
            {cast.length > 0 && (
              <div className="cast-section">
                <h3>Cast</h3>
                <div className="cast-list">
                  {cast.map((actor) => (
                    <ActorCard
                      key={actor.id}
                      type={type}
                      actor={actor}
                      onClose={onClose}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieDetailsModal;
