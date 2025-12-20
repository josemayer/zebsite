import React, { useState, useEffect, useCallback } from "react";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import api from "./api";

type ServerState = "on" | "off" | "restart";
type LiveStatus = "on" | "off" | "loading";

interface MineProperties {
  "max-players": number;
  motd: string;
  difficulty: "peaceful" | "easy" | "normal" | "hard";
  gamemode: "survival" | "creative" | "adventure" | "spectator";
  whitelist: boolean;
  "online-mode": boolean;
  "allow-flight": boolean;
  "view-distance": number;
}

const MinecraftController: React.FC = () => {
  const [serverStatus, setServerStatus] = useState<LiveStatus>("off");
  const [properties, setProperties] = useState<MineProperties | null>(null);
  const [loadingState, setLoadingState] = useState<ServerState | null>(null);
  const [isSavingProps, setIsSavingProps] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);

  // --- Helpers ---

  const castProperties = (raw: any): MineProperties => {
    const data = raw || {};
    return {
      "max-players": Number(data["max-players"] || 0),
      motd: String(data["motd"] || ""),
      difficulty: data["difficulty"] || "normal",
      gamemode: data["gamemode"] || "survival",
      whitelist: String(data["whitelist"]) === "true",
      "online-mode": String(data["online-mode"]) === "true",
      "allow-flight": String(data["allow-flight"]) === "true",
      "view-distance": Number(data["view-distance"] || 10),
    };
  };

  /**
   * Syncs both status and properties from the server.
   * Clears feedback upon completion to signal readiness.
   */
  const syncAll = useCallback(async () => {
    try {
      const [statusRes, propsRes] = await Promise.all([
        api.get("/mine/status"),
        api.get("/mine/properties"),
      ]);
      setServerStatus(statusRes.data.status);
      setProperties(castProperties(propsRes.data.properties));
      setFeedback(null); // Clear "Signal Sent" messages once data is fresh
    } catch (err) {
      console.error("Sync failed:", err);
    } finally {
      setIsInitialLoad(false);
    }
  }, []);

  // --- Polling Logic (The "Observer") ---

  useEffect(() => {
    // Only poll when the server is in a transitioning "loading" state
    if (serverStatus !== "loading") return;

    const startTime = Date.now();
    const timeoutMs = 30000; // 30s limit

    const poll = async () => {
      try {
        const res = await api.get("/mine/status");
        const currentStatus = res.data.status;
        const elapsed = Date.now() - startTime;

        // Break condition: Server reached stable state or time ran out
        if (currentStatus !== "loading" || elapsed >= timeoutMs) {
          clearInterval(interval);
          await syncAll(); // Final update for both status and config
          setShowConfig(true); // Re-show properties now that server is ready
        }
      } catch (err) {
        console.error("Polling error:", err);
        clearInterval(interval);
      }
    };

    const interval = setInterval(poll, 3000); // 3s interval
    return () => clearInterval(interval);
  }, [serverStatus, syncAll]);

  // --- Life Cycle ---

  useEffect(() => {
    syncAll();
  }, [syncAll]);

  // --- Handlers ---

  const handleStateChange = async (state: ServerState) => {
    setLoadingState(state);
    setFeedback(null);
    try {
      await api.put("/mine/state", { state });
      setFeedback({
        type: "success",
        msg: `Signal sent: ${state.toUpperCase()}...`,
      });
      setServerStatus("loading");
    } catch (error: any) {
      setFeedback({
        type: "error",
        msg: error.response?.data?.message || "Error",
      });
    } finally {
      setLoadingState(null);
    }
  };

  const handlePropertySave = async () => {
    if (!properties) return;
    setFeedback(null);
    setIsSavingProps(true);
    try {
      await api.put("/mine/properties", { properties });
      setFeedback({ type: "success", msg: "Applying changes. Restarting..." });
      setShowConfig(false); // Hide during transition to prevent stale edits
      setServerStatus("loading");
    } catch (error: any) {
      setFeedback({
        type: "error",
        msg: error.response?.data?.message || "Error",
      });
    } finally {
      setIsSavingProps(false);
    }
  };

  const refreshStatusOnly = async () => {
    setIsRefreshing(true);
    try {
      const res = await api.get("/mine/status");
      setServerStatus(res.data.status);
    } finally {
      setIsRefreshing(false);
    }
  };

  // --- Render ---

  if (isInitialLoad) {
    return (
      <div className="flex justify-center p-10">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-xl max-w-lg w-full mx-auto mb-8 border border-gray-200 relative overflow-hidden">
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <button
          onClick={refreshStatusOnly}
          disabled={serverStatus === "loading"}
          className={`p-1 text-gray-400 hover:text-blue-500 transition-all ${
            isRefreshing || serverStatus === "loading"
              ? "animate-spin [animation-duration:1s]"
              : ""
          }`}
        >
          <ArrowPathIcon className={`h-5 w-5`} />
        </button>
        <StatusBadge status={serverStatus} />
      </div>

      <h2 className="text-xl font-bold text-gray-800 mb-8 flex items-center gap-2">
        <span>🎮</span> Server Control
      </h2>

      <div className="flex gap-3 justify-center mb-6">
        <ActionButton
          label="Start"
          color="bg-green-600"
          isLoading={loadingState === "on"}
          onClick={() => handleStateChange("on")}
          disabled={serverStatus === "on" || serverStatus === "loading"}
        />
        <ActionButton
          label="Restart"
          color="bg-orange-500"
          isLoading={loadingState === "restart"}
          onClick={() => handleStateChange("restart")}
          disabled={serverStatus === "off" || serverStatus === "loading"}
        />
        <ActionButton
          label="Stop"
          color="bg-red-600"
          isLoading={loadingState === "off"}
          onClick={() => handleStateChange("off")}
          disabled={serverStatus === "off" || serverStatus === "loading"}
        />
      </div>

      <hr className="border-gray-100 my-6" />

      <div className="flex justify-center">
        <button
          onClick={() => setShowConfig(!showConfig)}
          className="text-gray-400 hover:text-gray-600 text-sm font-medium flex items-center gap-2 transition-all"
        >
          <span
            className={`transition-transform ${showConfig ? "rotate-90" : ""}`}
          >
            ⚙️
          </span>
          {showConfig ? "Close Settings" : "Server Properties"}
        </button>
      </div>

      {showConfig && properties && (
        <div className="mt-6 bg-gray-50 p-5 rounded-lg border border-gray-200 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="col-span-1 md:col-span-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                MOTD
              </label>
              <input
                type="text"
                value={properties.motd}
                onChange={(e) =>
                  setProperties({ ...properties, motd: e.target.value })
                }
                className="w-full mt-1 p-2 bg-white border border-gray-300 rounded text-sm outline-none"
              />
            </div>

            <SelectField
              label="Difficulty"
              value={properties.difficulty}
              options={["peaceful", "easy", "normal", "hard"]}
              onChange={(val) =>
                setProperties({ ...properties, difficulty: val as any })
              }
            />

            <SelectField
              label="Gamemode"
              value={properties.gamemode}
              options={["survival", "creative", "adventure", "spectator"]}
              onChange={(val) =>
                setProperties({ ...properties, gamemode: val as any })
              }
            />

            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Max Players
              </label>
              <input
                type="number"
                value={properties["max-players"]}
                onChange={(e) =>
                  setProperties({
                    ...properties,
                    "max-players": parseInt(e.target.value) || 0,
                  })
                }
                className="w-full mt-1 p-2 bg-white border border-gray-300 rounded text-sm outline-none"
              />
            </div>

            <div className="col-span-1 md:col-span-2 space-y-3 pt-2">
              <ToggleField
                label="Whitelist"
                checked={properties.whitelist}
                onChange={(val) =>
                  setProperties({ ...properties, whitelist: val })
                }
              />
              <ToggleField
                label="Online Mode"
                checked={properties["online-mode"]}
                onChange={(val) =>
                  setProperties({ ...properties, "online-mode": val })
                }
              />
            </div>
          </div>

          <button
            onClick={handlePropertySave}
            disabled={isSavingProps || serverStatus === "loading"}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 rounded-lg shadow transition-all flex items-center justify-center gap-2"
          >
            {isSavingProps ? "Saving & Restarting..." : "Save & Restart"}
          </button>
        </div>
      )}

      {feedback && (
        <div
          className={`mt-4 p-3 rounded-md text-sm text-center font-medium ${
            feedback.type === "success"
              ? "bg-green-50 text-green-700 border-green-100"
              : "bg-red-50 text-red-700 border-red-100"
          }`}
        >
          {feedback.msg}
        </div>
      )}
    </div>
  );
};

