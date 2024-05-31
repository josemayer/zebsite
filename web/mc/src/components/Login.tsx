import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

interface LoginProps {
  setIsAuthenticated: (isAuthenticated: boolean) => void;
}

const Login: React.FC<LoginProps> = ({ setIsAuthenticated }) => {
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const navigate = useNavigate();

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const response = await axios.post("https://api.josemayer.dev/login", {
        username,
        password,
      });
      document.cookie = `authToken=${response.data.token}`;
      setIsAuthenticated(true);
      navigate("/");
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response) {
        console.error("Login failed:", error.response.data.message);
      } else {
        console.error("Login failed:", error);
      }
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <form onSubmit={handleLogin} className="bg-white p-6 rounded shadow-md">
        <h1 className="text-2xl font-bold mb-4">Login</h1>
        <label className="block mb-2">
          Username:
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="block w-full mt-1 border border-gray-300 rounded p-2"
            required
          />
        </label>
        <label className="block mb-2">
          Password:
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="block w-full mt-1 border border-gray-300 rounded p-2"
            required
          />
        </label>
        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 rounded mt-4"
        >
          Login
        </button>
        <button
          type="button"
          onClick={() => navigate("/register")}
          className="w-full bg-gray-500 text-white py-2 rounded mt-4"
        >
          Register
        </button>
      </form>
    </div>
  );
};

export default Login;
