import { useState, useEffect } from "react";
import {
  GiHealthPotion,
  GiPoisonBottle,
  GiNextButton,
  GiFireBomb,
  GiTargetPoster,
} from "react-icons/gi";

function ActionPanel({
  socket,
  phase,
  roleInfo,
  alivePlayers,
  playerName,
  secretData,
  voteCounts,
}) {
  const { hasUsedSavePotion, hasUsedKillPotion, teammates } = secretData || {};
  const [hasActed, setHasActed] = useState(false);
  const [selectedPotion, setSelectedPotion] = useState(null);
  const [actionFeedback, setActionFeedback] = useState(null);

  const currentVotes =
    phase === "NIGHT" && roleInfo.name === "werewolf"
      ? secretData?.voteCounts || {}
      : voteCounts || {};

  const isAlive = secretData?.isAlive ?? true;
  const isHunterRevenge =
    phase === "HUNTER_MOMENT" && roleInfo.name === "hunter";
  const canActAtNight = phase === "NIGHT" && roleInfo.night;
  const canVote = phase === "VOTING";

  const aliveMarkedCount =
    secretData?.markedPlayers?.filter((id) =>
      alivePlayers.find((p) => p.id === id && p.isAlive)
    ).length || 0;

  useEffect(() => {
    setHasActed(false);
    setSelectedPotion(null);
    setActionFeedback(null);
  }, [phase]);

  useEffect(() => {
    if (!socket) return;
    const handleActionFeedback = (message) => setActionFeedback(message);
    socket.on("action_feedback", handleActionFeedback);
    return () => socket.off("action_feedback", handleActionFeedback);
  }, [socket]);

  const handleAction = (targetId) => {
    setHasActed(true);
    const payload = { targetId };

    if (roleInfo.power?.type === "WITCH_POWERS") {
      payload.action = "mix";
      payload.potion = selectedPotion;
    } else {
      payload.action = roleInfo.power?.action;
    }

    const event = phase === "VOTING" ? "vote" : null;
    if (event) payload.action = event;

    socket.emit("game_action", payload);
  };

  if (!isAlive && !isHunterRevenge && phase !== "VOTING") return null;
  if (!canActAtNight && !canVote && !isHunterRevenge && phase !== "VOTING")
    return null;

  const StatusBanner = () =>
    hasActed && (
      <div className="mb-3 bg-blue-500/10 border border-blue-400/30 p-2 rounded text-center">
        <span className="text-blue-200 text-xs font-medium italic">
          {actionFeedback || "Ação registrada..."}
        </span>
      </div>
    );

  const ActionBadge = ({ content, colorClass = "bg-red-600" }) => (
    <div
      className={`absolute -top-1.5 -right-1.5 ${colorClass} text-white text-[9px] font-bold h-4 min-w-[16px] px-1 flex items-center justify-center rounded-full border border-white/20 z-10`}
    >
      {content}
    </div>
  );

  const PlayerButton = ({
    player,
    onClick,
    disabled,
    badge,
    variantClasses,
  }) => (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`
        relative px-3 py-2 rounded-lg font-semibold text-sm transition-all flex items-center justify-center min-w-[90px] border
        ${
          disabled
            ? "bg-gray-800/30 border-gray-700 text-gray-500 cursor-not-allowed opacity-50"
            : `${variantClasses} active:scale-95 shadow-sm`
        }
      `}
    >
      <span className="truncate max-w-[80px]">{player.name}</span>
      {badge}
    </button>
  );

  if (
    phase === "NIGHT" &&
    roleInfo.power?.type === "WITCH_POWERS" &&
    !selectedPotion
  ) {
    if (hasUsedSavePotion && hasUsedKillPotion) {
      return (
        <div className="bg-purple-950/20 p-4 rounded-xl text-center text-xs italic border border-white/5 text-gray-400">
          Você já usou todas as poções.
        </div>
      );
    }

    return (
      <div className="bg-purple-950/40 p-4 rounded-xl border border-purple-500/30 backdrop-blur-sm text-center">
        <h3 className="mb-3 text-[10px] font-bold text-purple-300 uppercase tracking-widest">
          Alquimia
        </h3>
        <div className="flex gap-2 justify-center">
          <button
            disabled={hasActed || hasUsedSavePotion}
            onClick={() => setSelectedPotion("benign")}
            className="flex items-center gap-2 px-3 py-2 bg-green-600/10 hover:bg-green-600/30 border border-green-500/40 rounded-lg text-white disabled:opacity-20 transition-all"
          >
            <GiHealthPotion className="text-lg text-green-400" />
            <span className="text-[9px] font-bold">VIDA</span>
          </button>
          <button
            disabled={hasActed || hasUsedKillPotion}
            onClick={() => setSelectedPotion("malign")}
            className="flex items-center gap-2 px-3 py-2 bg-red-600/10 hover:bg-red-600/30 border border-red-500/40 rounded-lg text-white disabled:opacity-20 transition-all"
          >
            <GiPoisonBottle className="text-lg text-red-400" />
            <span className="text-[9px] font-bold">MORTE</span>
          </button>
          <button
            disabled={hasActed}
            onClick={() => setHasActed(true)}
            className="flex items-center gap-2 px-3 py-2 bg-gray-700/20 hover:bg-gray-700/40 border border-gray-600 rounded-lg text-white transition-all"
          >
            <GiNextButton className="text-lg text-gray-400" />
            <span className="text-[9px] font-bold">PASSAR</span>
          </button>
        </div>
      </div>
    );
  }

  const getPanelStyles = () => {
    if (roleInfo.name === "werewolf" && phase === "NIGHT")
      return "bg-red-950/30 border-red-500/30";
    if (roleInfo.name === "pyromancer" && phase === "NIGHT")
      return "bg-orange-950/30 border-orange-500/30";
    if (phase === "VOTING") return "bg-white/50 border-purple-400 shadow-xl";
    return "bg-purple-950/40 border-purple-500/20 shadow-xl";
  };

  return (
    <div
      className={`p-4 rounded-xl border backdrop-blur-md transition-all ${getPanelStyles()}`}
    >
      <StatusBanner />

      <div className="text-center mb-4">
        <h3
          className={`font-bold text-sm uppercase tracking-tight ${
            phase === "VOTING" ? "text-purple-900" : "text-white"
          }`}
        >
          {(() => {
            if (isHunterRevenge) return "Vingança Final: Leve alguém com você!";
            if (!isAlive && phase === "VOTING") return "Votação (Observando)";
            if (phase === "VOTING") return "Quem deve ser executado?";

            if (phase === "NIGHT") {
              if (roleInfo.name === "werewolf")
                return "Quem a alcateia deve caçar?";
              if (roleInfo.name === "pyromancer")
                return "Quem você quer marcar?";
              if (roleInfo.name === "doctor")
                return "Quem você deseja proteger?";
              if (roleInfo.name === "seer")
                return "De quem você quer descobrir a função?";
              if (roleInfo.power?.type === "WITCH_POWERS") {
                if (selectedPotion === "benign")
                  return "Quem você deseja salvar?";
                if (selectedPotion === "malign")
                  return "Quem você deseja eliminar?";
              }
            }

            return "Escolha um alvo";
          })()}
        </h3>
      </div>

      <div className="flex flex-wrap gap-2 justify-center">
        {alivePlayers
          .filter((p) => {
            if (!p.isAlive) return false;

            const isMe = p.name === playerName;

            if (phase === "VOTING") return true;

            if (isHunterRevenge) return !isMe;

            if (phase === "NIGHT") {
              const isWolfAlly =
                roleInfo.name === "werewolf" && teammates?.includes(p.name);

              if (roleInfo.name === "werewolf") return !isMe && !isWolfAlly;
              if (roleInfo.name === "pyromancer") return true;
              if (roleInfo.name === "doctor") return true;

              return !isMe;
            }

            return !isMe;
          })
          .map((player) => {
            const votes = currentVotes[player.id] || 0;
            const isMarked =
              phase === "NIGHT" &&
              secretData?.markedPlayers?.includes(player.id);
            const isTeammate =
              teammates?.includes(player.name) || player.name === playerName;

            let badge = null;
            if (isMarked) {
              badge = (
                <ActionBadge
                  content={<GiTargetPoster size={10} />}
                  colorClass="bg-orange-600"
                />
              );
            } else if (votes > 0) {
              badge = <ActionBadge content={votes} colorClass="bg-red-600" />;
            }

            let variant =
              "bg-white/5 border-white/10 text-white hover:bg-white/10";
            if (phase === "VOTING") {
              variant =
                "bg-purple-100 border-purple-300 text-purple-900 hover:bg-purple-200 shadow-sm";
            } else if (roleInfo.name === "werewolf" && phase === "NIGHT") {
              variant =
                "bg-red-900/20 border-red-500/20 text-red-100 hover:bg-red-500/30";
            } else if (roleInfo.name === "pyromancer" && phase === "NIGHT") {
              variant =
                "bg-orange-900/20 border-orange-500/20 text-orange-100 hover:bg-orange-600/30";
            }

            return (
              <PlayerButton
                key={player.id}
                player={player}
                disabled={
                  hasActed ||
                  (!isAlive && !isHunterRevenge) ||
                  (phase === "VOTING" && player.name === playerName) ||
                  (roleInfo.name === "pyromancer" && (isMarked || isTeammate))
                }
                badge={badge}
                variantClasses={variant}
                onClick={() => {
                  if (roleInfo.name === "pyromancer") {
                    setHasActed(true);
                    socket.emit("game_action", {
                      action: "mark",
                      targetId: player.id,
                    });
                  } else {
                    handleAction(player.id);
                  }
                }}
              />
            );
          })}
      </div>

      {roleInfo.name === "pyromancer" &&
        phase === "NIGHT" &&
        aliveMarkedCount > 0 && (
          <button
            disabled={hasActed}
            onClick={() => {
              setHasActed(true);
              socket.emit("game_action", { action: "explode" });
            }}
            className={`mt-4 w-full py-2.5 rounded-lg font-bold uppercase tracking-widest text-[11px] transition-all border flex items-center justify-center gap-2
            ${
              hasActed
                ? "bg-gray-800/50 border-gray-700 text-gray-600"
                : "bg-gradient-to-r from-orange-600 to-red-600 text-white border-orange-400 shadow-lg shadow-orange-900/20"
            }`}
          >
            <GiFireBomb size={16} />
            Explodir ({aliveMarkedCount})
          </button>
        )}
    </div>
  );
}

export default ActionPanel;
