import { Link, useNavigate } from "react-router-dom";
import "../styles/navbar.css";
import { useAuth } from "../context/AuthContext";
import Button from "./Button";
import { useState, useCallback } from "react";

export default function Navbar() {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [debounceTimer, setDebounceTimer] = useState(null);

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

  return (
    <nav className="navbar">
      <div className="navbar-section logo">
        <Link to="/">🍿 MovieStack</Link>
      </div>
      <div className="navbar-section search">
        <input
          type="text"
          value={searchQuery}
          onChange={handleSearchChange}
          className="search-input"
          placeholder="Search movies..."
        />
      </div>
      <div className="navbar-section links">
        {!isAuthenticated && (
          <>
            <Link to="/signup">Sign Up</Link>
            <Link to="/">Login</Link>
          </>
        )}
        {isAuthenticated && (
          <Button label="Log out" onClick={handleLogOut} />
        )}
      </div>
    </nav>
  );
}
