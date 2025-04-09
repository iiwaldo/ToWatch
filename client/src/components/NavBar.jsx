import { Link,useNavigate } from "react-router-dom";
import "../styles/navbar.css";
import { useAuth } from "../context/AuthContext";
import Button from "./Button";

export default function Navbar() {
  const { isAuthenticated,logout } = useAuth();
  const navigate = useNavigate();
  const handleLogOut = () => {
    logout();
    navigate("/");
  }
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
        {!isAuthenticated && (
          <>
            <Link to="/signup">Sign Up</Link>
            <Link to="/">Login</Link>
          </>
        )}
        {isAuthenticated && (
          <>
            <Button label="Log out" onClick={handleLogOut} />
          </>
        )}
      </div>
    </nav>
  );
}
