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

export default function Home({ type }) {
  const BACKEND_URL = process.env.REACT_APP_API_URL;
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
  const genreMap = {
    28: "Action",
    12: "Adventure",
    16: "Animation",
    35: "Comedy",
    80: "Crime",
    99: "Documentary",
    18: "Drama",
    10751: "Family",
    14: "Fantasy",
    36: "History",
    27: "Horror",
    10402: "Music",
    9648: "Mystery",
    10749: "Romance",
    878: "Science Fiction",
    10770: "TV Movie",
    53: "Thriller",
    10752: "War",
    37: "Western",
    10759: "Action & Adventure",
    10762: "Kids",
    10763: "News",
    10764: "Reality",
    10765: "Sci-Fi & Fantasy",
    10766: "Soap",
    10767: "Talk",
    10768: "War & Politics",
    10769: "Foreign",
  };

  const languageMap = {
    af: "Afrikaans",
    am: "Amharic",
    ar: "Arabic",
    az: "Azerbaijani",
    be: "Belarusian",
    bg: "Bulgarian",
    bn: "Bengali",
    bs: "Bosnian",
    ca: "Catalan",
    cs: "Czech",
    cy: "Welsh",
    da: "Danish",
    de: "German",
    el: "Greek",
    en: "English",
    eo: "Esperanto",
    es: "Spanish",
    et: "Estonian",
    eu: "Basque",
    fa: "Persian",
    fi: "Finnish",
    fil: "Filipino",
    fj: "Fijian",
    fr: "French",
    ga: "Irish",
    gl: "Galician",
    gu: "Gujarati",
    he: "Hebrew",
    hi: "Hindi",
    hr: "Croatian",
    ht: "Haitian Creole",
    hu: "Hungarian",
    hy: "Armenian",
    id: "Indonesian",
    is: "Icelandic",
    it: "Italian",
    ja: "Japanese",
    jv: "Javanese",
    ka: "Georgian",
    kk: "Kazakh",
    km: "Khmer",
    kn: "Kannada",
    ko: "Korean",
    ku: "Kurdish",
    ky: "Kyrgyz",
    lo: "Lao",
    lt: "Lithuanian",
    lv: "Latvian",
    mg: "Malagasy",
    mi: "Maori",
    mk: "Macedonian",
    ml: "Malayalam",
    mn: "Mongolian",
    mr: "Marathi",
    ms: "Malay",
    mt: "Maltese",
    my: "Burmese",
    ne: "Nepali",
    nl: "Dutch",
    no: "Norwegian",
    pa: "Punjabi",
    pl: "Polish",
    ps: "Pashto",
    pt: "Portuguese",
    ro: "Romanian",
    ru: "Russian",
    rw: "Kinyarwanda",
    si: "Sinhala",
    sk: "Slovak",
    sl: "Slovenian",
    so: "Somali",
    sq: "Albanian",
    sr: "Serbian",
    su: "Sundanese",
    sv: "Swedish",
    sw: "Swahili",
    ta: "Tamil",
    te: "Telugu",
    tg: "Tajik",
    th: "Thai",
    tk: "Turkmen",
    tl: "Tagalog",
    tr: "Turkish",
    tt: "Tatar",
    uk: "Ukrainian",
    ur: "Urdu",
    uz: "Uzbek",
    vi: "Vietnamese",
    xh: "Xhosa",
    yi: "Yiddish",
    zh: "Chinese",
    zu: "Zulu",
  };

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
              { params: { actorID } }
            );

            const credits = response.data || [];
            const uniqueCredits = Array.from(
              new Map(credits.map((item) => [item.id, item])).values()
            );
            const sortedCredits = uniqueCredits.sort((a, b) => {
              const dateA = new Date(a.release_date || a.first_air_date || 0);
              const dateB = new Date(b.release_date || b.first_air_date || 0);
              return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
            });

            setCards(sortedCredits);
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
              `${langName} ${year || ""} ${genreText} ${capitalizedType}'s`
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
              }
            );

            setCards(response.data.results || []);
            setTotalPages(response.data.total_pages || 1);
          }
        } else if (searchQuery && type === "home") {
          setSearch(true);
          setCards([]);

          const movieRes = await axios.get(
            `${BACKEND_URL}/api/details/search/movie`,
            {
              params: { query: searchQuery },
            }
          );

          const tvRes = await axios.get(
            `${BACKEND_URL}/api/details/search/tv`,
            {
              params: { query: searchQuery },
            }
          );

          const combined = [
            ...(movieRes.data || []),
            ...(tvRes.data || []),
          ].sort((a, b) => (b.popularity || 0) - (a.popularity || 0));

          setCards(combined);
          setTotalPages(1); // Disable pagination for search
          setTitle(`Search Results for "${searchQuery}"`);
        } else if (type === "home") {
          const response = await axios.get(
            `${BACKEND_URL}/api/details/popular`,
            {
              params: { page, limit: 20 },
            }
          );
          const data = response.data;
          setCards(data.movies || []);
          setTotalPages(data.totalPages || 1);
          setTitle("Popular Movies");
        } else if (type === "watch-later" && user) {
          const response = await axios.get(
            `${BACKEND_URL}/api/user/watch-later`,
            {
              params: { userEmail: user.email, page, limit: 20 },
            }
          );
          setTitle("Watch Later");
          setCards(response.data.movies || []);
          setTotalPages(response.data.totalPages || 1);
        } else if (type === "watched" && user) {
          const response = await axios.get(`${BACKEND_URL}/api/user/watched`, {
            params: { userEmail: user.email, page, limit: 20 },
          });
          setTitle("My Watched Movies");
          setCards(response.data.movies || []);
          setTotalPages(response.data.totalPages || 1);
        }
      } catch (error) {
        console.error("Error fetching movies:", error);
        setCards([]);
      }
    };

    fetchMovies();
  }, [location.search, type, user, sortOrder]);

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
              <div className="sort-icons-container">
                <button onClick={toggleSortOrder} className="sort-icon-button">
                  {sortOrder === "desc" ? <FaSortDown /> : <FaSortUp />}
                </button>
              </div>
            )}
          </div>

          <div className="movie-cards-container">
            {cards.length === 0 ? (
              <p>No movies / TV shows found</p>
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
