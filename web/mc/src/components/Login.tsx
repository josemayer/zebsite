import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

type UserRole = "user" | "admin" | null;

interface LoginProps {
  setIsAuthenticated: (isAuthenticated: boolean) => void;
  setUserRole: (role: UserRole) => void;
}

const API_BASE_URL =
  process.env.REACT_APP_API_ENDPOINT || "https://api.josemayer.dev";

const Login: React.FC<LoginProps> = ({ setIsAuthenticated, setUserRole }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const clearAuthCookie = () => {
    document.cookie =
      "authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  };

  const verifyAndSetUserData = async (token: string): Promise<void> => {
    try {
      const verifyResponse = await axios.get(API_BASE_URL + "/verifyLogin", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const { role, service } = verifyResponse.data;

      if (verifyResponse.status === 200 && service === "mine") {
        setUserRole(role);
        setIsAuthenticated(true);
        navigate("/", { replace: true }); // Navigate to home
      } else {
        clearAuthCookie();
        setError("Login failed: User is not authorized for this service.");
      }
    } catch (err) {
      // Verification failed (e.g., token invalid, server error)
      clearAuthCookie();
      setError("Login verification failed. Please log in again.");
      console.error("Verification failed after login:", err);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const loginResponse = await axios.post(API_BASE_URL + "/login", {
        username,
        password,
      });

      const token = loginResponse.data.token;

      document.cookie = `authToken=${token}; path=/; max-age=3600;`;

      await verifyAndSetUserData(token);
    } catch (err) {
      clearAuthCookie();
      if (axios.isAxiosError(err) && err.response) {
        setError(
          err.response.status === 401
            ? "Invalid username or password."
            : "Login failed due to a server error."
        );
      } else {
        setError("An unexpected error occurred during login.");
      }
      setIsAuthenticated(false);
      setUserRole(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md">
        <form
          onSubmit={handleLogin}
          className="bg-white shadow-lg rounded px-8 pt-6 pb-8 mb-4"
        >
          <h2 className="text-3xl font-bold text-center mb-6 text-gray-700">
            Login
          </h2>

          {error && (
            <div className="mb-4 p-3 text-sm text-red-700 bg-red-100 rounded">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="username"
            >
              Username
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="username"
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="mb-6">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="password"
            >
              Password
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
              id="password"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="flex items-center justify-between">
            <button
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Logging in..." : "Sign In"}
            </button>
          </div>
        </form>
        <p className="text-center text-gray-500 text-xs">
          Don't have an account?{" "}
          <span
            className="text-blue-500 cursor-pointer"
            onClick={() => navigate("/register")}
          >
            Register here.
          </span>
        </p>
      </div>
    </div>
  );
};

export default Login;
