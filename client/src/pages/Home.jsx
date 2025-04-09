import { useEffect } from "react";
import Navbar from "../components/NavBar";
import { useAuth } from "../context/AuthContext";
import axios from "axios";

export default function Home() {
  const { user } = useAuth();
  console.log(useAuth());

  const fetchData = async () => {
    try {
      const response = await axios.get(
        "http://localhost:3000/api/movies/popular"
      );
      console.log(response.data);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div>
      <Navbar />
      {user ? (
        <h1>Welcome to Movie Stack, {user.email}</h1>
      ) : (
        <h1>Welcome to Movie Stack</h1>
      )}
    </div>
  );
}
