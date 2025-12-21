import React, { useState, useEffect, useCallback } from "react";
import {
  CommandLineIcon,
  ArchiveBoxIcon,
  GlobeAmericasIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import api from "./api";
import ServerController from "./ServerController";
import BackupController from "./BackupController";
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
        {/* Header Section */}
        <div className="flex justify-between items-center mb-8 px-2">
          <h1 className="text-2xl font-black text-gray-800 tracking-tight">
            MineDash
          </h1>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchStatus}
              className={`${
                isRefreshing ? "animate-spin" : ""
              } p-2 text-gray-400 hover:text-blue-600 transition-colors`}
            >
              <ArrowPathIcon className="h-5 w-5" />
            </button>
            <StatusBadge status={serverStatus} />
          </div>
        </div>

        {/* --- Folder Style Tabs --- */}
        <div className="flex justify-center">
          <nav className="flex items-end px-4">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabID)}
                  className={`
                    relative flex items-center gap-2 px-6 py-3 font-bold text-sm transition-all duration-200
                    border-t border-x rounded-t-xl mx-[-1px]
                    ${
                      isActive
                        ? "bg-white text-blue-600 border-gray-200 z-10 h-[52px]"
                        : "bg-gray-200/80 text-gray-500 border-transparent hover:bg-gray-200 h-[45px] mt-[7px]"
                    }
                  `}
                >
                  <tab.icon
                    className={`h-5 w-5 ${
                      isActive ? "text-blue-600" : "text-gray-400"
                    }`}
                  />
                  <span className="hidden sm:inline">{tab.label}</span>

                  {/* Visual Fix: This small white block hides the container's top border when the tab is active */}
                  {isActive && (
                    <div className="absolute -bottom-[2px] left-0 right-0 h-[3px] bg-white z-20" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* --- Main Content Container --- */}
        <div className="bg-white rounded-xl shadow-xl border border-gray-200 relative z-0">
          <div className="p-1">
            {" "}
            {/* Tiny padding to prevent layout shifts */}
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
              <div className="p-10 text-center text-gray-400">
                <GlobeAmericasIcon className="h-12 w-12 mx-auto mb-2 opacity-20" />
                <p>World Management Module</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MinecraftManager;
