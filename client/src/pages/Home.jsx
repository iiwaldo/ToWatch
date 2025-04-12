import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Navbar from "../components/NavBar";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import MovieCard from "../components/MovieCard";
import MovieDetailsModal from "../components/MovieDetailsModal";
import Pagination from "../components/Pagination";

export default function Home({ type }) {
  const { user } = useAuth();
  const [cards, setCards] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedCard, setSelectedCard] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState("Popular Movies");

  const location = useLocation();
  const navigate = useNavigate();

  const handleCardClick = (card) => {
    setSelectedCard(card);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedCard(null);
  };
  console.log("im called");

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const page = parseInt(params.get("page")) || 1;
    const searchQuery = params.get("search");

    setCurrentPage(page);

    const fetchMovies = async () => {
      try {
        if (searchQuery && type === "home") {
          let response = await axios.get(
            "http://localhost:3000/api/movies/search/movie",
            {
              params: { query: searchQuery },
            }
          );
          let moviesArray = response.data || [];
          setTitle(""); // No title when searching
          response = await axios.get(
            "http://localhost:3000/api/movies/search/tv",
            {
              params: { query: searchQuery },
            }
          );
          let showsArray = response.data || [];
          let combined = [...moviesArray,...showsArray];
          setTotalPages(combined.length);
          setCards(combined);
        } else if (!searchQuery && type === "home") {
          const response = await axios.get(
            "http://localhost:3000/api/movies/popular",
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

    if (searchQuery) {
      navigate(`?search=${encodeURIComponent(searchQuery)}&page=${page}`);
    } else {
      navigate(`?page=${page}`);
    }
  };

  return (
    <div>
      <Navbar />
      <div className="con">
        <div className="home-container">
          <h1 className="home-title">{title}</h1>

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
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              goToPage={goToPage}
            />
          

          {showModal && selectedCard && (
            <MovieDetailsModal
              type={type}
              setCards={setCards}
              card={selectedCard}
              onClose={closeModal}
            />
          )}
        </div>
      </div>
    </div>
  );
}
