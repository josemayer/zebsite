import React, { useState, useEffect, useCallback } from "react";
import "./css/MinecraftManager.css";
import {
  CommandLineIcon,
  ArchiveBoxIcon,
  GlobeAmericasIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import api from "./api";
import ServerController from "./ServerController";
import BackupController from "./BackupController";
import WorldController from "./WorldController";
import { StatusBadge } from "./StatusComponents";

type TabID = "server" | "backups" | "world";
type LiveStatus = "on" | "off" | "loading";

const MinecraftManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabID>("server");
  const [serverStatus, setServerStatus] = useState<LiveStatus>("off");
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

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
          <nav className="flex items-end gap-2 h-[52px]">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabID)}
                  className={`
                  relative flex items-center gap-2 px-5 py-3 font-bold text-xs uppercase tracking-wider transition-all duration-200
                  border-t border-x rounded-t-xl
                  ${
                    isActive
                      ? "bg-white text-blue-600 border-gray-200 z-10 h-[48px] active-tab-curve"
                      : "bg-gray-200/50 text-gray-400 border-transparent hover:bg-gray-200 h-[40px] mb-0"
                  }
                `}
                >
                  <tab.icon
                    className={`h-4 w-4 ${
                      isActive ? "text-blue-600" : "text-gray-400"
                    }`}
                  />
                  <span className="hidden sm:inline">{tab.label}</span>

                  {/* Visual Fix: Seamless connection to container */}
                  {isActive && (
                    <div className="absolute -bottom-[2px] left-0 right-0 h-[3px] bg-white z-20" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right: Status & Global Actions */}
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={fetchStatus}
              disabled={isRefreshing}
              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-white rounded-lg transition-all"
              title="Refresh Status"
            >
              <ArrowPathIcon
                className={`h-5 w-5 ${isRefreshing ? "animate-spin" : ""}`}
              />
            </button>
            <StatusBadge status={serverStatus} />
          </div>
        </div>

        {/* --- Main Content Container --- */}
        <div className="bg-white rounded-xl rounded-tl-none shadow-xl border border-gray-200 relative z-0">
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
            {activeTab === "world" && <WorldController />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MinecraftManager;
