import { useAuth } from "../context/AuthContext";
import { Navigate } from "react-router-dom";
import "../styles/modal.css";

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (<div className="spinner-container">
        <div className="spinner"></div>
      </div>)// Or a spinner
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
