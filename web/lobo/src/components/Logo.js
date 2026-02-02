import { useContext, useRef, useEffect } from "react";
import CircularTimer from "./CircularTimer";
import { ThemeContext } from "../App";
import { ReactComponent as LogoSVG } from "../assets/logo.svg";

function Logo({ gameState }) {
  const { isNight } = useContext(ThemeContext);

  const logoStyle = {
    "--logo-fill": isNight ? "#ffffff" : "#2e1065",
  };

  const phaseMaxTimes = useRef(new Map());
  const lastPhase = useRef(null);

  useEffect(() => {
    const currentPhase = gameState?.phase;
    const currentTimer = gameState?.timer;

    if (currentPhase && currentTimer !== undefined) {
      if (
        currentPhase !== lastPhase.current ||
        !phaseMaxTimes.current.has(currentPhase)
      ) {
        phaseMaxTimes.current.set(currentPhase, currentTimer);
        lastPhase.current = currentPhase;
      }
    }
  }, [gameState?.phase, gameState?.timer]);

  const capturedMaxTime =
    phaseMaxTimes.current.get(gameState?.phase) || gameState?.timer || 2;
  const shouldShowTimer =
    gameState?.timer !== undefined && gameState?.timer > 0;

  return (
    <div className="flex justify-center mb-4 relative" style={logoStyle}>
      {shouldShowTimer ? (
        <CircularTimer
          timer={gameState.timer}
          maxTime={capturedMaxTime}
          size={80}
        >
          <div className="logo-svg">
            <LogoSVG fill="var(--logo-fill)" width="40px" height="40px" />
          </div>
        </CircularTimer>
      ) : (
        <div className="logo-svg">
          <LogoSVG fill="var(--logo-fill)" width="50px" height="50px" />
        </div>
      )}
    </div>
  );
}

export default Logo;
