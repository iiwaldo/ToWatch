import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/auth.css";
import InputField from "../components/InputField"; // Import InputField
import Button from "../components/Button";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(""); // New state for error message
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const BACKEND_URL = import.meta.env.VITE_API_URL;


  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${BACKEND_URL}/api/auth/login`, {
        email,
        password,
      });
      if (response.status === 200) {
        login(response.data.token, response.data.user);
        navigate("/home");
      }
    } catch (error) {
      if (error.response) {
        // Set generic error message
        setError("Invalid email or password. Please try again.");
      }
      console.log("Login failed:", error);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2 className="auth-title">ToWatch &#127871;</h2>
        <form onSubmit={handleLogin}>
          <InputField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <InputField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <p className="auth-error">{error}</p>}{" "}
          {/* Display error message */}
          <Button label="Login" type="submit" />
        </form>
        <p className="auth-link">
          Don't have an account? <Link to="/signup">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
