import { Link, useNavigate } from "react-router-dom";
import "../styles/navbar.css";
import { useAuth } from "../context/AuthContext";
import React , { useState, useCallback } from "react";
import { FaUserCircle } from "react-icons/fa"; // Add a user profile icon from react-icons

function Navbar() {
  console.log("im re-rendered from NavBar");
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [debounceTimer, setDebounceTimer] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false); // State to control dropdown visibility

  const handleLogOut = () => {
    logout();
    navigate("/");
  };

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    debouncedNavigate(query);
  };

  const debouncedNavigate = useCallback(
    (query) => {
      if (debounceTimer) clearTimeout(debounceTimer);

      const timer = setTimeout(() => {
        if (query.trim() === "") {
          navigate("?page=1");
        } else {
          navigate(`?search=${encodeURIComponent(query.trim())}&page=1`);
        }
      }, 1000);

      setDebounceTimer(timer);
    },
    [debounceTimer, navigate]
  );

  const toggleDropdown = () => {
    setDropdownOpen((prevState) => !prevState); // Toggle dropdown visibility
  };

  const goToWatchLater = () => {
    navigate("/watch-later");
    setDropdownOpen(false); // Close dropdown after clicking
  };

  const goToWatched = () => {
    navigate("/watched");
    setDropdownOpen(false); // Close dropdown after clicking
  };

  return (
    <nav className="navbar">
      <div className="navbar-section logo">
        <Link to="/">🍿 ToWatch</Link>
      </div>
      <div className="navbar-section search">
        <input
          type="text"
          value={searchQuery}
          onChange={handleSearchChange}
          className="search-input"
          placeholder="Search movies or tv shows..."
        />
      </div>
      <div className="navbar-section links">
        {!isAuthenticated && (
          <>
            <Link to="/signup">Sign Up</Link>
            <Link to="/login">Login</Link>
          </>
        )}

        {isAuthenticated && (
          <div className="profile-dropdown">
            <button className="profile-icon" onClick={toggleDropdown}>
              <FaUserCircle size={24} color="#00bcd4" /> {/* Profile icon */}
            </button>

            {dropdownOpen && (
              <div className="dropdown-menu">
                <button onClick={goToWatchLater}>Watch Later</button>
                <button onClick={goToWatched}>Watched</button>
                <button onClick={handleLogOut}>Logout</button>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
export default React.memo(Navbar);
