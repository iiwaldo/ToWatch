import { useState } from "react";
import { Link } from "react-router-dom";
import "../styles/auth.css";
import InputField from "../components/InputField";  // Import InputField
import Button from "../components/Button";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();
    console.log("Logging in with", { email, password });
    // Implement login logic here (e.g., call API to authenticate)
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2 className="auth-title">MovieStack &#127871;</h2>
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
          <Button 
          label="Login"
          />
        </form>
        <p className="auth-link">
          Don't have an account? <Link to="/signup">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
