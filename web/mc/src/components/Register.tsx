import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Register: React.FC = () => {
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const navigate = useNavigate();

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const response = await axios.post("https://api.josemayer.dev/register", {
        username,
        password,
      });
      if (response.status === 200) {
        alert("User registered successfully!");
        navigate("/login");
      }
    } catch (error) {
      console.error("Registration failed:", error);
      alert("Registration failed. Please try again.");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <form
        onSubmit={handleRegister}
        className="bg-white p-6 rounded shadow-md"
      >
        <h1 className="text-2xl font-bold mb-4">Register</h1>
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
          Register
        </button>
        <button
          onClick={() => navigate("/login")}
          className="w-full bg-gray-500 text-white py-2 rounded mt-4"
        >
          Login
        </button>
      </form>
    </div>
  );
};

export default Register;
