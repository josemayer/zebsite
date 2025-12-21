import React from "react";

type LiveStatus = "on" | "off" | "loading";

export const StatusBadge: React.FC<{ status: LiveStatus }> = ({ status }) => {
  const configs = {
    on: {
      bg: "bg-green-100",
      text: "text-green-700",
      dot: "bg-green-500",
      label: "Online",
      pulse: true,
    },
    off: {
      bg: "bg-gray-100",
      text: "text-gray-600",
      dot: "bg-gray-400",
      label: "Offline",
      pulse: false,
    },
    loading: {
      bg: "bg-blue-100",
      text: "text-blue-700",
      dot: "bg-blue-500",
      label: "Transitioning",
      pulse: true,
    },
  };

  const config = configs[status] || configs.off;

  return (
    <div
      className={`flex items-center gap-2 px-3 py-1 rounded-full ${config.bg} ${config.text} text-[11px] font-bold uppercase tracking-tight border border-current/10`}
    >
      <span
        className={`h-2 w-2 rounded-full ${config.dot} ${
          config.pulse ? "animate-pulse" : ""
        }`}
      />
      {config.label}
    </div>
  );
};
