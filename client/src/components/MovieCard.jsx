import "../styles/moviecard.css";
import { useNavigate } from "react-router-dom";
import React from "react";

const MovieCard = ({ card, onClick }) => {
  const imageUrl = card.poster_path
    ? `https://image.tmdb.org/t/p/w500${card.poster_path}`
    : "https://m.media-amazon.com/images/I/61s8vyZLSzL._AC_UF894,1000_QL80_.jpg";
  return (
    <div className="movie-card" onClick={() => onClick(card)}>
      <img
        src={imageUrl} // TMDB image URL
        alt={card.title}
        className="movie-poster"
      />
      <h3 className="movie-title">
        {card.original_title || card.original_name}
      </h3>{" "}
      {/* Add the movie title */}
      <p className="movie-date">
        {card.release_date?.split("-")[0] || card.first_air_date?.split("-")[0]}
      </p>
    </div>
  );
};

export default React.memo(MovieCard);
