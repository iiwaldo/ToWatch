import MovieCard from "./MovieCard";

export default function MovieGrid({
  cards,
  loading,
  onMovieClick,
}) {
  if (loading) {
    return <div>Loading...</div>;
  }

  if (!cards || cards.length === 0) {
    return (
      <div className="empty-state">
        <h2>No movies found</h2>
      </div>
    );
  }

  return (
    <div className="movie-cards-container">
      {cards.map((card) => (
        <MovieCard
          key={`${card.media_type || "movie"}-${card.id}`}
          card={card}
          onClick={onMovieClick}
        />
      ))}
    </div>
  );
}