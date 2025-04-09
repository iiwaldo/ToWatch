import Navbar from "../components/NavBar";
import { useAuth } from "../context/AuthContext";

export default function Home() {
  const { user } = useAuth();
  console.log(useAuth());

  return (
    <div>
      <Navbar />
      {user ? <h1>Welcome to Movie Stack, {user.email}</h1> : <h1>Welcome to Movie Stack</h1>}
    </div>
  );
}
