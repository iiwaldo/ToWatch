import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/auth.css";
import InputField from "../components/InputField"; // Import the reusable InputField
import Button from "../components/Button";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const SignUp = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState(""); // State to store error message
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check if the passwords match
    if (password !== confirmPassword) {
      setError("Passwords do not match!");
      return; // Stop form submission
    }

    try {
      const response = await axios.post(
        "http://localhost:3000/api/auth/signup",
        {
          email,
          password,
        }
      );
      login(email, response.data.token);
      navigate("/"); // Redirect to the login page after successful signup
    } catch (error) {
      // Display a generic error message if email already exists
      if (error.response && error.response.data.message) {
        setError(error.response.data.message);
      } else {
        setError("Signup failed! Please try again.");
      }
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2 className="auth-title">Create an Account &#127871;</h2>
        <form onSubmit={handleSubmit}>
          {/* Use InputField for email */}
          <InputField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          {/* Use InputField for password */}
          <InputField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <InputField
            label="Confirm Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          {error && <p className="auth-error">{error}</p>} {/* Display error message */}
          <Button label="Sign Up" type="submit" />
        </form>
        <p className="auth-link">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
};

export default SignUp;
