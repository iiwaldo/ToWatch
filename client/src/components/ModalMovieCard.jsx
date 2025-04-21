import React from "react";
import { useNavigate } from "react-router-dom";
import MovieDetailsModal from "./MovieDetailsModal";

const ModalMovieCard = ({ card, onClose, type, setSelectedCard }) => {
  const navigate = useNavigate();

  const imageURL = card.poster_path
    ? `https://image.tmdb.org/t/p/w200${card.poster_path}`
    : "https://m.media-amazon.com/images/I/61s8vyZLSzL._AC_UF894,1000_QL80_.jpg";

  const handleClick = () => {
    setSelectedCard(card);
  };

  return (
    <div className="actor-card" onClick={handleClick}>
      <img
        src={imageURL}
        alt={card.original_title || card.name}
        className="actor-image"
      />
      <div className="actor-info">
        <h4 className="actor-name">{card.original_title || card.original_name}</h4>
        <p className="actor-character">
          {card.release_date?.split("-")[0] ||
            card.first_air_date?.split("-")[0]}
        </p>
      </div>
    </div>
  );
};

export default React.memo(ModalMovieCard);
