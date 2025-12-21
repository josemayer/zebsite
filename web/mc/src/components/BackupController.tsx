import React, { useState, useEffect, useCallback } from "react";
import {
  ArchiveBoxIcon,
  ArrowDownTrayIcon,
  TrashIcon,
  PencilSquareIcon,
  ArrowPathRoundedSquareIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  CircleStackIcon,
} from "@heroicons/react/24/outline";
import api from "./api";

interface Backup {
  name: string;
  size_mb: number;
  created: string;
}

interface Capacity {
  current_mb: number;
  max_mb: number;
  percent_used: number;
}

interface BackupControllerProps {
  onStatusChange: (status: "on" | "off" | "loading") => void;
  syncStatus: () => Promise<void>;
}

const BackupController: React.FC<BackupControllerProps> = ({
  onStatusChange,
  syncStatus,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [backups, setBackups] = useState<Backup[]>([]);
  const [capacity, setCapacity] = useState<Capacity | null>(null);

  // UI States
  const [editingName, setEditingName] = useState<{
    file: string;
    val: string;
  } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [confirmRestore, setConfirmRestore] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await api.get("/mine/backups");
      setBackups(res.data.backups);
      setCapacity(res.data.capacity);
    } catch (err) {
      console.error("Fetch backups failed", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const parseFileName = (fullName: string) => {
    const match = fullName.match(/^(v[\d.]+_)(.*)(\.tar)$/);
    if (match) {
      return { prefix: match[1], label: match[2], suffix: match[3] };
    }
    return { prefix: "", label: fullName, suffix: "" };
  };

  // --- Logic Handlers ---

  const handleCreateBackup = async () => {
    setIsProcessing(true);
    try {
      await api.post("/mine/backups");
      await fetchData();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRename = async (oldFullName: string) => {
    if (!editingName || !editingName.val) return;

    try {
      // Send only the edited label (val), not the stitched name
      await api.put("/mine/backups/rename", {
        filename: oldFullName, // The original full name for lookup
        newName: editingName.val, // Only the "middle" part
      });
      setEditingName(null);
      await fetchData();
    } catch (err) {
      alert("Rename failed");
    }
  };

  const handleDelete = async (filename: string) => {
    try {
      await api.delete(`/mine/backups/${filename}`);
      setConfirmDelete(null);
      await fetchData();
    } catch (err) {
      alert("Delete failed");
    }
  };

  const handleRestore = async (filename: string) => {
    setIsProcessing(true);
    onStatusChange("loading");
    setConfirmRestore(null);

    try {
      await api.post("/mine/backups/restore", { filename });

      // Post-Restore Polling: 30s loop until "on"
      const startTime = Date.now();
      const pollInterval = setInterval(async () => {
        await syncStatus();
        const elapsed = Date.now() - startTime;
        // Logic inside syncStatus updates the global state.
        // We stop polling after 30s or if status becomes 'on' elsewhere.
        if (elapsed > 30000) clearInterval(pollInterval);
      }, 3000);
    } catch (err) {
      onStatusChange("off");
    } finally {
      setIsProcessing(false);
      fetchData(); // Refresh list to see the new auto-backup
    }
  };

  if (isLoading) return <BackupSkeleton />;

  return (
    <div className="p-8 animate-in fade-in duration-500">
      {/* Capacity Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <span>📦</span> Backup Management
          </h2>
          {capacity && (
            <div className="mt-2 flex items-center gap-3">
              <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
                <div
                  className={`h-full transition-all duration-500 ${
                    capacity.percent_used > 80 ? "bg-red-500" : "bg-blue-500"
                  }`}
                  style={{ width: `${capacity.percent_used}%` }}
                />
              </div>
              <span className="text-[10px] font-bold text-gray-500 uppercase">
                {capacity.current_mb}MB / {capacity.max_mb}MB (
                {capacity.percent_used}%)
              </span>
            </div>
          )}
        </div>
        <button
          onClick={handleCreateBackup}
          disabled={isProcessing}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-sm transition-all flex items-center gap-2"
        >
          {isProcessing ? (
            <div className="h-4 w-4 border-2 border-white/30 border-t-white animate-spin rounded-full" />
          ) : (
            <CircleStackIcon className="h-4 w-4" />
          )}
          Quick Backup
        </button>
      </div>

      {/* Restore Warning Alert */}
      <div className="mb-6 bg-amber-50 border border-amber-100 p-4 rounded-xl flex gap-3">
        <ExclamationTriangleIcon className="h-5 w-5 text-amber-600 shrink-0" />
        <div className="text-xs text-amber-800 leading-relaxed">
          <p className="font-bold mb-1 text-amber-900 uppercase tracking-tight">
            Restoration Policy
          </p>
          Restoring replaces the live world. A safety backup of your current
          files is created automatically. The server will restart to apply
          changes.
        </div>
      </div>

      {backups.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid gap-3">
          {backups.map((file) => (
            <div
              key={file.name}
              className="group bg-white border border-gray-100 p-4 rounded-xl hover:border-blue-200 hover:shadow-md transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  {editingName?.file === file.name ? (
                    <div className="flex items-center w-full max-w-full gap-1 group/input">
                      {/* Fixed Prefix */}
                      <span className="text-sm font-mono text-gray-400 shrink-0 select-none">
                        {parseFileName(file.name).prefix}
                      </span>

                      {/* Minimalistic Input Area */}
                      <div className="flex-1 min-w-0 flex items-center border-b-2 border-blue-500">
                        <input
                          autoFocus
                          className="w-full text-sm font-bold text-gray-800 outline-none bg-transparent py-0 px-0"
                          value={editingName.val}
                          onChange={(e) => {
                            const sanitized = e.target.value
                              .replace(/\s/g, "_")
                              .replace(/\.tar$/g, "");
                            setEditingName({ ...editingName, val: sanitized });
                          }}
                          onKeyDown={(e) =>
                            e.key === "Enter" && handleRename(file.name)
                          }
                          onBlur={() =>
                            !editingName.val && setEditingName(null)
                          }
                        />{" "}
                        {/* Suffix tucked inside the border line to keep it clean */}
                        <span className="text-sm font-mono text-gray-400 shrink-0 select-none ml-1">
                          {parseFileName(file.name).suffix}
                        </span>
                      </div>

                      {/* Minimal Action Buttons */}
                      <div className="flex items-center gap-1 ml-2">
                        <button
                          onClick={() => handleRename(file.name)}
                          className="text-[10px] font-black text-blue-600 hover:text-blue-800 uppercase tracking-tighter"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingName(null)}
                          className="text-[10px] font-black text-gray-400 hover:text-gray-600 uppercase tracking-tighter"
                        >
                          Esc
                        </button>
                      </div>
                    </div>
                  ) : (
                    <h3 className="text-sm font-bold text-gray-700 truncate flex items-center gap-2">
                      {file.name}
                      <button
                        onClick={() => {
                          const { label } = parseFileName(file.name);
                          setEditingName({ file: file.name, val: label });
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                      >
                        <PencilSquareIcon className="h-3.5 w-3.5 text-gray-400 hover:text-blue-500" />
                      </button>
                    </h3>
                  )}
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[10px] text-gray-400 font-medium flex items-center gap-1">
                      <ClockIcon className="h-3 w-3" /> {file.created}
                    </span>
                    <span className="text-[10px] text-gray-400 font-medium flex items-center gap-1">
                      <CircleStackIcon className="h-3 w-3" /> {file.size_mb} MB
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {/* Action Buttons */}
                  <ActionButton
                    icon={<ArrowPathRoundedSquareIcon />}
                    color="text-amber-600 hover:bg-amber-50"
                    onClick={() => setConfirmRestore(file.name)}
                    tooltip="Restore"
                  />
                  <ActionButton
                    icon={<TrashIcon />}
                    color="text-red-500 hover:bg-red-50"
                    onClick={() => setConfirmDelete(file.name)}
                    tooltip="Delete"
                  />
                </div>
              </div>

              {/* Contextual Confirmation Dialogs */}
              {confirmRestore === file.name && (
                <ConfirmBox
                  msg="Restore this backup? Server will restart."
                  onConfirm={() => handleRestore(file.name)}
                  onCancel={() => setConfirmRestore(null)}
                  confirmColor="bg-amber-600"
                />
              )}
              {confirmDelete === file.name && (
                <ConfirmBox
                  msg="Delete permanently?"
                  onConfirm={() => handleDelete(file.name)}
                  onCancel={() => setConfirmDelete(null)}
                  confirmColor="bg-red-600"
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// --- Internal UI Components ---

const ActionButton = ({ icon, color, onClick, tooltip }: any) => (
  <button
    onClick={onClick}
    className={`p-2 rounded-lg transition-colors ${color}`}
    title={tooltip}
  >
    {React.cloneElement(icon, { className: "h-5 w-5" })}
  </button>
);

const ConfirmBox = ({ msg, onConfirm, onCancel, confirmColor }: any) => (
  <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between animate-in slide-in-from-top-2">
    <span className="text-[11px] font-bold text-gray-500 uppercase">{msg}</span>
    <div className="flex gap-2">
      <button
        onClick={onCancel}
        className="text-[10px] font-bold text-gray-400 px-3 py-1"
      >
        CANCEL
      </button>
      <button
        onClick={onConfirm}
        className={`text-[10px] font-bold text-white px-3 py-1 rounded-md ${confirmColor}`}
      >
        CONFIRM
      </button>
    </div>
  </div>
);

const EmptyState = () => (
  <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
    <ArchiveBoxIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
    <p className="text-gray-500 font-medium text-sm">No backups found.</p>
    <p className="text-xs text-gray-400 mt-1">
      Manual and auto-backups will appear here.
    </p>
  </div>
);

const BackupSkeleton = () => (
  <div className="p-8 animate-pulse">
    <div className="h-8 w-48 bg-gray-200 rounded-lg mb-8" />
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-20 bg-gray-100 rounded-xl" />
      ))}
    </div>
  </div>
);

export default BackupController;
