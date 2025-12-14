import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import axios from "axios";
import Home from "./components/Home";
import Login from "./components/Login";
import Register from "./components/Register";
import Loading from "./components/Loading";
import "./App.css";

const API_BASE_URL =
  process.env.REACT_APP_API_ENDPOINT || "https://api.josemayer.dev";

type UserRole = "user" | "admin" | null;

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [userRole, setUserRole] = useState<UserRole>(null);

  useEffect(() => {
    const token = getAuthTokenFromCookie();
    if (token) {
      verifyLogin(token);
    } else {
      setIsLoading(false);
    }
  }, []);

  const verifyLogin = async (token: string) => {
    try {
      const response = await axios.get(API_BASE_URL + "/verifyLogin", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 200 && response.data.service === "mine") {
        setIsAuthenticated(true);
        setUserRole(response.data.role);
      } else {
        console.error("User service is not authorized.");
        document.cookie =
          "authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      }
    } catch (error) {
      console.error("User is not authenticated or verification failed", error);
      setUserRole(null);
    } finally {
      setIsLoading(false);
    }
  };

  const getAuthTokenFromCookie = (): string | null => {
    const name = "authToken=";
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
      let cookie = cookies[i].trim();
      if (cookie.startsWith(name)) {
        return cookie.substring(name.length);
      }
    }
    return null;
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate to="/" />
            ) : (
              <Login
                setIsAuthenticated={setIsAuthenticated}
                setUserRole={setUserRole}
              />
            )
          }
        />
        <Route path="/register" element={<Register />} />
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <Home
                setIsAuthenticated={setIsAuthenticated}
                userRole={userRole}
              />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
      </Routes>
    </Router>
  );
};

export default App;
