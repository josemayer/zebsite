import { useState, useEffect, useContext, useRef } from "react";
import { GiWolfHowl, GiDeathSkull } from "react-icons/gi";
import { IoFlame, IoSend } from "react-icons/io5";
import {
  LuUser,
  LuMessageSquare,
  LuHistory,
  LuChevronDown,
  LuChevronUp,
} from "react-icons/lu";
import { PiGasCanFill } from "react-icons/pi";
import { TbAward } from "react-icons/tb";
import ActionPanel from "../components/ActionPanel";
import GameOver from "../components/GameOver";
import { ThemeContext } from "../App";

function GameBoard({ gameState, secretData, playerName, socket, endpoint }) {
  const { isNight } = useContext(ThemeContext);

  const {
    phase,
    alivePlayers,
    actionLogs,
    winMessage,
    winnerTeam,
    chatHistory,
    roleConfirmations,
    voteCounts,
  } = gameState || {};
  const {
    roleInfo,
    teammates,
    isAlive,
    isMarked: isMarkedByPyro,
    markedPlayers,
  } = secretData || {};

  const [chatMessages, setChatMessages] = useState(chatHistory || []);
  const [chatInput, setChatInput] = useState("");
  const [hasConfirmedRole, setHasConfirmedRole] = useState(false);
  const [showGameOverModal, setShowGameOverModal] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showGameBoard, setShowGameBoard] = useState(phase !== "ROLE_REVEAL");
  const [showHistory, setShowHistory] = useState(false);
  const chatListRef = useRef(null);

  useEffect(() => {
    setChatMessages(chatHistory || []);
  }, [chatHistory]);

  useEffect(() => {
    if (!socket) return;

    const handleChatMessage = (message) => {
      setChatMessages((prev) => [...prev, message]);
    };

    socket.on("chat_message", handleChatMessage);

    return () => {
      socket.off("chat_message", handleChatMessage);
    };
  }, [socket]);

  useEffect(() => {
    setHasConfirmedRole(false);
  }, [phase]);

  useEffect(() => {
    if (showGameBoard && (phase === "DAY" || phase === "GAMEOVER")) {
      if (chatListRef.current) {
        const { scrollHeight, clientHeight } = chatListRef.current;
        chatListRef.current.scrollTo({
          top: scrollHeight - clientHeight,
          behavior: "smooth",
        });
      }
    }
  }, [chatMessages, showGameBoard, phase]);

  useEffect(() => {
    if (phase === "ROLE_REVEAL") {
      setIsTransitioning(false);
      setShowGameBoard(false);
    } else if (!showGameBoard) {
      setIsTransitioning(true);
      setTimeout(() => {
        setShowGameBoard(true);
        setIsTransitioning(false);
      }, 800);
    }
  }, [phase, showGameBoard]);

  useEffect(() => {
    if (phase === "GAMEOVER") {
      setShowGameOverModal(true);
    } else {
      setShowGameOverModal(false);
    }
  }, [phase]);

  if (!gameState || !secretData)
    return (
      <div className="flex items-center justify-center text-white">
        Carregando...
      </div>
    );

  const sendChatMessage = () => {
    if (chatInput.trim() && socket) {
      socket.emit("send_chat_message", { message: chatInput.trim() });
      setChatInput("");
    }
  };

  const handleChatKeyPress = (e) => {
    if (e.key === "Enter") {
      sendChatMessage();
    }
  };

  const handleRoleConfirm = () => {
    if (!socket || hasConfirmedRole) return;

    socket.emit("game_action", { action: "confirm_role" });
    setHasConfirmedRole(true);
  };

  const translatePhase = {
    NIGHT: "Noite",
    DAY: "Dia",
    VOTING: "Votação",
    HUNTER_MOMENT: "Vingança",
    GAMEOVER: "Fim de jogo",
    LOBBY: "Saguão",
    ROLE_REVEAL: "Função",
  };

  return (
    <div className="flex flex-col">
      {phase !== "ROLE_REVEAL" && (
        <div
          className={`flex justify-center items-center border-b pb-2 mb-4 ${
            isNight ? "border-gray-700" : "border-gray-300"
          }`}
        >
          <h2
            className={`text-2xl font-bold uppercase tracking-widest ${
              isNight ? "text-white" : "text-[#2e1065]"
            }`}
          >
            {translatePhase[phase]}
          </h2>
        </div>
      )}

      {phase !== "ROLE_REVEAL" && (
        <div
          className={`p-2 rounded mb-4 text-center transition-all duration-300 ${
            isNight
              ? "bg-black/40 border border-white/10"
              : "bg-white shadow-lg border border-gray-100"
          }`}
        >
          <div className="py-2">
            {actionLogs &&
            actionLogs.length > 0 &&
            actionLogs.at(-1).length > 0 ? (
              <div
                className={`space-y-1 ${
                  isNight ? "text-gray-100" : "text-[#2e1065]"
                }`}
              >
                {actionLogs.at(-1).map((log, i) => (
                  <p
                    key={`latest-${i}`}
                    className="text-sm font-medium animate-pulse-once"
                  >
                    {log}
                  </p>
                ))}
              </div>
            ) : winMessage ? (
              <div className="font-bold text-yellow-500 text-lg animate-bounce">
                {winMessage}
              </div>
            ) : (
              <div
                className={`italic text-sm ${
                  isNight ? "text-gray-400" : "text-gray-500"
                }`}
              >
                Aguardando ações...
              </div>
            )}
          </div>

          {actionLogs && actionLogs.length > 1 && (
            <div className="mt-1 border-t border-gray-500/20 pt-1">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className={`text-xs flex items-center justify-center gap-1 w-full py-1 hover:opacity-100 transition-opacity ${
                  isNight
                    ? "text-blue-300 opacity-60"
                    : "text-blue-600 opacity-70"
                }`}
              >
                {showHistory ? (
                  <>
                    <LuChevronUp size={12} /> Ocultar Histórico
                  </>
                ) : (
                  <>
                    <LuHistory size={12} /> Ver Histórico (
                    {actionLogs.length - 1} rodadas) <LuChevronDown size={12} />
                  </>
                )}
              </button>

              {showHistory && (
                <div className="max-h-32 overflow-y-auto mt-2 space-y-3 pr-1 text-xs text-left scroll-smooth custom-scrollbar">
                  {actionLogs
                    .slice(0, -1)
                    .reverse()
                    .map((roundLogs, index) => {
                      const roundNumber = actionLogs.length - 1 - index;
                      return (
                        <div
                          key={`round-${index}`}
                          className={`p-2 rounded ${
                            isNight ? "bg-white/5" : "bg-gray-50"
                          }`}
                        >
                          {roundLogs.map((log, logIndex) => (
                            <p
                              key={logIndex}
                              className={`${
                                isNight ? "text-gray-300" : "text-gray-600"
                              }`}
                            >
                              <span
                                className={`pr-2 ${
                                  isNight ? "text-gray-200" : "text-gray-500"
                                }`}
                              >
                                ROD {roundNumber}.
                              </span>
                              {log}
                            </p>
                          ))}
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {phase === "ROLE_REVEAL" && (
        <div className="flex flex-col items-center justify-center min-h-[50vh] p-4">
          <div
            className={`text-center p-6 rounded-lg shadow-lg max-w-md transition-all duration-300 ${
              isNight
                ? "bg-black/40 border border-white/20"
                : "bg-white border border-gray-200"
            } ${isTransitioning ? "phase-transition-reveal" : ""}`}
          >
            <h2
              className={`text-xl font-bold mb-4 uppercase tracking-widest ${
                isNight ? "text-white" : "text-[#2e1065]"
              }`}
            >
              SUA FUNÇÃO
            </h2>

            <div className="flex flex-col items-center mb-6">
              <img
                src={`${endpoint}werewolf/${roleInfo.name}.svg`}
                className={`w-32 h-32 mb-4 ${isNight ? "invert" : ""} ${
                  isTransitioning ? "role-icon-transition" : ""
                }`}
                alt={roleInfo.title}
              />
              <h3
                className={`text-lg font-bold mb-4 ${
                  isNight ? "text-white" : "text-[#2e1065]"
                }`}
              >
                {roleInfo.title}
              </h3>
            </div>

            <div
              className={`text-sm leading-relaxed max-w-lg ${
                isNight ? "text-gray-200" : "text-gray-700"
              }`}
            >
              {roleInfo.description || "Descrição não disponível"}
            </div>

            <div
              className={`mt-4 space-y-3 ${
                isNight ? "text-gray-300" : "text-gray-600"
              }`}
            >
              <div className="text-xs">
                Memorize sua função! O jogo começará em breve...
              </div>

              {roleConfirmations && (
                <div className="text-xs">
                  Jogadores prontos: {roleConfirmations.length} /{" "}
                  {alivePlayers?.length || 0}
                </div>
              )}

              {!hasConfirmedRole && (
                <button
                  onClick={handleRoleConfirm}
                  className={`px-4 py-2 rounded font-semibold text-sm text-white transition-colors bg-green-600 hover:bg-green-500`}
                >
                  Confirmar
                </button>
              )}

              {hasConfirmedRole && (
                <div
                  className={`font-semibold ${
                    isNight ? "!text-green-300" : "!text-green-600"
                  }`}
                >
                  Você confirmou! Aguardando outros jogadores...
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showGameBoard && (
        <div
          className={`space-y-4 ${
            isTransitioning ? "" : "phase-transition-gameboard"
          }`}
        >
          {isMarkedByPyro && isAlive && (
            <div className="bg-orange-500/20 border border-orange-500 text-orange-500 px-4 py-3 rounded animate-pulse flex items-center justify-center gap-2">
              <span className="font-bold text-sm">
                Você sente cheiro de querosene...
              </span>
            </div>
          )}

          {phase !== "ROLE_REVEAL" && (
            <div
              className={`flex flex-col items-center p-3 rounded-lg mb-4 opacity-75 ${
                isNight ? "bg-black/20" : "bg-white/50 shadow-sm"
              }`}
            >
              <img
                src={`${endpoint}werewolf/${roleInfo.name}.svg`}
                className={`w-12 mb-1 ${isNight ? "invert" : ""}`}
                alt={roleInfo.title}
              />
              <h3
                className={`text-sm font-semibold ${
                  isNight ? "text-white" : "text-[#2e1065]"
                }`}
              >
                {roleInfo.title}
              </h3>
              {!isAlive && (
                <span className="text-red-500 font-bold uppercase text-xs">
                  MORTO
                </span>
              )}
            </div>
          )}

          {(() => {
            const shouldRenderActionPanel =
              phase !== "ROLE_REVEAL" &&
              (isAlive ||
                phase === "VOTING" ||
                (phase === "HUNTER_MOMENT" && roleInfo?.name === "hunter"));

            return shouldRenderActionPanel ? (
              <ActionPanel
                socket={socket}
                phase={phase}
                roleInfo={roleInfo}
                alivePlayers={alivePlayers}
                playerName={playerName}
                secretData={secretData}
                voteCounts={voteCounts}
              />
            ) : null;
          })()}

          {(phase === "DAY" || phase === "GAMEOVER") && (
            <div
              className={`mt-4 rounded-lg p-3 flex flex-col ${
                isNight ? "bg-black/30" : "bg-white shadow-lg"
              }`}
            >
              <h4
                className={`text-sm font-bold mb-2 flex items-center ${
                  isNight ? "text-gray-300" : "text-[#2e1065]"
                }`}
              >
                <LuMessageSquare size={16} className="opacity-70 mr-2" />
                Chat da Vila
              </h4>

              <div
                ref={chatListRef}
                className="h-32 overflow-y-auto mb-2 space-y-1 pr-1 scroll-smooth"
              >
                {chatMessages.length === 0 ? (
                  <p
                    className={`text-sm italic ${
                      isNight ? "text-gray-500" : "text-gray-400"
                    }`}
                  >
                    Nenhuma mensagem ainda...
                  </p>
                ) : (
                  chatMessages.map((msg, index) => (
                    <div key={index} className="text-sm break-words">
                      <span
                        className={`font-bold ${
                          isNight ? "text-blue-300" : "text-blue-600"
                        }`}
                      >
                        {msg.sender}:
                      </span>{" "}
                      <span
                        className={isNight ? "text-white" : "text-[#2e1065]"}
                      >
                        {msg.message}
                      </span>
                    </div>
                  ))
                )}
              </div>

              {phase === "DAY" && isAlive && (
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={handleChatKeyPress}
                    placeholder="Digite sua mensagem..."
                    className={`flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all ${
                      isNight
                        ? "bg-white/10 border-white/20 text-white placeholder-gray-400"
                        : "bg-gray-50 border-gray-300 text-[#2e1065] placeholder-gray-500"
                    }`}
                    maxLength={200}
                  />
                  <button
                    onClick={sendChatMessage}
                    disabled={!chatInput.trim()}
                    aria-label="Enviar mensagem"
                    className={`p-2 rounded-full transition-all flex items-center justify-center shadow-md active:scale-95 ${
                      isNight
                        ? "bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white"
                        : "bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 text-white"
                    } ${
                      !chatInput.trim()
                        ? "cursor-not-allowed opacity-70"
                        : "cursor-pointer"
                    }`}
                  >
                    <IoSend
                      size={16}
                      className={chatInput.trim() ? "ml-0.5" : ""}
                    />
                  </button>
                </div>
              )}

              {!(phase === "DAY" && isAlive) && (
                <div
                  className={`text-center text-xs italic py-2 ${
                    isNight ? "text-gray-500" : "text-gray-400"
                  }`}
                >
                  {phase === "GAMEOVER"
                    ? "Partida encerrada."
                    : "Você está morto. Apenas observe."}
                </div>
              )}
            </div>
          )}

          {phase !== "ROLE_REVEAL" && (
            <div className="mt-4">
              <h4
                className={`text-sm mb-2 ${
                  isNight ? "opacity-70 text-gray-300" : "text-gray-700"
                }`}
              >
                Jogadores na Vila:
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {alivePlayers.map((p) => {
                  const isMe = p.name === playerName;
                  const myRole = roleInfo?.name;
                  const isAlly =
                    (myRole === "werewolf" || myRole === "pyromancer") &&
                    teammates?.includes(p.name);
                  const isDead = !p.isAlive;

                  const showWolfIcon =
                    myRole === "werewolf" && (isMe || isAlly);
                  const showPyroIcon =
                    myRole === "pyromancer" && (isMe || isAlly);

                  const isPlayerMarkedByMe =
                    myRole === "pyromancer" && markedPlayers?.includes(p.id);

                  return (
                    <div
                      key={p.id}
                      className={`p-2 rounded flex items-center justify-between transition-all border ${
                        isNight
                          ? isMe
                            ? "bg-blue-900/40 border-blue-400/50"
                            : "bg-black/20 border-white/5"
                          : isMe
                          ? "bg-blue-100 border-blue-200 shadow-sm"
                          : "bg-white border-gray-200 shadow-sm"
                      } ${!p.isConnected ? "opacity-60" : ""}`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="flex-shrink-0 flex items-center justify-center w-5">
                          {isDead ? (
                            <GiDeathSkull
                              className={
                                isNight ? "text-red-400" : "text-red-600"
                              }
                              size={18}
                            />
                          ) : (
                            <LuUser
                              className={
                                isMe
                                  ? isNight
                                    ? "text-blue-400"
                                    : "text-blue-600"
                                  : isNight
                                  ? "text-gray-400"
                                  : "text-gray-500"
                              }
                              size={16}
                            />
                          )}
                        </div>

                        <span
                          className={`text-sm font-medium ${
                            isNight ? "text-white" : "text-[#2e1065]"
                          } ${isDead ? "line-through opacity-50" : ""}`}
                        >
                          {p.name} {isMe && "(Você)"}
                        </span>
                      </div>

                      <div className="flex gap-2">
                        {showWolfIcon && (
                          <GiWolfHowl
                            className={`${
                              isNight ? "text-white" : "text-[#2e1065]"
                            }`}
                            size={18}
                          />
                        )}

                        {showPyroIcon && (
                          <IoFlame
                            className={`${
                              isNight ? "text-white" : "text-[#2e1065]"
                            }`}
                            size={18}
                          />
                        )}

                        {isPlayerMarkedByMe && (
                          <PiGasCanFill
                            className={`${
                              isNight ? "text-white" : "text-[#2e1065]"
                            }`}
                            size={18}
                            title="Marcado para explodir"
                          />
                        )}

                        {!p.isConnected && (
                          <span
                            className={`flex items-center gap-1 text-xs ${
                              isNight ? "text-white" : "text-[#2e1065]"
                            }`}
                          >
                            <span className="reconnect-dot">●</span>
                            <span className="reconnect-dot reconnect-dot-delay-1">
                              ●
                            </span>
                            <span className="reconnect-dot reconnect-dot-delay-2">
                              ●
                            </span>
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {phase === "GAMEOVER" && showGameOverModal && (
        <GameOver
          winMessage={winMessage}
          winnerTeam={winnerTeam}
          playerName={playerName}
          alivePlayers={alivePlayers}
          endpoint={endpoint}
          onClose={() => setShowGameOverModal(false)}
        />
      )}

      {phase === "GAMEOVER" && !showGameOverModal && (
        <div className="fixed bottom-10 right-10 z-40">
          <button
            onClick={() => setShowGameOverModal(true)}
            className="flex items-center gap-3 bg-white text-black font-bold px-4 py-2 rounded-full shadow-lg animate-bounce"
          >
            <TbAward size={20} />
            Resultados
          </button>
        </div>
      )}
    </div>
  );
}

export default GameBoard;
