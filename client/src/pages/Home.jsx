import { useEffect, useState } from "react";
import Navbar from "../components/NavBar";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import MovieCard from "../components/MovieCard";
import { useNavigate, useLocation } from "react-router-dom";

export default function Home() {
  const { user } = useAuth();
  const [movies, setMovies] = useState([]); // Movies data to display
  const [currentPage, setCurrentPage] = useState(1); // Current page (starts at 1)
  const [totalPages, setTotalPages] = useState(1); // Total pages of results (from backend)
  const navigate = useNavigate();
  const location = useLocation();

  // Function to read query parameters from the URL
  const getPageFromUrl = () => {
    const params = new URLSearchParams(location.search);
    const page = parseInt(params.get("page")) || 1; 
    return page;
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
      setMovies(data.movies);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error("Error fetching data", error);
    }
  };

  // Fetch movies whenever the page changes
  useEffect(() => {
    fetchData();
  }, [currentPage]);

  // Function to go to the next or previous page
  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page); // Update the current page
      navigate(`?page=${page}`); // Update the URL with the new page
    }
  };

  // Generate an array of page numbers to display for pagination
  const generatePageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5; // Show a maximum of 5 pages at a time

    let startPage = Math.max(1, currentPage - 2); // Calculate start page (ensures we don't go below 1)
    let endPage = Math.min(totalPages, currentPage + 2); // Calculate end page (ensures we don't go above totalPages)

    // Adjust the range of pages if we have fewer than maxPagesToShow
    if (endPage - startPage < maxPagesToShow - 1) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return pageNumbers;
  };

  // Initialize current page from URL on component mount
  useEffect(() => {
    const page = getPageFromUrl();
    setCurrentPage(page); // Set the page based on URL
  }, [location.search]);

  return (
    <div>
      {/* Navbar */}
      <Navbar />

      <div className="home-container">
        <h1 className="home-title">Popular Movies</h1>

        {/* Movie Cards */}
        <div className="movie-cards-container">
          {movies.length === 0 ? (
            <p>No movies found</p>
          ) : (
            movies.map((movie) => <MovieCard key={movie.id} movie={movie} />)
          )}
        </div>

        {/* Pagination Controls */}
        <div className="pagination">
          {/* Previous button */}
          <button
            className="pagination-btn"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </button>

          {/* Page numbers */}
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

          {/* Next button */}
          <button
            className="pagination-btn"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
