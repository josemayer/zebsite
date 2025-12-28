import React, {
  forwardRef,
  useImperativeHandle,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
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
import {
  CommandLineIcon,
  PaperAirplaneIcon,
  TrashIcon,
  NoSymbolIcon as NoSymbolIconSolid,
} from "@heroicons/react/24/solid";
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

interface ConsoleProps {
  onExecute: (command: string) => Promise<{ success: boolean; output: string }>;
  isServerOnline: boolean;
  isResetting: boolean;
}

interface ConsoleHandle {
  clear: () => void;
  addLog: (
    msg: string,
    type: "command" | "response" | "error" | "system"
  ) => void;
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

  const consoleRef = useRef<ConsoleHandle>(null);

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
      consoleRef.current?.addLog(
        `System: Kicked player ${targetPlayer}`,
        "system"
      );
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
      consoleRef.current?.addLog(
        `System: Banned player ${targetPlayer} for reason ${
          banReason || "Banned by administrator"
        }`,
        "system"
      );
      setTargetPlayer("");
      setBanReason("");
      showFeedback("success", "Player banned successfully");
    } catch (err) {
      showFeedback("error", "Failed to ban player");
    } finally {
      setIsBanning(false);
    }
  };

  const handleExecuteConsole = async (command: string) => {
    const res = await api.post(
      "/mine/console",
      { command },
      { timeout: 15000 }
    );

    return res.data;
  };

  const handleResetWorld = async () => {
    // 1. Immediate UI state changes
    setIsResetting(true);
    setResetProgress(0);
    onStatusChange("loading");
    setIsResetModalOpen(false);

    consoleRef.current?.addLog(
      "System: World regeneration initialized...",
      "system"
    );

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
            consoleRef.current?.addLog(
              "System: World rebuilt and server online.",
              "system"
            );
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

        {/* Console Section */}
        <div className="mt-6 border-t border-gray-100 pt-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <CommandLineIcon className="h-4 w-4" /> Remote Console
            </h4>
            <button
              onClick={() => consoleRef.current?.clear()}
              className="text-[10px] font-bold text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1"
            >
              <TrashIcon className="h-3 w-3" /> Clear
            </button>
          </div>
          <Console
            ref={consoleRef}
            onExecute={handleExecuteConsole}
            isServerOnline={data !== null}
            isResetting={isResetting}
          />
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

interface LogEntry {
  msg: string;
  type: "command" | "response" | "error" | "system";
  timestamp: string;
}

const COMMAND_SUGGESTIONS = [
  "/list",
  "/seed",
  "/weather clear",
  "/weather rain",
  "/gamemode creative",
  "/gamemode survival",
  "/stop",
  "/kick ",
  "/ban ",
  "/op ",
  "/deop ",
  "/say ",
  "/help",
];

const Console = forwardRef<ConsoleHandle, ConsoleProps>(
  ({ onExecute, isServerOnline, isResetting }, ref) => {
    useImperativeHandle(ref, () => ({
      clear: () => {
        setLogs([]);
      },
      addLog: (msg, type) => {
        setLogs((prev) => [
          ...prev,
          {
            msg,
            type,
            timestamp: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            }),
          },
        ]);
      },
    }));

    const [input, setInput] = useState("");
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [isExecuting, setIsExecuting] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const [history, setHistory] = useState<string[]>([]);
    const historyRef = useRef<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [tempInput, setTempInput] = useState("");
    const [suggestion, setSuggestion] = useState("");
    const isFirstRender = useRef(true);

    const inputRef = useRef<HTMLInputElement>(null);

    // 1. Auto-focus when the server comes online OR when execution finishes
    useEffect(() => {
      if (isFirstRender.current) {
        isFirstRender.current = false;
        return;
      }
      if (!isExecuting) {
        // Small delay ensures the DOM has re-enabled the element
        const timer = setTimeout(() => {
          inputRef.current?.focus();
        }, 10);
        return () => clearTimeout(timer);
      }
    }, [isExecuting]);

    // Auto-scroll logic
    useEffect(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, [logs, isExecuting]);

    // Auto-suggestion
    useEffect(() => {
      if (input.startsWith("/") && input.length > 1) {
        const match = COMMAND_SUGGESTIONS.find((cmd) => cmd.startsWith(input));
        // Only show if the match is longer than what we already typed
        setSuggestion(match && match !== input ? match : "");
      } else {
        setSuggestion("");
      }
    }, [input]);

    const handleSubmit = async (e?: React.FormEvent) => {
      e?.preventDefault();
      if (!input.trim() || isExecuting || !isServerOnline) return;

      const cmd = input.trim();
      const time = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });

      const newHistory =
        history[history.length - 1] === cmd ? history : [...history, cmd];
      setHistory(newHistory);
      historyRef.current = newHistory;
      setHistoryIndex(-1);
      setTempInput("");

      setInput("");
      setIsExecuting(true);

      setLogs((prev) => [
        ...prev,
        { msg: `> ${cmd}`, type: "command", timestamp: time },
      ]);

      try {
        const res = await onExecute(cmd);
        setLogs((prev) => [
          ...prev,
          {
            msg: res.output || "Done.",
            type: res.success ? "response" : "error",
            timestamp: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
          },
        ]);
      } catch (err) {
        setLogs((prev) => [
          ...prev,
          {
            msg: "Connection timeout.",
            type: "error",
            timestamp: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
          },
        ]);
      } finally {
        setIsExecuting(false);
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      const currentHistory = historyRef.current; // Get the most recent values

      if (e.key === "ArrowUp") {
        e.preventDefault();
        if (currentHistory.length === 0) return;

        setHistoryIndex((prevIndex) => {
          const nextIndex = prevIndex + 1;
          if (nextIndex >= currentHistory.length) return prevIndex;

          if (prevIndex === -1) setTempInput(input);

          // Now this points to the correct, freshly updated history!
          setInput(currentHistory[currentHistory.length - 1 - nextIndex]);
          return nextIndex;
        });
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setHistoryIndex((prevIndex) => {
          const nextIndex = prevIndex - 1;
          if (nextIndex >= 0) {
            setInput(currentHistory[currentHistory.length - 1 - nextIndex]);
            return nextIndex;
          } else {
            setInput(tempInput);
            return -1;
          }
        });
      }

      if ((e.key === "Tab" || e.key === "ArrowRight") && suggestion) {
        if (inputRef.current?.selectionStart === input.length) {
          e.preventDefault();
          setInput(suggestion);
          setSuggestion("");
        }
      }
    };

    return (
      <div
        className={`bg-slate-900 rounded-2xl border transition-all duration-300 ${
          isResetting
            ? "border-yellow-500/50 ring-1 ring-yellow-500/20"
            : isServerOnline
            ? "border-slate-800 shadow-xl"
            : "border-red-900/30 opacity-80"
        } overflow-hidden flex flex-col`}
      >
        {/* Terminal Output */}
        <div
          ref={scrollRef}
          className="h-52 overflow-y-auto p-4 font-mono text-[11px] space-y-1.5 scroll-smooth text-left scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent"
        >
          {!isServerOnline && (
            <div className="flex items-center gap-2 text-red-400 bg-red-400/10 p-2 rounded-lg mb-2">
              <NoSymbolIconSolid className="h-4 w-4" />
              <span>Console disabled: Server is offline</span>
            </div>
          )}
          {logs.map((log, i) => (
            <div
              key={i}
              className={`group flex flex-col mb-1 ${
                log.type === "command" ? "mt-2" : ""
              }`}
            >
              <div
                className={`flex justify-between items-baseline gap-4 break-all leading-relaxed whitespace-pre-wrap font-mono text-left ${
                  log.type === "command"
                    ? "text-blue-400 font-bold"
                    : log.type === "error"
                    ? "text-red-400"
                    : log.type === "system"
                    ? "text-amber-400 italic"
                    : "text-emerald-400"
                }`}
              >
                {/* The Message */}
                <span>{log.msg}</span>

                {/* The Time Marker - Only show for commands, or make it subtle for responses */}
                {log.type === "command" && (
                  <span className="text-[9px] font-medium text-slate-500 tabular-nums shrink-0">
                    {log.timestamp}
                  </span>
                )}
              </div>
            </div>
          ))}
          {isExecuting && (
            <div className="text-slate-500 animate-pulse flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" />
              Processing request...
            </div>
          )}
        </div>

        {/* Command Input Section */}
        <form
          onSubmit={handleSubmit}
          className="bg-slate-800/50 p-2 border-t border-slate-700/50"
        >
          <div className="flex gap-2">
            <div className="flex-1 relative bg-slate-900 rounded-lg overflow-hidden border border-slate-700 focus-within:border-blue-500 transition-all">
              {/* 1. GHOST LAYER (Lowest Z-Index) */}
              {suggestion && (
                <div
                  className="absolute inset-0 px-3 py-2 text-xs font-mono pointer-events-none whitespace-pre flex items-center"
                  style={{ lineHeight: "1rem" }} // Force exact match with input
                >
                  {/* The invisible prefix pushes the ghost text to the right spot */}
                  <span className="text-transparent select-none">{input}</span>
                  {/* The visible ghost part */}
                  <span className="text-slate-600 opacity-70">
                    {suggestion.slice(input.length)}
                  </span>
                </div>
              )}

              {/* 2. REAL INPUT (Middle Z-Index, Transparent Background) */}
              <input
                ref={inputRef}
                type="text"
                autoComplete="off"
                autoCorrect="off"
                spellCheck="false"
                value={input}
                onKeyDown={handleKeyDown}
                onChange={(e) => setInput(e.target.value)}
                disabled={!isServerOnline || isExecuting || isResetting}
                placeholder={
                  !suggestion && isServerOnline ? "Enter server command..." : ""
                }
                className="relative z-10 w-full bg-transparent px-3 py-2 text-xs text-slate-100 font-mono outline-none disabled:cursor-not-allowed"
                style={{ lineHeight: "1rem" }}
              />

              {/* 3. HISTORY BADGE (Highest Z-Index) */}
              {historyIndex !== -1 && (
                <span className="absolute z-20 right-3 top-1/2 -translate-y-1/2 text-[9px] text-blue-500 font-bold uppercase tracking-tighter bg-blue-500/10 px-1 rounded pointer-events-none">
                  History {history.length - historyIndex}/{history.length}
                </span>
              )}
            </div>

            <button
              type="submit"
              disabled={
                !input.trim() || isExecuting || !isServerOnline || isResetting
              }
              className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white px-4 rounded-lg transition-all active:scale-95 flex items-center justify-center"
            >
              <PaperAirplaneIcon className="h-4 w-4" />
            </button>
          </div>

          {/* Micro-UX: Helpful hint for new users */}
          <div className="mt-1 flex justify-between px-1">
            <p className="text-[9px] text-slate-500 italic">
              Press{" "}
              <kbd className="bg-slate-700 px-1 rounded not-italic">↑</kbd> to
              cycle previous commands
            </p>
          </div>
        </form>
      </div>
    );
  }
);

export default WorldController;
