import { Link } from "react-router-dom";
import "../styles/navbar.css";

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-section logo">
        <Link to="/">🍿 MovieStack</Link>
      </div>
      <div className="navbar-section search">
        <input
          type="text"
          className="search-input"
          placeholder="Search movies..."
        />
      </div>
      <div className="navbar-section links">
        <Link to="/signup">Sign Up</Link>
        <Link to="/">Login</Link>
      </div>
    </nav>
  );
}
