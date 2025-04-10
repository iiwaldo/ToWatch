import "../styles/moviecard.css";
import { useNavigate } from "react-router-dom";

const MovieCard = ({ movie, onClick }) => {
  return (
    <div className="movie-card" onClick={() => onClick(movie)}>
      <img
        src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`} // TMDB image URL
        alt={movie.title}
        className="movie-poster"
      />
      <h3 className="movie-title">{movie.title}</h3> {/* Add the movie title */}
    </div>
  );
};

export default MovieCard;
