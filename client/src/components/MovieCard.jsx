import "../styles/moviecard.css";
import { useNavigate } from "react-router-dom";

const MovieCard = ({ card, onClick }) => {
  return (
    <div className="movie-card" onClick={() => onClick(card)}>
      <img
        src={`https://image.tmdb.org/t/p/w500${card.poster_path}`} // TMDB image URL
        alt={card.title}
        className="movie-poster"
      />
      <h3 className="movie-title">{card.original_title || card.original_name}</h3> {/* Add the movie title */}
    </div>
  );
};

export default MovieCard;
