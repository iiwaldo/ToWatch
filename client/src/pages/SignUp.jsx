import { useState } from "react";
import { Link } from "react-router-dom";
import "../styles/auth.css";
import InputField from "../components/InputField"; // Import the reusable InputField
import Button from "../components/Button";

const SignUp = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle the sign-up logic here (e.g., send the data to the backend)
    if (password != confirmPassword) {
      console.log("error");
    }
    console.log("Signing up with", email, password);
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
            label="Confirm Pacssword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          <Button label="Sign Up" />
        </form>
        <p className="auth-link">
          Already have an account? <Link to="/">Login</Link>
        </p>
      </div>
    </div>
  );
};

export default SignUp;
