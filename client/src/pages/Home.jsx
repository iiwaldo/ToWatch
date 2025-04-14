import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Navbar from "../components/NavBar";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import MovieCard from "../components/MovieCard";
import MovieDetailsModal from "../components/MovieDetailsModal";
import Pagination from "../components/Pagination";
import FilterModal from "../components/FilterModal";
import "../styles/moviecard.css";
export default function Home({ type }) {
  const { user } = useAuth();
  const [cards, setCards] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedCard, setSelectedCard] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState("Popular Movies");
  const [search, isSearch] = useState(false);
  const [isFilter, setIsFilter] = useState(false);
  const [genreNames, setGenreNames] = useState([]);
  const location = useLocation();
  const navigate = useNavigate();
  const [actorFilter, setActorFilter] = useState(false);
  const [showDropMenu, setShowDropMenu] = useState(false);
  const [sortOrder, setSortOrder] = useState("desc"); //new first
  const [actorArr, setActorArr] = useState([]);
  console.log(cards);

  const toggleSortMenu = () => {
    setShowDropMenu((prev) => !prev);
  };

  const handleSortChange = (order) => {
    setSortOrder(order);
    setShowDropMenu(false); // Close dropdown after selection
  };
  const handleCardClick = (card) => {
    setSelectedCard(card);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedCard(null);
    if (isFilter) {
      setIsFilter(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const page = parseInt(params.get("page")) || 1;
    const searchQuery = params.get("search");
    const filterQuery = params.get("filter");
    isSearch(false);
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
            const response = await axios.get(
              "http://localhost:3000/api/details/combined_credits",
              {
                params: { actorID: actorID },
              }
            );
            setActorFilter(true);
            const actorName = filterParams.get("actorName");
            const credits = response.data;
            const uniqueCredits = Array.from(
              new Map(credits.map((item) => [item.id, item])).values()
            );

            const sortedCredits = uniqueCredits.sort((a, b) => {
              const dateA = new Date(a.release_date || a.first_air_date || 0);
              const dateB = new Date(b.release_date || b.first_air_date || 0);
              return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
            });
            console.log(credits);
            setCards(sortedCredits);
            setTitle(actorName);
          } else {
            const type = filterParams.get("type");
            const sortOrder = filterParams.get("sortOrder");
            const genres = filterParams.get("genres")
              ? filterParams.get("genres").split(",")
              : [];
            const year = filterParams.get("year");
            const language = filterParams.get("language");
            const genreNamesToDisplay = genres ? genreNames.join("-") : "";
            setGenreNames([]);
            setTitle(
              `${year ? year : ""} ${genreNamesToDisplay} ${
                type.charAt(0).toUpperCase() + type.slice(1).toLowerCase()
              }'s`
            );
            const data = {
              year: year,
              language: language,
              page: page || 1,
              genres: genres.join(","),
              sortOrder: sortOrder,
              type: type,
            };
            let response = await axios.get(
              "http://localhost:3000/api/details/filter",
              { params: data }
            );
            console.log(response.data);
            setCards(response.data.results);
            setTotalPages(response.data.total_pages);
          }
        } else if (searchQuery && type === "home") {
          setCards([]);
          isSearch(true);
          let response = await axios.get(
            "http://localhost:3000/api/details/search/movie",
            {
              params: { query: searchQuery },
            }
          );
          let moviesArray = response.data || [];
          setTitle(""); // No title when searching
          response = await axios.get(
            "http://localhost:3000/api/details/search/tv",
            {
              params: { query: searchQuery },
            }
          );
          let showsArray = response.data || [];
          let combined = [...moviesArray, ...showsArray];
          setTotalPages(combined.length);
          setCards(combined);
        } else if (!searchQuery && type === "home") {
          const response = await axios.get(
            "http://localhost:3000/api/details/popular",
            {
              params: { page, limit: 20 },
            }
          );
          const data = response.data;
          setCards(data.movies || []);
          setTotalPages(totalPages + data.totalPages); // Set total pages from the response
          setTitle("Popular Movies");
        } else if (type === "watch-later") {
          if (!user) {
            return;
          }
          setTitle("Watch Later");
          const response = await axios.get(
            "http://localhost:3000/api/user/watch-later",
            { params: { userEmail: user.email, page, limit: 20 } }
          );
          setCards(response.data.movies || []);
          setTotalPages(response.data.totalPages); // Set total pages from the response
        } else if (type === "watched") {
          if (!user) {
            return;
          }
          setTitle("My Watched Movies");
          const response = await axios.get(
            "http://localhost:3000/api/user/watched",
            { params: { userEmail: user.email, page, limit: 20 } }
          );
          setCards(response.data.movies || []);
          setTotalPages(response.data.totalPages); // Set total pages from the response
        }
      } catch (error) {
        console.error("Error fetching movies", error);
        setCards([]);
      }
    };
    fetchMovies();
  }, [location.search, type, user]);

  const goToPage = (page) => {
    const params = new URLSearchParams(location.search);
    const searchQuery = params.get("search");
    const filterQuery = params.get("filter");
    if (filterQuery) {
      navigate(`?filter=${encodeURIComponent(filterQuery)}&page=${page}`);
    } else if (searchQuery) {
      navigate(`?search=${encodeURIComponent(searchQuery)}&page=${page}`);
    } else {
      navigate(`?page=${page}`);
    }
  };
  const onFilterClick = () => {
    setIsFilter((prev) => !prev);
    setShowModal(true);
  };

  return (
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
              <div style={{ position: "relative" }}>
                <button className="filter-button" onClick={toggleSortMenu}>
                  Sort By
                </button>
                {showDropMenu && (
                  <div className="dropdown-menu">
                    <button onClick={() => handleSortChange("desc")}>
                      Newest First
                    </button>
                    <button onClick={() => handleSortChange("asc")}>
                      Oldest First
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="movie-cards-container">
            {cards.length === 0 ? (
              <p>No movies / tv-shows found</p>
            ) : (
              cards.map((card) => (
                <MovieCard
                  key={card.id}
                  card={card}
                  onClick={handleCardClick}
                />
              ))
            )}
          </div>
          {!actorFilter && (
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
