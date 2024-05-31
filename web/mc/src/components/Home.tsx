import React from "react";
import { useNavigate } from "react-router-dom";

interface HomeProps {
  setIsAuthenticated: (isAuthenticated: boolean) => void;
}

const Home: React.FC<HomeProps> = ({ setIsAuthenticated }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    document.cookie =
      "authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    setIsAuthenticated(false);
    navigate("/login");
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">Welcome to the Home Page</h1>
        <button
          onClick={handleLogout}
          className="bg-red-500 text-white py-2 px-4 rounded"
        >
          Exit
        </button>
      </div>
    </div>
  );
};

export default Home;
