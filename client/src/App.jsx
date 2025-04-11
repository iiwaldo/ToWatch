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

function App() {
  return (
    <Router>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/login" element={<Login />} />
        <Route path="/home" element={<Home type={"home"} />} />
        <Route path="/watch-later" element={<Home type={"watch-later"} />} />
        <Route path="/watched" element={<Home type={"watched"} />} />
      </Routes>
    </Router>
  );
}

export default App;
