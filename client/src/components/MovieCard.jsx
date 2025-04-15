import "../styles/moviecard.css";
import { useNavigate } from "react-router-dom";
import React from "react";

const MovieCard = ({ card, onClick }) => {
  console.log("im re-rendered from movieCard");
  const imageUrl = card.poster_path ? `https://image.tmdb.org/t/p/w500${card.poster_path}` : "https://m.media-amazon.com/images/I/61s8vyZLSzL._AC_UF894,1000_QL80_.jpg";
  return (
    <div className="movie-card" onClick={() => onClick(card)}>
      <img
        src={imageUrl} // TMDB image URL
        alt={card.title}
        className="movie-poster"
      />
      <h3 className="movie-title">{card.original_title || card.original_name}</h3> {/* Add the movie title */}
    </div>
  );
};

export default React.memo(MovieCard);
