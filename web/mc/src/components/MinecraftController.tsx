import React, { useState } from "react";
import axios from "axios";

const API_URL = "https://api.josemayer.dev/mine/state";

type ServerState = "on" | "off" | "restart";

const MinecraftController: React.FC = () => {
  const [loading, setLoading] = useState<ServerState | null>(null);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);

  const getAuthToken = () => {
    return document.cookie
      .split("; ")
      .find((row) => row.startsWith("authToken="))
      ?.split("=")[1];
  };

  const handleStateChange = async (state: ServerState) => {
    setLoading(state);
    setFeedback(null);
    const token = getAuthToken();

    if (!token) {
      setFeedback({ type: "error", msg: "Authentication token missing." });
      setLoading(null);
      return;
    }

    try {
      await axios.put(
        API_URL,
        { state },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setFeedback({
        type: "success",
        msg: `Server successfully set to: ${state.toUpperCase()}`,
      });
    } catch (error) {
      console.error(error);
      setFeedback({ type: "error", msg: "Failed to update server state." });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-md w-full mx-auto mb-8 border border-gray-200">
      <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center justify-center gap-2">
        <span>🎮</span> Minecraft Server Control
      </h2>

      <div className="flex gap-4 justify-center">
        <ActionButton
          label="Start"
          color="bg-green-600 hover:bg-green-700"
          isLoading={loading === "on"}
          onClick={() => handleStateChange("on")}
          disabled={loading !== null}
        />
        <ActionButton
          label="Restart"
          color="bg-orange-500 hover:bg-orange-600"
          isLoading={loading === "restart"}
          onClick={() => handleStateChange("restart")}
          disabled={loading !== null}
        />
        <ActionButton
          label="Stop"
          color="bg-red-600 hover:bg-red-700"
          isLoading={loading === "off"}
          onClick={() => handleStateChange("off")}
          disabled={loading !== null}
        />
      </div>

      {feedback && (
        <div
          className={`mt-4 p-2 text-sm rounded text-center ${
            feedback.type === "success"
              ? "bg-green-100 text-green-800 border border-green-200"
              : "bg-red-100 text-red-800 border border-red-200"
          }`}
        >
          {feedback.msg}
        </div>
      )}
    </div>
  );
};

const ActionButton: React.FC<{
  label: string;
  color: string;
  isLoading: boolean;
  onClick: () => void;
  disabled: boolean;
}> = ({ label, color, isLoading, onClick, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`${color} text-white font-semibold py-2 px-4 rounded transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed min-w-[80px]`}
  >
    {isLoading ? "..." : label}
  </button>
);

export default MinecraftController;
