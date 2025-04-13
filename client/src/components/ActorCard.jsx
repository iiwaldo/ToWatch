import React from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const ActorCard = ({ actor,onClose }) => {
  const navigate = useNavigate();
  const imageURL = actor.profile_path ?`https://image.tmdb.org/t/p/w200${actor.profile_path}` : "https://m.media-amazon.com/images/I/61s8vyZLSzL._AC_UF894,1000_QL80_.jpg";
  const handleActorClick = async (actor) => {
    console.log(actor.id);
    const filterParams = new URLSearchParams({
      actorID: actor.id,
      actorName : actor.name
    });
    navigate(`?filter=${encodeURIComponent(filterParams.toString())}&page=1`);
    onClose();
  };
  return (
    <div className="actor-card" onClick={() => handleActorClick(actor)}>
      <img
        src={
          imageURL
        }
        alt={actor.name}
        className="actor-image"
      />
      <div className="actor-info">
        <h4 className="actor-name">{actor.name}</h4>
        <p className="actor-character">{actor.character}</p>
      </div>
    </div>
  );
};

export default ActorCard;
