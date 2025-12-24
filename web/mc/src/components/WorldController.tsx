import React, { useState, useEffect, useCallback } from "react";
import {
  KeyIcon,
  UserGroupIcon,
  InformationCircleIcon,
  ClipboardDocumentCheckIcon,
  ClipboardDocumentIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  UserMinusIcon,
  NoSymbolIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import api from "./api";

interface WorldState {
  version: string;
  totalSize: string;
  seed: string;
  playerCount: number;
  maxPlayers: string;
  difficulty: string;
  gamemode: string;
  weather: string;
  entities: string;
  gameTime: string;
  motd: string;
}

interface WorldControllerProps {
  onStatusChange: (status: "on" | "off" | "loading") => void;
  syncStatus: () => Promise<void>;
}

const WorldController: React.FC<WorldControllerProps> = ({
  onStatusChange,
  syncStatus,
}) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<WorldState | null>(null);
  const [copied, setCopied] = useState(false);

  // Management States
  const [targetPlayer, setTargetPlayer] = useState("");
  const [banReason, setBanReason] = useState("");
  const [isKicking, setIsKicking] = useState(false);
  const [isBanning, setIsBanning] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Reset states
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetSeed, setResetSeed] = useState("");
  const [isResetting, setIsResetting] = useState(false);

  const [resetProgress, setResetProgress] = useState(0);
  const RESET_TIMEOUT = 120000; // 120 seconds

  const fetchAllData = useCallback(async () => {
    try {
      const [liveRes, propRes] = await Promise.all([
        api.get("/mine/live"),
        api.get("/mine/properties"),
      ]);

      const live = liveRes.data.live_info;
      const props = propRes.data.properties;

      setData({
        version: live.world_info.version,
        totalSize: live.world_info.total_size,
        seed: live.world_info.seed,
        playerCount: live.live_status.player_count,
        maxPlayers: props["max-players"],
        difficulty: props.difficulty,
        gamemode: props.gamemode,
        weather: live.environment.weather,
        entities: live.live_status.entities_loaded,
        gameTime: live.environment.game_time,
        motd: props.motd,
      });
    } catch (err) {
      console.error("Failed to fetch world data", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const showFeedback = (type: "success" | "error", message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleKick = async () => {
    if (!targetPlayer || isKicking) return;
    setIsKicking(true);
    try {
      await api.post("/mine/players/kick", { player: targetPlayer });
      setTargetPlayer("");
      showFeedback("success", "Player kicked successfully");
    } catch (err) {
      showFeedback("error", "Failed to kick player");
    } finally {
      setIsKicking(false);
    }
  };

  const handleBan = async () => {
    if (!targetPlayer || isBanning) return;
    setIsBanning(true);
    try {
      await api.post("/mine/players/ban", {
        player: targetPlayer,
        reason: banReason || "Banned by administrator",
      });
      setTargetPlayer("");
      setBanReason("");
      showFeedback("success", "Player banned successfully");
    } catch (err) {
      showFeedback("error", "Failed to ban player");
    } finally {
      setIsBanning(false);
    }
  };

  const handleResetWorld = async () => {
    // 1. Immediate UI state changes
    setIsResetting(true);
    setResetProgress(0);
    onStatusChange("loading");
    setIsResetModalOpen(false);

    // 2. Start the timer IMMEDIATELY
    const startTime = Date.now();

    const pollInterval = setInterval(async () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / RESET_TIMEOUT) * 90, 90);
      setResetProgress(progress);

      // Only start polling the status after a short delay (e.g., 5s)
      // to give the server time to actually shut down/start reset
      if (elapsed > 5000) {
        try {
          const res = await api.get("/mine/status");
          if (res.data.status === "on") {
            setResetProgress(100);
            setTimeout(() => {
              onStatusChange("on");
              clearInterval(pollInterval);
              setIsResetting(false);
              setResetProgress(0);
              fetchAllData();
            }, 500);
          }
        } catch (err) {
          /* Server is down/restarting */
        }
      }

      if (elapsed > RESET_TIMEOUT) {
        clearInterval(pollInterval);
        setIsResetting(false);
        setResetProgress(0);
        syncStatus();
      }
    }, 1000);

    // 3. Fire the API request in the background
    try {
      await api.post("/mine/world/reset", { seed: resetSeed });
    } catch (err) {
      // If the initial request fails, we stop everything
      clearInterval(pollInterval);
      showFeedback("error", "Reset request failed");
      setIsResetting(false);
      setResetProgress(0);
      syncStatus();
    } finally {
      setResetSeed("");
    }
  };

  const copySeed = () => {
    if (!data?.seed) return;
    navigator.clipboard.writeText(data.seed);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6 text-left">
          <div className="flex justify-between">
            <div className="space-y-2">
              <div className="h-6 w-48 bg-gray-100 rounded-md" />
              <div className="h-3 w-32 bg-gray-100 rounded-md" />
            </div>
            <div className="h-10 w-24 bg-gray-100 rounded-md" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-24 bg-gray-50 rounded-2xl" />
            <div className="h-24 bg-gray-50 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="p-8 animate-in fade-in duration-300">
        {/* Header Info */}
        <div className="flex items-start justify-between mb-8">
          <div className="text-left">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <span>🌎</span> {data?.motd || "Minecraft Server"}
            </h2>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mt-1 flex items-center gap-2">
              Version {data?.version} • <ClockIcon className="h-3 w-3" />{" "}
              {data?.gameTime || "00:00"}
            </p>
          </div>
          <div className="text-right">
            <span className="text-2xl font-black text-blue-600 leading-none block">
              {data?.totalSize || "-"}
            </span>
            <span className="text-[10px] font-bold text-gray-400 uppercase">
              Storage
            </span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 border border-gray-100 p-4 rounded-2xl relative overflow-hidden group">
            <div className="flex justify-between items-start relative z-10">
              <div className="max-w-[80%] text-left">
                <p className="text-[10px] font-black text-gray-400 uppercase mb-1">
                  World Seed
                </p>
                <code className="text-xs font-mono font-bold text-gray-700 break-all">
                  {data?.seed || "-"}
                </code>
              </div>
              <button
                onClick={copySeed}
                className="p-2 bg-white shadow-sm border border-gray-200 rounded-lg hover:text-blue-600 transition-all"
              >
                {copied ? (
                  <ClipboardDocumentCheckIcon className="h-4 w-4 text-green-500" />
                ) : (
                  <ClipboardDocumentIcon className="h-4 w-4" />
                )}
              </button>
            </div>
            <KeyIcon className="absolute -right-2 -bottom-2 h-16 w-16 text-gray-200/50 -rotate-12" />
          </div>

          <div className="bg-gray-50 border border-gray-100 p-4 rounded-2xl relative overflow-hidden">
            <div className="relative z-10 text-left">
              <p className="text-[10px] font-black text-gray-400 uppercase mb-1">
                Players
              </p>
              <p className="text-xl font-black text-gray-800">
                {data?.playerCount ?? "-"}{" "}
                <span className="text-gray-300">/</span>{" "}
                {data?.maxPlayers || "-"}
              </p>
            </div>
            <UserGroupIcon className="absolute -right-2 -bottom-2 h-16 w-16 text-gray-200/50" />
          </div>
        </div>

        {/* Environment Details */}
        <div className="mt-6 border-t border-gray-100 pt-6">
          <h4 className="text-[10px] font-black text-gray-400 uppercase mb-4 tracking-widest flex items-center gap-2">
            <InformationCircleIcon className="h-4 w-4" /> Environment & Rules
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
            <DetailRow label="Difficulty" value={data?.difficulty} />
            <DetailRow label="Game Mode" value={data?.gamemode} />
            <DetailRow label="Weather" value={data?.weather} />
            <DetailRow label="Entities" value={data?.entities} />
          </div>
        </div>

        {/* Player Management Section */}
        <div className="mt-6 border-t border-gray-100 pt-6">
          <h4 className="text-[10px] font-black text-gray-400 uppercase mb-4 tracking-widest flex items-center gap-2">
            <UserGroupIcon className="h-4 w-4" /> Player Management
          </h4>

          <div className="bg-gray-50/50 rounded-2xl border border-gray-100 p-5">
            {/* Feedback Message */}
            {feedback && (
              <div
                className={`mb-4 p-3 rounded-xl text-xs font-bold animate-in fade-in slide-in-from-top-2 duration-300 flex items-center gap-2 ${
                  feedback.type === "success"
                    ? "bg-green-50 text-green-700 border border-green-100"
                    : "bg-red-50 text-red-700 border border-red-100"
                }`}
              >
                {feedback.type === "success" ? "✓" : "✕"} {feedback.message}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2 text-left">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-tight">
                  Username
                </label>
                <input
                  type="text"
                  placeholder="Player name..."
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                  value={targetPlayer}
                  onChange={(e) => setTargetPlayer(e.target.value)}
                />
              </div>
              <div className="space-y-2 text-left">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-tight">
                  Reason (Bans only)
                </label>
                <input
                  type="text"
                  placeholder="Griefing, spam, etc..."
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button
                onClick={handleKick}
                disabled={!targetPlayer || isKicking}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-200 text-gray-700 text-xs font-bold rounded-xl hover:bg-orange-50 hover:text-orange-600 hover:border-orange-100 transition-all active:scale-95 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
              >
                <UserMinusIcon className="h-4 w-4" />
                {isKicking ? "Kicking..." : "Kick"}
              </button>

              <button
                onClick={handleBan}
                disabled={!targetPlayer || isBanning}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-200 text-gray-700 text-xs font-bold rounded-xl hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all active:scale-95 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
              >
                <NoSymbolIcon className="h-4 w-4" />
                {isBanning ? "Banning..." : "Ban"}
              </button>
            </div>
          </div>
        </div>

        {/* Danger Zone Section */}
        <div className="mt-6 border-t border-gray-100 pt-6">
          <h4 className="text-[10px] font-black text-red-400 uppercase mb-4 tracking-widest flex items-center gap-2">
            <ExclamationTriangleIcon className="h-4 w-4" /> Danger Zone
          </h4>

          <div className="bg-gray-50/50 rounded-2xl border border-gray-100 p-4">
            <div className="flex items-start justify-between">
              <div className="text-left">
                <p className="text-sm font-bold text-gray-700">
                  Regenerate World
                </p>
                <p className="text-xs text-gray-500">
                  Wipe dimensions and start fresh.
                </p>
              </div>
              <button
                onClick={() => setIsResetModalOpen(true)}
                disabled={isResetting}
                className="flex items-center gap-2 px-4 py-2 text-xs font-bold transition-all shadow-sm active:scale-95 rounded-xl border border-red-100 bg-white text-red-600 hover:bg-red-600 hover:text-white disabled:bg-gray-50 disabled:text-gray-400 disabled:border-gray-200 disabled:cursor-not-allowed disabled:shadow-none"
              >
                {isResetting && (
                  <ArrowPathIcon className="h-3 w-3 animate-spin" />
                )}
                <span>{isResetting ? "Reseting..." : "Reset World"}</span>
              </button>
            </div>

            {/* Progress Bar Container */}
            {isResetting && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300 mt-4">
                <div className="flex justify-between text-[10px] font-black uppercase text-gray-400">
                  <span>Rebuilding World...</span>
                  <span>{Math.round(resetProgress)}%</span>
                </div>
                <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-500 transition-all duration-1000 ease-linear"
                    style={{ width: `${resetProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-50 rounded-lg">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-xl font-black text-gray-800">Reset World?</h3>
            </div>

            <p className="text-gray-500 text-sm mb-6 leading-relaxed text-left">
              This will generate a fresh map. A safety backup will be created
              and the server will restart automatically.
            </p>

            <div className="space-y-4 mb-8">
              <div className="text-left">
                <label className="text-[10px] font-black text-gray-400 uppercase mb-1 block">
                  Custom Seed (Optional)
                </label>
                <input
                  autoFocus
                  type="text"
                  placeholder="Leave blank for random..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-mono focus:ring-2 focus:ring-red-500/20 outline-none transition-all"
                  value={resetSeed}
                  onChange={(e) => setResetSeed(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setIsResetModalOpen(false);
                  setResetSeed("");
                }}
                className="flex-1 px-4 py-3 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleResetWorld}
                disabled={isResetting}
                className="flex-1 px-4 py-3 text-sm font-bold bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all shadow-lg shadow-red-200 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
              >
                {isResetting ? "Processing..." : "Confirm Reset"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const DetailRow = ({ label, value }: { label: string; value?: string }) => (
  <div className="flex justify-between items-center text-sm border-b border-gray-0 pb-1 sm:border-0 text-left">
    <span className="text-gray-500 font-medium">{label}</span>
    <span className="font-bold text-gray-800 capitalize">{value || "—"}</span>
  </div>
);

export default WorldController;
