import React, { useContext } from "react";
import { ThemeContext } from "../App";

function CircularTimer({
  timer,
  maxTime = 20,
  size = 60,
  transitionTime = 2,
  children,
}) {
  const { isNight } = useContext(ThemeContext);

  const progress = Math.max(
    0,
    Math.min(1, (timer - transitionTime / 2) / (maxTime - transitionTime / 2))
  );

  const circumference = 2 * Math.PI * (size / 2 - 4);
  const strokeDashoffset = circumference * (1 - progress);

  const getColor = () => {
    if (timer <= 5) return "#ef4444";
    if (timer <= 10) return "#f97316";
    return isNight ? "#ffffff" : "#2e1065";
  };

  const getPulseClass = () => {
    return timer <= 10 ? "animate-pulse" : "";
  };

  return (
    <div
      className={`relative inline-flex items-center justify-center ${getPulseClass()}`}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
        viewBox={`0 0 ${size} ${size}`}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={size / 2 - 4}
          stroke={isNight ? "#ffffff" : "#2e1065"}
          strokeWidth="3"
          fill="transparent"
          opacity="0.3"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={size / 2 - 4}
          stroke={getColor()}
          strokeWidth="3"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-linear"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {children || <span className="text-2xl">Lobo</span>}
      </div>
    </div>
  );
}

export default CircularTimer;
