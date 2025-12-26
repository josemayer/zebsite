import React, { useState, useEffect, useCallback } from "react";
import "./css/MinecraftManager.css";
import {
  CommandLineIcon,
  ArchiveBoxIcon,
  GlobeAmericasIcon,
  PuzzlePieceIcon,
} from "@heroicons/react/24/outline";
import api from "./api";
import ServerController from "./ServerController";
import BackupController from "./BackupController";
import WorldController from "./WorldController";
import ConfigController from "./ConfigController";
import { StatusBadge } from "./StatusComponents";

type TabID = "server" | "backups" | "world" | "mods";
type LiveStatus = "on" | "off" | "loading";

const MinecraftManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabID>("server");
  const [serverStatus, setServerStatus] = useState<LiveStatus>("off");
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await api.get("/mine/status");
      setServerStatus(res.data.status);
    } catch (err) {
      console.error(err);
    } finally {
      setIsInitialLoad(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const tabs = [
    { id: "server", label: "Server", icon: CommandLineIcon },
    { id: "backups", label: "Backups", icon: ArchiveBoxIcon },
    { id: "world", label: "World", icon: GlobeAmericasIcon },
    { id: "mods", label: "Mods", icon: PuzzlePieceIcon },
  ];

  if (isInitialLoad)
    return (
      <div className="p-20 text-center animate-pulse text-gray-400">
        Loading Manager...
      </div>
    );
  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* --- Unified Tab & Control Bar --- */}
        <div className="flex items-end justify-between px-2">
          {/* Left: Folder Tabs */}
          <nav className="flex items-end gap-2 h-[52px] relative z-10">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const isServerTab = tab.id === "server";
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabID)}
                  className={`
                  relative flex items-center gap-2 px-5 py-3 font-bold text-xs uppercase tracking-wider transition-all duration-200
                  border-t border-x rounded-t-xl
                  ${
                    isActive
                      ? "bg-white text-blue-600 border-gray-200 h-[48px] active-tab-curve"
                      : "bg-gray-200/50 text-gray-400 border-transparent hover:bg-gray-200 h-[40px] mb-0"
                  }
                `}
                >
                  <div className="relative flex items-center justify-center">
                    <tab.icon
                      className={`h-4 w-4 ${
                        isActive ? "text-blue-600" : "text-gray-400"
                      }`}
                    />
                    {/* Status Beacon - Nested correctly within the icon branch */}
                    {isServerTab && (
                      <span
                        className={`sm:hidden absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full border-2 border-white
                        ${
                          serverStatus === "on"
                            ? "bg-emerald-500"
                            : serverStatus === "loading"
                            ? "bg-amber-500"
                            : "bg-slate-400"
                        }
                      `}
                      >
                        {/* Visual Pulse for Loading State */}
                        {serverStatus === "loading" && (
                          <span className="absolute inset-0 rounded-full bg-amber-500 animate-ping opacity-75"></span>
                        )}
                      </span>
                    )}
                  </div>
                  <span className="hidden sm:inline">{tab.label}</span>

                  {/* Visual Fix: Seamless connection to container */}
                  {isActive && (
                    <div className="absolute -bottom-[2px] left-0 right-0 h-[3px] bg-white" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right: Status & Global Actions */}
          <div className="sm:flex mb-2 hidden">
            <StatusBadge status={serverStatus} />
          </div>
        </div>

        {/* --- Main Content Container --- */}
        <div className="bg-white rounded-xl rounded-tl-none shadow-xl border border-gray-200 relative">
          <div className="p-1">
            {activeTab === "server" && (
              <ServerController
                serverStatus={serverStatus}
                onStatusChange={(s) => setServerStatus(s)}
                syncStatus={fetchStatus}
              />
            )}
            {activeTab === "backups" && (
              <BackupController
                onStatusChange={(s) => setServerStatus(s)}
                syncStatus={fetchStatus}
              />
            )}
            {activeTab === "world" && (
              <WorldController
                onStatusChange={(s) => setServerStatus(s)}
                syncStatus={fetchStatus}
              />
            )}
            {activeTab === "mods" && (
              <ConfigController
                onStatusChange={(s) => setServerStatus(s)}
                syncStatus={fetchStatus}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MinecraftManager;
