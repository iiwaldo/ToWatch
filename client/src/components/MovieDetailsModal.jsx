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
} from "react-icons/fa";

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

  // Controls whether YouTube iframe is visible
  const [showTrailer, setShowTrailer] = useState(false);

  // Controls "No trailer available"
  const [noTrailer, setNoTrailer] = useState(false);

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

  const stableCast = useMemo(() => cast, [cast]);

  const stableRecommendation = useMemo(() => recommendation, [recommendation]);

  const dataType = card.type || (card.release_date ? "movie" : "show");

  // ----------------------------------------
  // Format date
  // ----------------------------------------
  const formatDate = (date) => {
    if (!date) {
      return "";
    }

    date = new Date(date);

    const day = String(date.getDate()).padStart(2, "0");

    const month = String(date.getMonth() + 1).padStart(2, "0");

    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  };

  // ----------------------------------------
  // State
  // ----------------------------------------
  const [date, setDate] = useState(
    formatDate(card.release_date || card.first_air_date),
  );

  const [modalLoading, setModalLoading] = useState(
    dataType === "show" ? false : true,
  );

  const [episodes, setEpisodes] = useState(null);

  const [overview, setOverview] = useState(card.overview);

  const [title, setTitle] = useState(card.original_title || card.original_name);

  const [seasonIndex, setSeasonIndex] = useState(0);

  const [imageUrl, setImageUrl] = useState(
    card.poster_path
      ? `https://image.tmdb.org/t/p/w500${card.poster_path}`
      : "https://m.media-amazon.com/images/I/61s8vyZLSzL._AC_UF894,1000_QL80_.jpg",
  );

  // ----------------------------------------
  // Remove "Specials"
  // ----------------------------------------
  const filteredSeasons = useMemo(
    () => seasonsArr.filter((s) => s.name.toLowerCase() !== "specials"),
    [seasonsArr],
  );

  // ----------------------------------------
  // When card changes
  // ----------------------------------------
  useEffect(() => {
    if (modalRef.current) {
      modalRef.current.scrollIntoView({
        behavior: "smooth",
      });
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
        : "https://m.media-amazon.com/images/I/61s8vyZLSzL._AC_UF894,1000_QL80_.jpg",
    );

    setDate(formatDate(card.release_date || card.first_air_date));

    setSeasonIndex(0);

    // Reset trailer state
    setShowTrailer(false);
    setNoTrailer(false);
  }, [card]);

  // ----------------------------------------
  // When TV seasons arrive
  // ----------------------------------------
  useEffect(() => {
    if (!seasonsArr.length) {
      setModalLoading(true);
      return;
    }

    const firstSeason = filteredSeasons[0];

    if (!firstSeason) {
      return;
    }

    if (seasonsArr.length === 1) {
      setEpisodes(firstSeason.episode_count);

      setModalLoading(true);
      return;
    }

    setModalLoading(true);

    setEpisodes(firstSeason.episode_count);

    setTitle(card.original_title || card.original_name);

    setDate(formatDate(firstSeason.air_date));

    const tempImage = imageUrl;

    setImageUrl(
      firstSeason.poster_path
        ? `https://image.tmdb.org/t/p/w500${firstSeason.poster_path}`
        : tempImage,
    );

    setOverview(firstSeason.overview || card.overview);
  }, [seasonsArr]);

  // ----------------------------------------
  // Watch Later / Watched
  // ----------------------------------------
  const checkStatus = async (statusType) => {
    if (!user) {
      return;
    }

    const data = {
      userEmail: user.email,
      card,
      trailerId,
    };

    // ----------------------------------------
    // WATCH LATER
    // ----------------------------------------
    if (statusType === "watch-later") {
      if (!isSaved) {
        try {
          await axios.post(`${BACKEND_URL}/api/user/watch-later`, data);

          setIsSaved(true);

          if (type === "watch-later" && originalIndex !== null) {
            setCards((prevCards) => {
              const updated = [...prevCards];

              updated.splice(originalIndex, 0, card);

              return updated;
            });

            setOriginalIndex(null);
          }
        } catch (error) {
          console.log("Error adding to watch later");

          setIsSaved(false);
        }
      } else {
        try {
          await axios.delete(`${BACKEND_URL}/api/user/watch-later`, {
            data,
          });

          setIsSaved(false);

          if (type === "watch-later") {
            setCards((prevCards) => {
              const index = prevCards.findIndex((c) => c.id === card.id);

              if (index !== -1) {
                setOriginalIndex(index);

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
    }

    // ----------------------------------------
    // WATCHED
    // ----------------------------------------
    else if (statusType === "watched") {
      if (!isWatched) {
        try {
          await axios.post(`${BACKEND_URL}/api/user/watched`, data);

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
          await axios.delete(`${BACKEND_URL}/api/user/watched`, {
            data,
          });

          setIsWatched(false);

          if (type === "watched") {
            setCards((prevCards) => {
              const index = prevCards.findIndex((c) => c.id === card.id);

              if (index !== -1) {
                setOriginalIndex(index);

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
    await checkStatus("watch-later");
  };

  const handleWatched = async () => {
    await checkStatus("watched");
  };

  // ----------------------------------------
  // Watch Later button
  // ----------------------------------------
  const renderWatchLaterButton = () => {
    if (isSaved) {
      return (
        <button onClick={handleWatchLater} className="icon-btn active">
          <FaBookmark size={24} />
        </button>
      );
    }

    return (
      <button onClick={handleWatchLater} className="icon-btn">
        <FaRegBookmark size={24} />
      </button>
    );
  };

  // ----------------------------------------
  // Watched button
  // ----------------------------------------
  const renderWatchedButton = () => {
    if (isWatched) {
      return (
        <button onClick={handleWatched} className="icon-btn active">
          <FaCheckCircle size={24} />
        </button>
      );
    }

    return (
      <button onClick={handleWatched} className="icon-btn">
        <FaRegCheckCircle size={24} />
      </button>
    );
  };

  // ----------------------------------------
  // Next season
  //
  // IMPORTANT:
  // Does NOT fetch trailer.
  // ----------------------------------------
  const handleNextSeason = () => {
    if (seasonIndex < filteredSeasons.length - 1) {
      const newIndex = seasonIndex + 1;

      const newSeason = filteredSeasons[newIndex];

      const baseTitle = card.original_title || card.original_name;

      const newTitle = `${baseTitle} ${newIndex + 1}`;

      setSeasonIndex(newIndex);

      setTitle(newTitle);

      setDate(formatDate(newSeason.air_date));

      const tempImage = imageUrl;

      setImageUrl(
        newSeason.poster_path
          ? `https://image.tmdb.org/t/p/w500${newSeason.poster_path}`
          : tempImage,
      );

      setEpisodes(newSeason.episode_count);

      setOverview(newSeason.overview !== "" ? newSeason.overview : overview);

      // Hide trailer
      setShowTrailer(false);

      // Reset no-trailer message
      setNoTrailer(false);
    }
  };

  // ----------------------------------------
  // Previous season
  //
  // IMPORTANT:
  // Does NOT fetch trailer.
  // ----------------------------------------
  const handlePrevSeason = () => {
    if (seasonIndex > 0) {
      const newIndex = seasonIndex - 1;

      const newSeason = filteredSeasons[newIndex];

      const baseTitle = card.original_title || card.original_name;

      const newTitle =
        newIndex === 0 ? baseTitle : `${baseTitle} ${newIndex + 1}`;

      setShowTrailer(false);

      setNoTrailer(false);

      setSeasonIndex(newIndex);

      setTitle(newTitle);

      setEpisodes(newSeason.episode_count);

      setDate(formatDate(newSeason.air_date));

      const tempImage = imageUrl;

      setImageUrl(
        newSeason.poster_path
          ? `https://image.tmdb.org/t/p/w500${newSeason.poster_path}`
          : tempImage,
      );

      setOverview(newSeason.overview !== "" ? newSeason.overview : overview);
    }
  };

  // ----------------------------------------
  // WATCH TRAILER
  // ----------------------------------------
  const handleWatchTrailer = async () => {
    // Reset old message
    setNoTrailer(false);

    const seasonNumber =
      dataType === "show" ? filteredSeasons[seasonIndex]?.season_number : null;

    const trailer = await fetchTrailer(seasonNumber);

    if (trailer) {
      // Trailer exists
      setShowTrailer(true);
      setNoTrailer(false);
    } else {
      // No trailer exists
      setShowTrailer(false);
      setNoTrailer(true);
    }
  };

  return modalLoading ? (
    <div className="movie-details-modal">
      <div className="modal-content animated-glow">
        <button className="close-btn" onClick={onClose}>
          &times;
        </button>

        <div className="modal-body">
          {/* -------------------------------- */}
          {/* IMAGE */}
          {/* -------------------------------- */}

          <div className="movie-image">
            <div className="datatype-label">{dataType}</div>

            <img src={imageUrl} alt={title} className="movie-poster" />

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
          </div>

          {/* -------------------------------- */}
          {/* DESCRIPTION */}
          {/* -------------------------------- */}

          <div className="movie-description">
            <h1 ref={modalRef}>{title}</h1>

            {/* Providers */}
            {providers.map((obj) => (
              <img
                key={obj.provider_id || obj.logo_path}
                className="provider-logo"
                src={`https://image.tmdb.org/t/p/w500${obj.logo_path}`}
                alt={obj.provider_name || "Provider"}
              />
            ))}

            <p>{overview}</p>

            <p>
              <strong>Release Date:</strong> {date}
            </p>

            {/* Episodes */}
            {dataType === "show" && episodes !== null && (
              <p>
                <strong>Episodes:</strong> {episodes}
              </p>
            )}

            <p>
              <strong>Language:</strong> {languageMap[card.original_language]}
            </p>

            <p>
              <strong>Rating:</strong> {card.vote_average}
            </p>

            {/* -------------------------------- */}
            {/* TRAILER BUTTON */}
            {/* -------------------------------- */}

            {!showTrailer && !noTrailer && (
              <button onClick={handleWatchTrailer} disabled={loading}>
                {loading ? "Loading trailer..." : "Watch Trailer"}
              </button>
            )}

            {/* -------------------------------- */}
            {/* NO TRAILER */}
            {/* -------------------------------- */}

            {noTrailer && !loading && (
              <div className="no-trailer-message">
                No trailer available at the moment.
              </div>
            )}

            {/* -------------------------------- */}
            {/* TRAILER */}
            {/* -------------------------------- */}

            {showTrailer && trailerId && (
              <div className="trailer-container">
                <iframe
                  width="100%"
                  height="315"
                  src={`https://www.youtube.com/embed/${trailerId.key}`}
                  title="YouTube video player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
            )}

            {/* -------------------------------- */}
            {/* CAST */}
            {/* -------------------------------- */}

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

            {/* -------------------------------- */}
            {/* RECOMMENDATIONS */}
            {/* -------------------------------- */}

            {stableRecommendation.length > 0 && (
              <div className="cast-section">
                <h3>Recommendation</h3>

                <div className="cast-list" ref={recommendationSectionRef}>
                  {stableRecommendation.map((rec) => (
                    <ModalMovieCard
                      key={rec.id}
                      card={rec}
                      type={type}
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
