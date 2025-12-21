import React from "react";
import { useNavigate } from "react-router-dom";
import MinecraftManager from "./MinecraftManager";

interface HomeProps {
  setIsAuthenticated: (isAuthenticated: boolean) => void;
  userRole: "user" | "admin" | null;
}

const Home: React.FC<HomeProps> = ({ setIsAuthenticated, userRole }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    document.cookie =
      "authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    setIsAuthenticated(false);
    navigate("/login");
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="text-center w-full max-w-2xl">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-8">
          Welcome Home
        </h1>

        {/* Admin Section */}
        {userRole === "admin" && (
          <div className="mb-8 animate-fade-in">
            <div className="bg-yellow-50 text-yellow-800 px-4 py-2 rounded-full text-sm font-semibold inline-block mb-6 border border-yellow-200">
              ⚡ Admin Access Granted
            </div>
            <MinecraftManager />
          </div>
        )}

        <button
          onClick={handleLogout}
          className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-6 rounded transition-colors"
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default Home;
