import React, { useState, useEffect, useCallback } from "react";
import {
  PlayIcon,
  ArrowPathIcon,
  StopIcon,
  ChevronDownIcon,
  CheckCircleIcon,
  XCircleIcon,
  CpuChipIcon,
} from "@heroicons/react/24/outline";
import api from "./api";

// --- Types ---
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
  const [successAction, setSuccessAction] = useState<ServerState | null>(null);
  const [propFeedback, setPropFeedback] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);

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

  useEffect(() => {
    if (serverStatus !== "loading") return;
    const interval = setInterval(async () => {
      await syncStatus();
    }, 3000);
    return () => clearInterval(interval);
  }, [serverStatus, syncStatus]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  const handleStateChange = async (state: ServerState) => {
    setLoadingAction(state);
    try {
      await api.put("/mine/state", { state });
      setSuccessAction(state); // Set button to success state
      onStatusChange("loading");
      setTimeout(() => setSuccessAction(null), 2500);
    } catch (error) {
      setPropFeedback({ type: "error", msg: "State change failed" });
      setTimeout(() => setPropFeedback(null), 3000);
    } finally {
      setLoadingAction(null);
    }
  };

  const handlePropertySave = async () => {
    if (!properties) return;
    setIsSavingProps(true);
    setPropFeedback(null);
    try {
      await api.put("/mine/properties", { properties });
      setPropFeedback({
        type: "success",
        msg: "Properties saved. Restarting server...",
      });
      onStatusChange("loading");
      // Keep message visible for a moment before closing or clearing
      setTimeout(() => {
        setPropFeedback(null);
        setShowConfig(false);
      }, 3000);
    } catch (error) {
      setPropFeedback({ type: "error", msg: "Failed to save properties" });
    } finally {
      setIsSavingProps(false);
    }
  };

  if (isInitialLoad) return <ServerSkeleton />;

  const isBusy = serverStatus === "loading";

  return (
    <div className="p-8 animate-in fade-in duration-300">
      {/* Header Info */}
      <div className="flex items-center justify-between mb-8">
        <div className="text-left">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <span>⚙️</span> Server Management
          </h2>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
            Core Control and Config
          </p>
        </div>
      </div>

      {/* Action Buttons - Minimal Approach */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MiniActionCard
          label="Start"
          sublabel="Power on instance"
          icon={<PlayIcon />}
          theme="green"
          isLoading={loadingAction === "on"}
          isSuccess={successAction === "on"}
          onClick={() => handleStateChange("on")}
          disabled={serverStatus === "on" || isBusy}
        />
        <MiniActionCard
          label="Restart"
          sublabel="Cycle process"
          icon={<ArrowPathIcon />}
          theme="orange"
          isLoading={loadingAction === "restart"}
          isSuccess={successAction === "restart"}
          onClick={() => handleStateChange("restart")}
          disabled={serverStatus === "off" || isBusy}
        />
        <MiniActionCard
          label="Stop"
          sublabel="Graceful shutdown"
          icon={<StopIcon />}
          theme="red"
          isLoading={loadingAction === "off"}
          isSuccess={successAction === "off"}
          onClick={() => handleStateChange("off")}
          disabled={serverStatus === "off" || isBusy}
        />
      </div>

      <div className="border-t border-gray-100 my-6"></div>

      {/* Advanced Config Section */}
      <div>
        <button
          onClick={() => setShowConfig(!showConfig)}
          className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all active:scale-[0.99] ${
            showConfig
              ? "bg-gray-50 border-blue-100 shadow-inner"
              : "bg-white border-gray-100 hover:border-gray-200"
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-lg ${
                showConfig
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-400"
              }`}
            >
              <CpuChipIcon className="h-4 w-4" />
            </div>
            <div className="text-left">
              <p className="text-xs font-bold text-gray-700">
                World Configuration
              </p>
              <p className="text-[10px] text-gray-400 uppercase font-bold tracking-tight">
                Adjust server.properties
              </p>
            </div>
          </div>
          <ChevronDownIcon
            className={`h-4 w-4 text-gray-400 transition-transform ${
              showConfig ? "rotate-180" : ""
            }`}
          />
        </button>
        {showConfig && properties && (
          <div className="mt-3 space-y-4 animate-in slide-in-from-top-2 duration-200">
            {/* INLINE PROPERTY FEEDBACK */}
            {propFeedback && (
              <div
                className={`p-3 rounded-xl border text-[11px] font-bold flex items-center gap-2 animate-in fade-in zoom-in ${
                  propFeedback.type === "success"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                    : "bg-rose-50 text-rose-700 border-rose-100"
                }`}
              >
                {propFeedback.type === "success" ? (
                  <CheckCircleIcon className="h-4 w-4" />
                ) : (
                  <XCircleIcon className="h-4 w-4" />
                )}
                {propFeedback.msg}
              </div>
            )}

            {/* Using fieldset to disable all child inputs at once */}
            <fieldset
              disabled={isSavingProps || isBusy}
              className="bg-gray-50/50 rounded-2xl border border-gray-100 p-6 disabled:opacity-60 disabled:cursor-not-allowed transition-opacity"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2 space-y-1.5 text-left">
                  <Label>Message of the Day</Label>
                  <input
                    type="text"
                    value={properties.motd}
                    onChange={(e) =>
                      setProperties({ ...properties, motd: e.target.value })
                    }
                    className="w-full bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
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

                <div className="space-y-3">
                  <Label>Security Flags</Label>
                  <div className="grid grid-cols-1 gap-2">
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

                <div className="space-y-1.5 text-left">
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
                    className="w-full bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-sm outline-none focus:bg-white focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              <button
                onClick={handlePropertySave}
                disabled={isSavingProps || isBusy}
                className="w-full mt-6 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest py-3.5 rounded-lg hover:bg-blue-700 active:scale-95 transition-all disabled:bg-gray-400 disabled:shadow-none"
              >
                {isSavingProps
                  ? "Deploying Configuration..."
                  : "Update Configuration"}
              </button>
            </fieldset>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Sub-Components ---

const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <label className="text-[10px] font-black text-gray-400 uppercase tracking-tight block ml-0.5">
    {children}
  </label>
);

const MiniActionCard: React.FC<{
  label: string;
  sublabel: string;
  icon: React.ReactNode;
  theme: "green" | "orange" | "red";
  isLoading: boolean;
  isSuccess: boolean;
  onClick: () => void;
  disabled: boolean;
}> = ({
  label,
  sublabel,
  icon,
  theme,
  isLoading,
  isSuccess,
  onClick,
  disabled,
}) => {
  const themes = {
    green:
      "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200 ring-emerald-500/20",
    orange:
      "bg-amber-500 hover:bg-amber-600 text-white shadow-amber-200 ring-amber-500/20",
    red: "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-200 ring-rose-500/20",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || isLoading || isSuccess}
      className={`
        relative overflow-hidden flex flex-row sm:flex-col items-center sm:items-start 
        p-3.5 sm:p-5 rounded-2xl border transition-all duration-200 group gap-3 sm:gap-0
        ${
          disabled
            ? "bg-gray-50 border-gray-100 text-gray-400 cursor-not-allowed shadow-none"
            : isSuccess
            ? "bg-green-500 text-white border-transparent ring-4 ring-green-500/20 shadow-lg"
            : `border-transparent shadow-lg hover:shadow-xl active:scale-95 ring-4 ${themes[theme]}`
        }
      `}
    >
      {/* Icon - Smaller on mobile, standard on desktop */}
      <div
        className={`
        p-2 rounded-xl sm:mb-3 transition-transform duration-300 flex-shrink-0
        ${
          disabled
            ? "bg-gray-200 text-gray-400"
            : `bg-white/20 text-white ${!isSuccess && "group-hover:scale-110"}`
        }
      `}
      >
        {isLoading ? (
          <div className="h-4 w-4 sm:h-5 sm:w-5 border-2 border-current border-t-transparent animate-spin rounded-full" />
        ) : isSuccess ? (
          <CheckCircleIcon className="h-4 w-4 sm:h-5 sm:w-5 animate-in zoom-in duration-300" />
        ) : (
          React.cloneElement(icon as React.ReactElement, {
            className: "h-4 w-4 sm:h-5 sm:w-5 stroke-[2.5px]",
          })
        )}
      </div>

      <div className="text-left">
        <p
          className={`text-[10px] sm:text-xs font-black uppercase tracking-widest leading-none ${
            disabled ? "text-gray-400" : "text-white"
          }`}
        >
          {isSuccess ? "Signal Sent" : label}
        </p>
        <p
          className={`text-[9px] sm:text-[10px] font-medium mt-0.5 leading-none ${
            disabled ? "text-gray-300" : "text-white/70"
          }`}
        >
          {isSuccess ? "Executing..." : sublabel}
        </p>
      </div>
    </button>
  );
};

const SelectField: React.FC<{
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}> = ({ label, value, options, onChange }) => (
  <div className="space-y-1.5 text-left">
    <Label>{label}</Label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-sm font-bold outline-none capitalize cursor-pointer focus:bg-white focus:border-blue-500 transition-all"
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
  <div className="flex items-center justify-between bg-gray-50 px-3 py-2.5 rounded-lg border border-gray-100">
    <span className="text-[10px] text-gray-500 font-black uppercase tracking-tight">
      {label}
    </span>
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors duration-200 ${
        checked ? "bg-green-500" : "bg-gray-300"
      }`}
    >
      <span
        className={`inline-block h-2.5 w-2.5 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
          checked ? "translate-x-4.5" : "translate-x-1"
        }`}
        style={{
          transform: checked ? "translateX(1.125rem)" : "translateX(0.25rem)",
        }}
      />
    </button>
  </div>
);

const ServerSkeleton = () => (
  <div className="p-8 space-y-6 animate-pulse">
    <div className="flex justify-between items-center">
      <div className="h-8 w-48 bg-gray-100 rounded-lg" />
    </div>
    <div className="grid grid-cols-3 gap-3">
      <div className="h-14 bg-gray-50 rounded-xl" />
      <div className="h-14 bg-gray-50 rounded-xl" />
      <div className="h-14 bg-gray-50 rounded-xl" />
    </div>
  </div>
);

export default ServerController;
