import { useEffect, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Navbar from "../components/NavBar";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import MovieCard from "../components/MovieCard";
import MovieDetailsModal from "../components/MovieDetailsModal";
import Pagination from "../components/Pagination";
import FilterModal from "../components/FilterModal";
import "../styles/moviecard.css";
import { FaSortUp, FaSortDown } from "react-icons/fa";
import { genreMap } from "../utils/genreMap";
import { languageMap } from "../utils/languageMap";
import MovieGrid from "../components/MovieGrid";

export default function Home({ type }) {
  const BACKEND_URL = import.meta.env.VITE_API_URL;
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [cards, setCards] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedCard, setSelectedCard] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState("Popular Movies");
  const [search, setSearch] = useState(false);
  const [isFilter, setIsFilter] = useState(false);
  const [genreNames, setGenreNames] = useState([]);
  const [actorFilter, setActorFilter] = useState(false);
  const [sortOrder, setSortOrder] = useState("desc");
  const [actorArr, setActorArr] = useState([]);
  const location = useLocation();
  const navigate = useNavigate();

  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"));
  };

  const handleCardClick = useCallback((card) => {
    setSelectedCard(card);
    setShowModal(true);
  }, []);

  const closeModal = () => {
    setShowModal(false);
    setSelectedCard(null);
    if (isFilter) {
      setIsFilter(false);
    }
  };

  const onFilterClick = () => {
    setIsFilter((prev) => !prev);
    setShowModal(true);
  };

  const goToPage = (page) => {
    const params = new URLSearchParams(location.search);
    const searchQuery = params.get("search");
    const filterQuery = params.get("filter");

    if (filterQuery) {
      navigate(`?filter=${encodeURIComponent(filterQuery)}&page=${page}`);
    } else {
      navigate(`?page=${page}`);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const page = parseInt(params.get("page")) || 1;
    const searchQuery = params.get("search");
    const filterQuery = params.get("filter");

    setSearch(false);
    setIsFilter(false);
    setCurrentPage(page);
    setActorFilter(false);
    setActorArr([]);

    const fetchMovies = async () => {
      try {
        if (filterQuery && type === "home") {
          const decodedFilter = decodeURIComponent(filterQuery);
          const filterParams = new URLSearchParams(decodedFilter);
          const actorID = filterParams.get("actorID");

          if (actorID) {
            const actorName = filterParams.get("actorName") || "Actor";
            const response = await axios.get(
              `${BACKEND_URL}/api/details/combined_credits`,
              { params: { actorID } },
            );

            const credits = response.data || [];
            const uniqueCredits = Array.from(
              new Map(credits.map((item) => [item.id, item])).values(),
            );
            const sortedCredits = uniqueCredits.sort((a, b) => {
              const dateA = new Date(a.release_date || a.first_air_date || 0);
              const dateB = new Date(b.release_date || b.first_air_date || 0);
              return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
            });

            setCards(sortedCredits);
            setLoading(false);
            setTitle(actorName);
            setActorFilter(true);
          } else {
            const type = filterParams.get("type") || "movie";
            const sortOrder = filterParams.get("sortOrder") || "desc";
            const genres = filterParams.get("genres")?.split(",") || [];
            const year = filterParams.get("year");
            const language = filterParams.get("language");
            const langName = languageMap[language] || "English";

            setGenreNames(genres);
            const genreText = genres
              .map((id) => genreMap[id] || id)
              .join(" - ");
            const capitalizedType =
              type.charAt(0).toUpperCase() + type.slice(1);
            setTitle(
              `${langName} ${year || ""} ${genreText} ${capitalizedType}'s`,
            );

            const response = await axios.get(
              `${BACKEND_URL}/api/details/filter`,
              {
                params: {
                  year,
                  language,
                  page,
                  genres: genres.join(","),
                  sortOrder,
                  type,
                },
              },
            );

            setCards(response.data.results || []);
            setTotalPages(response.data.total_pages || 1);
            setLoading(false);
          }
        } else if (searchQuery && type === "home") {
          setSearch(true);
          setCards([]);
          setLoading(false);

          const movieRes = await axios.get(
            `${BACKEND_URL}/api/details/search/movie`,
            {
              params: { query: searchQuery },
            },
          );

          const tvRes = await axios.get(
            `${BACKEND_URL}/api/details/search/tv`,
            {
              params: { query: searchQuery },
            },
          );

          const combined = [
            ...(movieRes.data || []),
            ...(tvRes.data || []),
          ].sort((a, b) => (b.popularity || 0) - (a.popularity || 0));

          setCards(combined);
          setLoading(false);
          setTotalPages(1); // Disable pagination for search
          setTitle(`Search Results for "${searchQuery}"`);
        } else if (type === "home") {
          const response = await axios.get(
            `${BACKEND_URL}/api/details/popular`,
            {
              params: { page, limit: 20 },
            },
          );
          const data = response.data;
          setCards(data.movies || []);
          setLoading(false);
          setTotalPages(data.totalPages || 1);
          setTitle("Popular Movies");
        } else if (type === "watch-later" && user) {
          const response = await axios.get(
            `${BACKEND_URL}/api/user/watch-later`,
            {
              params: { userEmail: user.email, page, limit: 20 },
            },
          );
          setTitle("Watch Later");
          setCards(response.data.movies || []);
          setLoading(false);
          setTotalPages(response.data.totalPages || 1);
        } else if (type === "watched" && user) {
          const response = await axios.get(`${BACKEND_URL}/api/user/watched`, {
            params: { userEmail: user.email, page, limit: 20 },
          });
          setTitle("My Watched Movies");
          setCards(response.data.movies || []);
          setLoading(false);
          setTotalPages(response.data.totalPages || 1);
        }
      } catch (error) {
        console.error("Error fetching movies:", error);
        setCards([]);
      }
    };

    fetchMovies();
  }, [location.search, type, user, sortOrder]);

  return loading ? (
    <div className="spinner-container">
      <div className="spinner-content">
        <div className="spinner"></div>
        <h2 className="loading-text">Please wait until Loading is done....</h2>
      </div>
    </div>
  ) : (
    <div>
      <Navbar />
      <div className="con">
        <div className="home-container">
          <div className="home-header">
            <h1 className="home-title">{title}</h1>

            {type === "home" && !search && !actorFilter && (
              <button onClick={onFilterClick} className="filter-button">
                Filter
              </button>
            )}

            {actorFilter && (
              <div className="sort-icons-container">
                <button onClick={toggleSortOrder} className="sort-icon-button">
                  {sortOrder === "desc" ? <FaSortDown /> : <FaSortUp />}
                </button>
              </div>
            )}
          </div>

          <MovieGrid
            cards={cards}
            loading={loading}
            onMovieClick={handleCardClick}
          />

          {!actorFilter && !search && totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              goToPage={goToPage}
            />
          )}

          {showModal && selectedCard && (
            <MovieDetailsModal
              type={type}
              setCards={setCards}
              card={selectedCard}
              onClose={closeModal}
              setSelectedCard={setSelectedCard}
              languageMap={languageMap}
            />
          )}

          {showModal && isFilter && (
            <FilterModal onClose={closeModal} setGenreNames={setGenreNames} />
          )}
        </div>
      </div>
    </div>
  );
}
