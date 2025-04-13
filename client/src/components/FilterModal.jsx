import { useState, useEffect } from "react";
import axios from "axios";
import "../styles/modal.css";
import { useNavigate } from "react-router-dom";

const FilterModal = ({ onClose, setFilter }) => {
  const [movieGenres, setMovieGenres] = useState([]);
  const [tvGenres, setTvGenres] = useState([]);
  const [dataType, setDataType] = useState("movie");
  const [sortOrder, setSortOrder] = useState("desc");
  const [selectedYear, setSelectedYear] = useState("");
  const [genres, setGenres] = useState([]);
  const [language, setLanguage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const endpoint =
          dataType === "movie"
            ? "http://localhost:3000/api/movies/movie-genres"
            : "http://localhost:3000/api/movies/tv-genres";
        const response = await axios.get(endpoint);
        dataType === "movie"
          ? setMovieGenres(response.data)
          : setTvGenres(response.data);
      } catch (error) {
        console.log("Error fetching genres:", error);
      }
    };

    fetchGenres();
  }, [dataType]);

  const handleFilterApply = () => {
    setFilter({
      type: dataType,
      sortOrder,
      year: selectedYear,
      genres,
      language,
    });
    const filterParams = new URLSearchParams({
      // or use currentPage if you want to persist the page number
      type: dataType,
      sortOrder,
      genres: genres.join(","), // Convert genres array to comma-separated string
    });
    if (selectedYear) {
      filterParams.append("year", selectedYear);
    }
    if (language) {
      filterParams.append("language", language);
    }
    navigate(`?filter=${encodeURIComponent(filterParams.toString())}&page=1`);
    onClose();
  };

  const toggleGenre = (id) => {
    if (genres.includes(id)) {
      setGenres(genres.filter((g) => g !== id));
    } else {
      setGenres([...genres, id]);
    }
  };

  const genreOptions = dataType === "movie" ? movieGenres : tvGenres;

  return (
    <div className="movie-details-modal">
      <div className="modal-content animated-glow filter-modal-content">
        <button className="close-btn" onClick={onClose}>
          &times;
        </button>
        <div className="filter-modal-body">
          <div className="filter-row">
            <div className="filter-section half-width">
              <label>Type:</label>
              <div className="toggle-group">
                <button
                  className={`toggle-btn ${
                    dataType === "movie" ? "active" : ""
                  }`}
                  onClick={() => setDataType("movie")}
                >
                  Movie
                </button>
                <button
                  className={`toggle-btn ${dataType === "tv" ? "active" : ""}`}
                  onClick={() => setDataType("tv")}
                >
                  TV
                </button>
              </div>
            </div>

            <div className="filter-section half-width">
              <label>Sort By Popularity:</label>
              <div className="toggle-group">
                <button
                  className={`toggle-btn ${
                    sortOrder === "desc" ? "active" : ""
                  }`}
                  onClick={() => setSortOrder("desc")}
                >
                  Desc
                </button>
                <button
                  className={`toggle-btn ${
                    sortOrder === "asc" ? "active" : ""
                  }`}
                  onClick={() => setSortOrder("asc")}
                >
                  Asc
                </button>
              </div>
            </div>
          </div>

          <div className="filter-section">
            <label>Year:</label>
            <input
              type="number"
              placeholder="Enter year"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="auth-input"
            />
          </div>

          <div className="filter-section">
            <label>Genres:</label>
            <div className="genre-options">
              {genreOptions.map((genre) => (
                <button
                  key={genre.id}
                  className={`genre-btn ${
                    genres.includes(genre.id) ? "selected" : ""
                  }`}
                  onClick={() => toggleGenre(genre.id)}
                >
                  {genre.name}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-section">
            <label>Select Language:</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="auth-input"
            >
              <option value="">All</option>
              <option value="en">English</option>
              <option value="ar">Arabic</option>
              <option value="fr">French</option>
              <option value="ja">Japanese</option>
              <option value="ko">Korean</option>
              <option value="hi">Hindi</option>
              <option value="de">German</option>
            </select>
          </div>

          <button className="apply-btn" onClick={handleFilterApply}>
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilterModal;
