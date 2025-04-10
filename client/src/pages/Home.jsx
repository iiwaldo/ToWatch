import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Navbar from "../components/NavBar";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import MovieCard from "../components/MovieCard";
import MovieDetailsModal from "../components/MovieDetailsModal";
import Pagination from "../components/Pagination";

export default function Home() {
  const { user } = useAuth();
  const [movies, setMovies] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState("Popular Movies");

  const location = useLocation();
  const navigate = useNavigate();

  const handleMovieClick = (movie) => {
    setSelectedMovie(movie);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedMovie(null);
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const page = parseInt(params.get("page")) || 1;
    const searchQuery = params.get("search");

    setCurrentPage(page);

    const fetchMovies = async () => {
      try {
        if (searchQuery) {
          const response = await axios.get("http://localhost:3000/api/movies/search", {
            params: { query: searchQuery },
          });
          setMovies(response.data || []);
          setTitle(""); // No title when searching
        } else {
          const response = await axios.get("http://localhost:3000/api/movies/popular", {
            params: { page, limit: 20 },
          });
          const data = response.data;
          setMovies(data.movies || []);
          setTotalPages(data.totalPages);
          setTitle("Popular Movies");
        }
      } catch (error) {
        console.error("Error fetching movies", error);
        setMovies([]);
      }
    };

    fetchMovies();
  }, [location.search]);

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
            {movies.length === 0 ? (
              <p>No movies found</p>
            ) : (
              movies.map((movie) => (
                <MovieCard
                  key={movie.id}
                  movie={movie}
                  onClick={handleMovieClick}
                />
              ))
            )}
          </div>

          {title === "Popular Movies" && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              goToPage={goToPage}
            />
          )}

          {showModal && selectedMovie && (
            <MovieDetailsModal movie={selectedMovie} onClose={closeModal} />
          )}
        </div>
      </div>
    </div>
  );
}
