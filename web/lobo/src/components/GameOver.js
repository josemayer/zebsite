import { useMemo } from "react";
import { IoClose, IoSkull } from "react-icons/io5";
import { GiHeartBeats, GiLaurels } from "react-icons/gi";
import { FaTrophy } from "react-icons/fa";

const GameOver = ({
  winMessage,
  winnerTeam,
  playerName,
  alivePlayers,
  endpoint,
  onClose,
}) => {
  const { isVictory, myData } = useMemo(() => {
    const me = alivePlayers?.find((p) => p.name === playerName);

    if (!me || !winnerTeam) return { isVictory: false, myData: me };

    const won = winnerTeam.includes(me.name);

    return { isVictory: won, myData: me };
  }, [winnerTeam, alivePlayers, playerName]);

  if (!myData) return null;

  const theme = {
    victory: {
      bg: "bg-gradient-to-b from-yellow-900/90 to-black/95",
      border: "border-yellow-500",
      titleColor:
        "inline-block text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 via-yellow-200 to-yellow-500 bg-origin-border",
      shadow: "shadow-yellow-500/20",
      icon: <GiLaurels className="text-yellow-400 animate-pulse" size={64} />,
    },
    defeat: {
      bg: "bg-gradient-to-b from-gray-900/95 to-black/95",
      border: "border-gray-600",
      titleColor: "text-gray-300",
      shadow: "shadow-black/50",
      icon: <IoSkull className="text-gray-500" size={64} />,
    },
  };

  const currentTheme = isVictory ? theme.victory : theme.defeat;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-modal-pop">
      <div
        className={`relative w-full max-w-md ${currentTheme.bg} border-2 ${currentTheme.border} ${currentTheme.shadow} rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]`}
      >
        <div className="p-8 text-center flex-shrink-0 relative overflow-hidden">
          <div
            className={`absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 blur-[60px] rounded-full ${
              isVictory ? "bg-yellow-500/30" : "bg-red-900/20"
            }`}
          ></div>

          <div className="relative z-10 flex flex-col items-center gap-2">
            {currentTheme.icon}

            <h1
              className={`text-4xl font-black uppercase tracking-wider drop-shadow-sm ${currentTheme.titleColor}`}
            >
              {isVictory ? "VITÓRIA" : "DERROTA"}
            </h1>

            <p
              className={`text-sm font-medium opacity-80 mt-1 ${
                isVictory ? "text-yellow-100" : "text-gray-400"
              }`}
            >
              {winMessage}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap justify-center overflow-y-auto custom-scrollbar max-h-md gap-2 items-stretch flex-row p-4">
          {alivePlayers.map((p, index) => {
            const isMe = p.name === playerName;
            const isDead = !p.isAlive;
            const isWinner = winnerTeam.includes(p.name);

            return (
              <div
                key={p.id}
                className={`
                  relative flex flex-col items-center gap-3 p-3 rounded-lg border transition-all duration-500 min-w-[120px]
                  ${
                    isDead
                      ? "bg-black/40 border-white/5 opacity-70 grayscale-[0.8]"
                      : "bg-white/5 border-white/10"
                  }
                  ${
                    isMe
                      ? "bg-white/10 !border-white/30 !opacity-100 !grayscale-0 ring-1 ring-white/20"
                      : ""
                  }
                `}
                style={{
                  animation: `slide-up-fade 0.5s ease-out forwards ${
                    index * 100
                  }ms`,
                  opacity: 0,
                }}
              >
                {isWinner && (
                  <div className="absolute -top-1 -right-1">
                    <div className="rounded-full p-2 bg-yellow-500">
                      <FaTrophy size={16} />
                    </div>
                  </div>
                )}
                <div className="relative flex-shrink-0">
                  <div
                    className={`w-12 h-12 rounded-full p-2 ${
                      isDead
                        ? "bg-gray-800"
                        : "bg-gradient-to-br from-indigo-500/20 to-purple-500/20"
                    }`}
                  >
                    <img
                      src={`${endpoint}werewolf/${p.role}.svg`}
                      alt={p.role}
                      className="w-full h-full object-contain invert drop-shadow-md"
                    />
                  </div>

                  <div
                    className={`absolute -bottom-1 -right-1 rounded-full p-1 border-2 border-black/80 ${
                      isDead
                        ? "bg-gray-700 text-gray-400"
                        : "bg-green-600 text-white shadow-lg shadow-green-500/50"
                    }`}
                  >
                    {isDead ? (
                      <IoSkull size={12} />
                    ) : (
                      <GiHeartBeats size={12} />
                    )}
                  </div>
                </div>

                <div className="flex-1 min-w-0 flex flex-col items-center">
                  <div className="flex justify-between items-baseline">
                    <span
                      className={`font-bold text-base truncate ${
                        isWinner ? "text-yellow-400" : "text-gray-200"
                      }`}
                    >
                      {p.name}
                      {isMe && (
                        <span className="text-[10px] bg-white/20 px-1 ml-1 rounded text-white">
                          EU
                        </span>
                      )}
                    </span>
                  </div>
                  <span
                    className={`text-xs font-bold uppercase tracking-wide truncate ${
                      isDead ? "text-gray-500" : "text-indigo-300"
                    }`}
                  >
                    {p.roleTitle}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-6 pt-4 border-t border-white/5 bg-black/40 flex justify-center flex-shrink-0">
          <button
            onClick={onClose}
            className={`
              flex items-center gap-2 px-8 py-3 rounded-full font-bold text-sm transition-all hover:scale-105 active:scale-95
              ${
                isVictory
                  ? "bg-yellow-500 text-black hover:bg-yellow-400 shadow-lg shadow-yellow-500/20"
                  : "bg-white/10 text-white hover:bg-white/20 border border-white/10"
              }
            `}
          >
            <IoClose size={18} />
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameOver;
