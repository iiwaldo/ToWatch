import { useEffect, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";

import Navbar from "./NavBar";
import MovieGrid from "./MovieGrid";
import MovieDetailsModal from "./MovieDetailsModal";
import Pagination from "./Pagination";

export default function MovieListPage({ listType }) {
  const BACKEND_URL = import.meta.env.VITE_API_URL;

  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCard, setSelectedCard] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const title =
    listType === "watch-later"
      ? "Watch Later"
      : "Watched";

  const handleCardClick = useCallback((card) => {
    setSelectedCard(card);
  }, []);

  const closeModal = () => {
    setSelectedCard(null);
  };

  const goToPage = (page) => {
    const params = new URLSearchParams(location.search);
    params.set("page", page);

    navigate(`?${params.toString()}`);
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const page = parseInt(params.get("page")) || 1;

    setCurrentPage(page);

    const fetchMovies = async () => {
      if (!user) {
        setCards([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const response = await axios.get(
          `${BACKEND_URL}/api/user/${listType}`,
          {
            params: {
              userEmail: user.email,
              page,
              limit: 20,
            },
          }
        );

        setCards(response.data.movies || []);
        setTotalPages(response.data.totalPages || 1);
      } catch (error) {
        console.error(`Error fetching ${listType}:`, error);
        setCards([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();
  }, [location.search, listType, user, BACKEND_URL]);

  return (
    <>
      <Navbar />

      <main className="movie-page">
        <div className="home-header">
          <h1 className="home-title">{title}</h1>
        </div>

        <MovieGrid
          cards={cards}
          loading={loading}
          onMovieClick={handleCardClick}
        />

        {!loading && totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            goToPage={goToPage}
          />
        )}

        {selectedCard && (
          <MovieDetailsModal
            type={listType}
            setCards={setCards}
            card={selectedCard}
            onClose={closeModal}
            setSelectedCard={setSelectedCard}
            languageMap={{}}
          />
        )}
      </main>
    </>
  );
}