// --- Sub-Components ---

const StatusBadge: React.FC<{ status: LiveStatus }> = ({ status }) => {
  const configs = {
    on: {
      bg: "bg-green-100",
      text: "text-green-700",
      dot: "bg-green-500",
      label: "Online",
      pulse: true,
    },
    off: {
      bg: "bg-gray-100",
      text: "text-gray-600",
      dot: "bg-gray-400",
      label: "Offline",
      pulse: false,
    },
    loading: {
      bg: "bg-blue-100",
      text: "text-blue-700",
      dot: "bg-blue-500",
      label: "Transitioning",
      pulse: true,
    },
  };
  const config = configs[status];
  return (
    <div
      className={`flex items-center gap-2 px-3 py-1 rounded-full ${config.bg} ${config.text} text-[11px] font-bold uppercase tracking-tighter`}
    >
      <span
        className={`h-2 w-2 rounded-full ${config.dot} ${
          config.pulse ? "animate-pulse" : ""
        }`}
      />
      {config.label}
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
    className={`${color} text-white font-bold py-2 px-6 rounded-lg shadow-md hover:brightness-110 transition-all disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed min-w-[100px] flex justify-center`}
  >
    {isLoading ? (
      <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
    ) : (
      label
    )}
  </button>
);

const SelectField: React.FC<{
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}> = ({ label, value, options, onChange }) => (
  <div>
    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
      {label}
    </label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full mt-1 p-2 bg-white border border-gray-300 rounded text-sm outline-none capitalize cursor-pointer"
    >
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  </div>
);

const ToggleField: React.FC<{
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}> = ({ label, checked, onChange }) => (
  <div className="flex items-center justify-between bg-white p-3 border border-gray-100 rounded-lg shadow-sm">
    <span className="text-sm text-gray-600 font-semibold">{label}</span>
    <button
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${
        checked ? "bg-green-500" : "bg-gray-200"
      }`}
    >
      <span
        className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  </div>
);

export default MinecraftController;
