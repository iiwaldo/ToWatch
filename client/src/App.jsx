import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Login from "./pages/Login"; // Path to your login component
import SignUp from "./pages/SignUp"; // Path to your signup component
import Home from "./pages/Home"; // Path to your signup component
import MovieDetailsModal from "./components/MovieDetailsModal"; // Path to your signup component
import "../index.css";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/home" element={<Home />} />
        <Route path="/movie/:id" element={<MovieDetailsModal />} /> 
      </Routes>
    </Router>
  );
}

export default App;
