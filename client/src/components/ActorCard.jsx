import React from "react";
import axios from "axios";


const ActorCard = ({actor}) => {
    const handleActorClick = (actor) => {
        console.log(actor.id);
        
    };
    return (
        <div className="actor-card">
          <img
            src={
              actor.profile_path
                ? `https://image.tmdb.org/t/p/w200${actor.profile_path}`
                : "/placeholder-actor.jpg" // fallback image
            }
            alt={actor.name}
            className="actor-image"
          />
          <div className="actor-info" onClick={() => handleActorClick(actor)}>
            <h4 className="actor-name">{actor.name}</h4>
            <p className="actor-character">{actor.character}</p>
          </div>
        </div>
      );
    };

export default ActorCard;