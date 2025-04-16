import { createContext, useContext, useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode"; // Ensure jwt_decode is imported correctly
import axios from "axios";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  console.log(isAuthenticated);
  const verifyTokenWithBackend = async (token) => {
    try {
      console.log("checking with backend..");
      const response = await axios.post(
        "http://localhost:3000/api/auth/verify-token",
        { token }
      );
      if (response.status === 200) {
        setIsAuthenticated(true);
        const storedUser = JSON.parse(localStorage.getItem("user"));
        setUser(storedUser);
      } else {
        // If the backend returns an error (e.g., invalid token), log out
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setIsAuthenticated(false);
        setUser(null);
      }
    } catch (error) {
      console.error("Error verifying token with backend:", error);
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setIsAuthenticated(false);
      setUser(null);
    }
  };
  useEffect(() => {
    console.log("use effect is running");
    const token = localStorage.getItem("token");
    if (token) {
      try {
        console.log("Checking token...");
        const decoded = jwtDecode(token);
        console.log("Decoded token:", decoded); // Log the decoded token

        // Check for token expiry
        if (decoded.exp < Date.now() / 1000) {
          //token expired
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setIsAuthenticated(false);
          setUser(null);
          console.log("Token expired, logging out.");
        } else {
          //check with backend
          verifyTokenWithBackend(token);
        }
      } catch (error) {
        console.error("Error decoding token:", error);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setIsAuthenticated(false);
        setUser(null);
      }
    }
  }, []); // Empty dependency array ensures this runs once on mount

  const login = (token, user) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    setIsAuthenticated(true);
    setUser(user);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, user }}>
      {children}
    </AuthContext.Provider>
  );
}
