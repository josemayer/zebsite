import React from "react";

type LiveStatus = "on" | "off" | "loading";

export const StatusBadge: React.FC<{ status: LiveStatus }> = ({ status }) => {
  const config = {
    on: {
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      dot: "bg-emerald-500",
      label: "Online",
    },
    loading: {
      bg: "bg-amber-50",
      text: "text-amber-700",
      dot: "bg-amber-500",
      label: "Loading...",
    },
    off: {
      bg: "bg-slate-100",
      text: "text-slate-600",
      dot: "bg-slate-400",
      label: "Offline",
    },
  };

  const current = config[status];

  return (
    <div
      className={`flex items-center gap-2 px-3 py-1 rounded-full border border-current/10 ${current.bg} ${current.text}`}
    >
      <span className="relative flex h-2 w-2">
        {status === "loading" && (
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${current.dot}`}
          ></span>
        )}
        <span
          className={`relative inline-flex rounded-full h-2 w-2 ${current.dot}`}
        ></span>
      </span>
      <span className="text-[10px] font-black uppercase tracking-wider">
        {current.label}
      </span>
    </div>
  );
};
