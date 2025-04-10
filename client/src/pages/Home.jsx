import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Navbar from "../components/NavBar";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import MovieCard from "../components/MovieCard";
import MovieDetailsModal from "../components/MovieDetailsModal";

export default function Home() {
  const { user } = useAuth();
  const [movies, setMovies] = useState([]); // Movies data to display
  const [currentPage, setCurrentPage] = useState(1); // Current page (starts at 1)
  const [totalPages, setTotalPages] = useState(1); // Total pages of results (from backend)
  const [selectedMovie, setSelectedMovie] = useState(null); // State to hold selected movie for modal
  const [showModal, setShowModal] = useState(false); // State to show/hide modal
  const location = useLocation();
  const navigate = useNavigate();

  // Handle movie click to show modal
  const handleMovieClick = (movie) => {
    setSelectedMovie(movie); // Set selected movie
    setShowModal(true); // Show modal
  };

  // Close modal
  const closeModal = () => {
    setShowModal(false); // Hide modal
    setSelectedMovie(null); // Reset selected movie
  };

  // Fetch data from backend
  const fetchData = async () => {
    try {
      const response = await axios.get(
        "http://localhost:3000/api/movies/popular",
        {
          params: { page: currentPage, limit: 20 },
        }
      );
      const data = response.data;
      setMovies(data.movies || []); // Ensure it's always an array
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error("Error fetching data", error);
      setMovies([]); // Reset to empty array if error occurs
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentPage]);

  // Generate an array of page numbers to display for pagination
  const generatePageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5; // Show a maximum of 5 pages at a time

    let startPage = Math.max(1, currentPage - 2); // Calculate start page (ensures we don't go below 1)
    let endPage = Math.min(totalPages, currentPage + 2); // Calculate end page (ensures we don't go above totalPages)

    if (endPage - startPage < maxPagesToShow - 1) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return pageNumbers;
  };
  // Function to read query parameters from the URL
  const getPageFromUrl = () => {
    const params = new URLSearchParams(location.search);
    const page = parseInt(params.get("page")) || 1;
    return page;
  };
  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page); // Update the current page
      navigate(`?page=${page}`); // Update the URL with the new page
    }
  };
  // Initialize current page from URL on component mount
  useEffect(() => {
    const page = getPageFromUrl();
    setCurrentPage(page); // Set the page based on URL
  }, [location.search]);

  return (
    <div>
      <Navbar />

      <div className="home-container">
        <h1 className="home-title">Popular Movies</h1>

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

        <div className="pagination">
          <button
            className="pagination-btn"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </button>

          {generatePageNumbers().map((pageNumber) => (
            <button
              key={pageNumber}
              className={`pagination-btn ${
                pageNumber === currentPage ? "active" : ""
              }`}
              onClick={() => goToPage(pageNumber)}
            >
              {pageNumber}
            </button>
          ))}

          <button
            className="pagination-btn"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>

        {/* Modal */}
        {showModal && selectedMovie && (
          <MovieDetailsModal movie={selectedMovie} onClose={closeModal} />
        )}
      </div>
    </div>
  );
}
