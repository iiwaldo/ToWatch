import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import Login from "./pages/Login"; // Path to your login component
import SignUp from "./pages/SignUp"; // Path to your signup component
import Home from "./pages/Home"; // Path to your signup component
import "../index.css";
import ScrollToTop from "./components/ScrollToTop";
import NavBar from "./components/NavBar";
import ProtectedRoute from "./components/ProtectedRoute";
import WatchLater from "./pages/WatchLater";
import Watched from "./pages/Watched";

function App() {
  return (
    <Router>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/login" element={<Login />} />
        <Route path="/home" element={<Home type={"home"} />} />
        <Route
          path="/watch-later"
          element={
            <ProtectedRoute>
              <WatchLater />
            </ProtectedRoute>
          }
        />
        <Route
          path="/watched"
          element={
            <ProtectedRoute>
              <Watched />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
