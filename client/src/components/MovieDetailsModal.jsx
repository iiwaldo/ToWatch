import React, { useMemo, useEffect, useState, useRef } from "react";
import axios from "axios";
import "../styles/modal.css";
import ModalMovieCard from "./ModalMovieCard";
import { useAuth } from "../context/AuthContext";
import {
  FaRegBookmark,
  FaCheckCircle,
  FaRegCheckCircle,
  FaBookmark,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa"; // Import both filled and outlined icons
import ActorCard from "./ActorCard";
import useFetchDetails from "../hooks/useFetchDetails";

const MovieDetailsModal = ({
  card,
  onClose,
  type,
  setCards,
  setSelectedCard,
  languageMap,
}) => {
  const BACKEND_URL = import.meta.env.VITE_API_URL;
  const { user } = useAuth();
  const modalRef = useRef(null);
  const castSectionRef = useRef(null);
  const recommendationSectionRef = useRef(null);
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
    fetchTrailer,
    recommendation,
    providers,
  } = useFetchDetails(card, type);
  const stableCast = useMemo(() => cast, [cast[0]?.id && cast[1]?.id]);
  const stableRecommendation = useMemo(
    () => recommendation,
    [recommendation[0]?.id && recommendation[1]?.id]
  );
  const dataType = card.type || (card.release_date ? "movie" : "show");
  const formatDate = (date) => {
    if (!date) {
      return;
    }
    date = new Date(date);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-indexed
    const year = date.getFullYear();
    let formattedDate = `${day}/${month}/${year}`;
    return formattedDate;
  };

  useEffect(() => {
    if (modalRef.current) {
      modalRef.current.scrollIntoView({ behavior: "smooth" });
    }
    if (castSectionRef.current) {
      castSectionRef.current.scrollLeft = 0;
    }
    if (recommendationSectionRef.current) {
      recommendationSectionRef.current.scrollLeft = 0;
    }
    setTitle(card.original_title || card.original_name);
    setOverview(card.overview);
    setImageUrl(
      card.poster_path
        ? `https://image.tmdb.org/t/p/w500${card.poster_path}`
        : "https://m.media-amazon.com/images/I/61s8vyZLSzL._AC_UF894,1000_QL80_.jpg"
    );
    setDate(formatDate(card.release_date || card.first_air_date));
    setSeasonIndex(0);
    setShowTrailer(false);
    fetchTrailer(card.original_title || card.original_name,card.release_date || card.first_air_date)
  }, [card]);
  const checkStatus = async (statusType) => {
    if (!user) {
      return;
    }
    const data = {
      userEmail: user.email,
      card,
      trailerId,
    };
    if (statusType === "watch-later") {
      if (!isSaved) {
        try {
          const response = await axios.post(
            `${BACKEND_URL}/api/user/watch-later`,
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
            `${BACKEND_URL}/api/user/watch-later`,
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
            `${BACKEND_URL}/api/user/watched`,
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
            `${BACKEND_URL}/api/user/watched`,
            {
              data,
            }
          );
          setIsWatched(false);
          if (type === "watched") {
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
  const [date, setDate] = useState(
    formatDate(card.release_date || card.first_air_date)
  );
  const filteredSeasons = useMemo(
    () => seasonsArr.filter((s) => s.name.toLowerCase() !== "specials"),
    [seasonsArr]
  );
  useEffect(() => {
    if (!seasonsArr.length) {
      setModalLoading(true);
      return;
    }

    const firstSeason = filteredSeasons[0];

    if (seasonsArr.length === 1) {
      setEpisodes(firstSeason.episode_count);
      setModalLoading(true);
      return;
    }
    // More than one season
    setModalLoading(true);
    setEpisodes(firstSeason.episode_count);
    setTitle(card.original_title || card.original_name);
    setDate(formatDate(firstSeason.air_date));
    const tempImage = imageUrl;
    setImageUrl(
      firstSeason.poster_path
        ? `https://image.tmdb.org/t/p/w500${firstSeason.poster_path}`
        : tempImage
    );
    setOverview(firstSeason.overview || card.overview);
  }, [seasonsArr]);

  const [modalLoading, setModalLoading] = useState(
    dataType === "show" ? false : true
  );

  const [episodes, setEpisodes] = useState(null);
  const [overview, setOverview] = useState(card.overview);
  const [title, setTitle] = useState(card.original_title || card.original_name);
  const [seasonIndex, setSeasonIndex] = useState(0);
  const [imageUrl, setImageUrl] = useState(
    card.poster_path
      ? `https://image.tmdb.org/t/p/w500${card.poster_path}`
      : "https://m.media-amazon.com/images/I/61s8vyZLSzL._AC_UF894,1000_QL80_.jpg"
  );

  const handleNextSeason = () => {
    if (seasonIndex < filteredSeasons.length - 1) {
      const newIndex = seasonIndex + 1;
      const baseTitle = card.original_title || card.original_name;
      const newTitle = `${baseTitle} ${newIndex + 1}`;
      const newSeason = filteredSeasons[newIndex];
      setSeasonIndex(newIndex);
      setTitle(newTitle);
      setDate(formatDate(newSeason.air_date));
      const tempImage = imageUrl;
      setImageUrl(
        newSeason.poster_path
          ? `https://image.tmdb.org/t/p/w500${newSeason.poster_path}`
          : tempImage
      );
      setEpisodes(newSeason.episode_count);
      setOverview(newSeason.overview !== "" ? newSeason.overview : overview);
      setShowTrailer(false);
      fetchTrailer(newTitle, newSeason.air_date);
    }
  };

  const handlePrevSeason = () => {
    if (seasonIndex > 0) {
      const newIndex = seasonIndex - 1;
      const baseTitle = card.original_title || card.original_name;
      const newTitle =
        newIndex === 0 ? baseTitle : `${baseTitle} ${newIndex + 1}`;
      const newSeason = filteredSeasons[newIndex];
      setShowTrailer(false);
      setSeasonIndex(newIndex);
      setTitle(newTitle);
      setEpisodes(newSeason.episode_count);
      setDate(formatDate(newSeason.air_date));
      const tempImage = imageUrl;
      setImageUrl(
        newSeason.poster_path
          ? `https://image.tmdb.org/t/p/w500${newSeason.poster_path}`
          : imageUrl
      );
      setOverview(newSeason.overview !== "" ? newSeason.overview : overview);

      fetchTrailer(newTitle, newSeason.air_date); // ✅ using correct title
    }
  };

  return modalLoading ? (
    <div className="movie-details-modal">
      <div className="modal-content animated-glow">
        <button className="close-btn" onClick={onClose}>
          &times;
        </button>

        <div className="modal-body">
          <div className="movie-image">
            <div className="datatype-label">{dataType}</div>

            <img src={imageUrl} alt={title} className="movie-poster" />

            {/* Watch Later and Watched icons */}
            {
              <div className="button-group">
                {/* Previous Season */}
                {dataType === "show" && seasonsArr.length > 1 && (
                  <button
                    onClick={handlePrevSeason}
                    className="icon-btn"
                    disabled={seasonIndex === 0}
                  >
                    <FaChevronLeft />
                  </button>
                )}

                {/* Watch Later */}
                {user && renderWatchLaterButton()}

                {/* Watched */}
                {user && renderWatchedButton()}

                {/* Next Season */}
                {dataType === "show" && seasonsArr.length > 1 && (
                  <button
                    onClick={handleNextSeason}
                    className="icon-btn"
                    disabled={seasonIndex === filteredSeasons.length - 1}
                  >
                    <FaChevronRight />
                  </button>
                )}
              </div>
            }
          </div>

          <div className="movie-description">
            <h1 ref={modalRef}>{title}</h1>
            {providers.map((obj) => (
              <img
                className="provider-logo"
                src={`https://image.tmdb.org/t/p/w500${obj.logo_path}`}
              />
            ))}
            <p>{overview}</p>
            <p>
              <strong>Release Date:</strong> {date}
            </p>

            {/* Show episode count if it's a show and episode data is available */}
            {dataType === "show" && episodes !== null && (
              <p>
                <strong>Episodes:</strong> {episodes}
              </p>
            )}

            <p>
              <strong>Language: </strong>
              {languageMap[card.original_language]}
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
            {stableCast.length > 0 && (
              <div className="cast-section">
                <h3>Cast</h3>
                <div className="cast-list" ref={castSectionRef}>
                  {stableCast.map((actor) => (
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
            {/* Recommendations section */}
            {recommendation.length > 0 && (
              <div className="cast-section">
                <h3>Recommendation</h3>
                <div className="cast-list" ref={recommendationSectionRef}>
                  {recommendation.map((rec) => (
                    <ModalMovieCard
                      key={rec.id}
                      card={rec}
                      type={type} // You can also determine based on `rec.media_type` if needed
                      onClose={onClose}
                      setSelectedCard={setSelectedCard}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  ) : (
    <div className="spinner-container">
      <div className="spinner"></div>
    </div>
  );
};

export default MovieDetailsModal;
