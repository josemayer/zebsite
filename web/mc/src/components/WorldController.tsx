import React, { useState, useEffect, useCallback } from "react";
import {
  GlobeAmericasIcon,
  KeyIcon,
  UserGroupIcon,
  InformationCircleIcon,
  ClipboardDocumentCheckIcon,
  ClipboardDocumentIcon,
  CloudIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import api from "./api";

// This matches your combined API outputs
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

const WorldController: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<WorldState | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchAllData = useCallback(async () => {
    try {
      // Fetch both endpoints in parallel
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

  const copySeed = () => {
    if (!data?.seed) return;
    navigator.clipboard.writeText(data.seed);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
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
    <div className="p-8 animate-in fade-in duration-300">
      {/* Header Info */}
      <div className="flex items-start justify-between mb-8">
        <div>
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
        {/* Seed Card */}
        <div className="bg-gray-50 border border-gray-100 p-4 rounded-2xl relative overflow-hidden group">
          <div className="flex justify-between items-start relative z-10">
            <div className="max-w-[80%]">
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

        {/* Players Card */}
        <div className="bg-gray-50 border border-gray-100 p-4 rounded-2xl relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-[10px] font-black text-gray-400 uppercase mb-1">
              Players
            </p>
            <p className="text-xl font-black text-gray-800">
              {data?.playerCount || "-"}{" "}
              <span className="text-gray-300">/</span> {data?.maxPlayers || "-"}
            </p>
          </div>
          <UserGroupIcon className="absolute -right-2 -bottom-2 h-16 w-16 text-gray-200/50" />
        </div>
      </div>

      {/* Technical Details List */}
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
    </div>
  );
};

const DetailRow = ({ label, value }: { label: string; value?: string }) => (
  <div className="flex justify-between items-center text-sm border-b border-gray-50 pb-1 sm:border-0">
    <span className="text-gray-500 font-medium">{label}</span>
    <span className="font-bold text-gray-800 capitalize">{value || "—"}</span>
  </div>
);

export default WorldController;
