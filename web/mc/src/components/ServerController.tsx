import React, { useState, useEffect, useCallback } from "react";
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

interface ServerControllerProps {
  serverStatus: LiveStatus;
  onStatusChange: (status: LiveStatus) => void;
  syncStatus: () => Promise<void>;
}

const ServerController: React.FC<ServerControllerProps> = ({
  serverStatus,
  onStatusChange,
  syncStatus,
}) => {
  const [properties, setProperties] = useState<MineProperties | null>(null);
  const [loadingAction, setLoadingAction] = useState<ServerState | null>(null);
  const [isSavingProps, setIsSavingProps] = useState(false);
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

  const fetchProperties = useCallback(async () => {
    try {
      const res = await api.get("/mine/properties");
      setProperties(castProperties(res.data.properties));
    } catch (err) {
      console.error("Failed to fetch properties:", err);
    } finally {
      setIsInitialLoad(false);
    }
  }, []);

  // --- Polling Logic ---

  useEffect(() => {
    if (serverStatus !== "loading") return;

    const interval = setInterval(async () => {
      await syncStatus();
    }, 3000);

    return () => clearInterval(interval);
  }, [serverStatus, syncStatus]);

  // --- Life Cycle ---

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  // --- Handlers ---

  const handleStateChange = async (state: ServerState) => {
    setLoadingAction(state);
    setFeedback(null);
    try {
      await api.put("/mine/state", { state });
      setFeedback({
        type: "success",
        msg: `Signal sent: ${state.toUpperCase()}...`,
      });
      onStatusChange("loading");
    } catch (error: any) {
      setFeedback({
        type: "error",
        msg: error.response?.data?.message || "Error sending signal",
      });
    } finally {
      setLoadingAction(null);
    }
  };

  const handlePropertySave = async () => {
    if (!properties) return;
    setFeedback(null);
    setIsSavingProps(true);
    try {
      await api.put("/mine/properties", { properties });
      setFeedback({ type: "success", msg: "Applying changes. Restarting..." });
      setShowConfig(false);
      onStatusChange("loading");
    } catch (error: any) {
      setFeedback({
        type: "error",
        msg: error.response?.data?.message || "Error saving properties",
      });
    } finally {
      setIsSavingProps(false);
    }
  };

  // --- Skeleton View ---

  if (isInitialLoad) {
    return (
      <div className="p-6 animate-pulse">
        <div className="h-6 w-32 bg-gray-200 rounded mb-8"></div>
        <div className="flex gap-3 justify-center mb-10">
          <div className="h-10 w-24 bg-gray-200 rounded-lg"></div>
          <div className="h-10 w-24 bg-gray-200 rounded-lg"></div>
          <div className="h-10 w-24 bg-gray-200 rounded-lg"></div>
        </div>
        <div className="h-4 w-40 bg-gray-100 mx-auto rounded"></div>
      </div>
    );
  }

  return (
    <div className="p-6 relative overflow-hidden transition-all">
      <h2 className="text-xl font-bold text-gray-800 mb-8 flex items-center gap-2">
        <span>🎮</span> Server Control
      </h2>

      <div className="flex gap-3 justify-center mb-6">
        <ActionButton
          label="Start"
          color="bg-green-600"
          isLoading={loadingAction === "on"}
          onClick={() => handleStateChange("on")}
          disabled={serverStatus === "on" || serverStatus === "loading"}
        />
        <ActionButton
          label="Restart"
          color="bg-orange-500"
          isLoading={loadingAction === "restart"}
          onClick={() => handleStateChange("restart")}
          disabled={serverStatus === "off" || serverStatus === "loading"}
        />
        <ActionButton
          label="Stop"
          color="bg-red-600"
          isLoading={loadingAction === "off"}
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
            className={`transition-transform duration-200 ${
              showConfig ? "rotate-90" : ""
            }`}
          >
            ⚙️
          </span>
          {showConfig
            ? "Hide Advanced Settings"
            : "Configure Server Properties"}
        </button>
      </div>

      {showConfig && properties && (
        <div className="mt-6 bg-gray-50 p-5 rounded-lg border border-gray-200 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="col-span-1 md:col-span-2">
              <Label>MOTD (Message of the Day)</Label>
              <input
                type="text"
                value={properties.motd}
                onChange={(e) =>
                  setProperties({ ...properties, motd: e.target.value })
                }
                className="w-full mt-1 p-2 bg-white border border-gray-300 rounded text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
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
              <Label>Max Players</Label>
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
            className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 rounded-lg shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSavingProps ? "Saving & Restarting..." : "Save & Apply Changes"}
          </button>
        </div>
      )}

      {feedback && (
        <div
          className={`mt-4 p-3 rounded-md text-sm text-center font-medium animate-in zoom-in-95 duration-200 ${
            feedback.type === "success"
              ? "bg-green-50 text-green-700 border border-green-100"
              : "bg-red-50 text-red-700 border border-red-100"
          }`}
        >
          {feedback.msg}
        </div>
      )}
    </div>
  );
};

// --- Sub-Components ---

const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
    {children}
  </label>
);

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
    className={`${color} text-white font-bold py-2 px-6 rounded-lg shadow-md hover:brightness-110 transition-all disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed min-w-[100px] flex justify-center items-center h-10`}
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
    <Label>{label}</Label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full mt-1 p-2 bg-white border border-gray-300 rounded text-sm outline-none capitalize cursor-pointer focus:border-blue-500"
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
      className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${
        checked ? "bg-green-500" : "bg-gray-200"
      }`}
    >
      <span
        className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform duration-200 ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  </div>
);

export default ServerController;
