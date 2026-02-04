import Button from "../components/Button";
import Modal from "../components/Modal";
import { useEffect, useContext, useState } from "react";
import { IoIosRemoveCircleOutline } from "react-icons/io";
import { LuUser, LuCrown } from "react-icons/lu"; // Import Crown Icon
import { UserStateContext, ThemeContext } from "../App";

function Room(props) {
  const { connected, setConnected, setCurrentScreen } =
    useContext(UserStateContext);
  const { isNight } = useContext(ThemeContext);

  const {
    socket,
    playerList,
    roomInfo,
    playerInfo,
    setPlayerList,
    setPlayerInfo,
    setError,
    setRoomInfo,
    isHost,
  } = props;

  const [kickModalOpen, setKickModalOpen] = useState(false);
  const everyoneConnected = playerList.every((player) => player.isConnected);
  const isRoomFull = playerList.length >= roomInfo.capacity;
  const canStart = isRoomFull && everyoneConnected;

  useEffect(() => {
    if (!socket) return;

    const handlePlayerJoined = (players) => {
      setPlayerList(players);
    };

    const handlePlayerLeft = (players) => {
      setPlayerList(players);
    };

    const handlePlayerListUpdate = (players) => {
      setPlayerList(players);
    };

    const handleGameUpdate = (data) => {
      setCurrentScreen("gameBoard");
    };

    const handlePlayerKicked = () => {
      setKickModalOpen(true);
    };

    const handleError = (msg) => {
      setError(msg);
    };

    socket.on("player_joined", handlePlayerJoined);
    socket.on("player_left", handlePlayerLeft);
    socket.on("player_list_update", handlePlayerListUpdate);
    socket.on("game_update", handleGameUpdate);
    socket.on("player_kicked", handlePlayerKicked);
    socket.on("error", handleError);

    return () => {
      socket.off("player_joined", handlePlayerJoined);
      socket.off("player_left", handlePlayerLeft);
      socket.off("player_list_update", handlePlayerListUpdate);
      socket.off("game_update", handleGameUpdate);
      socket.off("player_kicked", handlePlayerKicked);
      socket.off("error", handleError);
    };
  }, [socket, setCurrentScreen, setPlayerList, setError]);

  useEffect(() => {
    const me = playerList.find((p) => p.id === playerInfo.id);
    if (me && me.position !== playerInfo.position) {
      setPlayerInfo((prev) => ({
        ...prev,
        position: me.position,
      }));
    }
  }, [playerList, playerInfo.id, playerInfo.position, setPlayerInfo]);

  function closeKickModalAndLeaveRoom() {
    setKickModalOpen(false);
    setConnected(false);
    setRoomInfo({});
    setPlayerList([]);
    setPlayerInfo({});
    setCurrentScreen("joinRoom");
  }

  function leaveRoom() {
    if (socket) {
      socket.emit("leave_room", roomInfo.code);
      setConnected(false);
      setRoomInfo({});
      setPlayerList([]);
      setPlayerInfo({});
      setCurrentScreen("joinRoom");
    }
  }

  function startGame() {
    if (!socket || !socket.connected) {
      setError("Erro: Conexão perdida com o servidor.");
      return;
    }

    if (socket && roomInfo.code) {
      socket.emit("start_game", roomInfo.code);
    }
  }

  function kickPlayer(playerId) {
    if (socket) {
      socket.emit("kick_player", { roomCode: roomInfo.code, playerId });
    }
  }

  const getRowStyles = (isMe, isHostPlayer) => {
    let base =
      "p-3 rounded-lg flex items-center justify-between transition-all border ";

    if (isMe) {
      return (
        base +
        (isNight
          ? "bg-blue-900/30 border-blue-500/50 shadow-[0_0_10px_rgba(59,130,246,0.15)]"
          : "bg-blue-50 border-blue-200 shadow-sm")
      );
    }

    return (
      base +
      (isNight
        ? "bg-white/5 border-white/10"
        : "bg-white border-gray-200 shadow-sm")
    );
  };

  return (
    <div className="flex flex-col">
      <Modal opened={kickModalOpen} close={closeKickModalAndLeaveRoom}>
        Você foi expulso da sala!
      </Modal>

      <div
        className={`flex justify-between items-center text-3xl border-b-[1px] pb-4 mb-6 ${
          isNight
            ? "text-white border-white/10"
            : "text-[#2e1065] border-gray-300"
        }`}
      >
        <span className="font-bold tracking-tight">Sala {roomInfo.code}</span>
        <span
          className={`text-lg font-medium px-3 py-1 rounded-full ${
            isNight ? "bg-white/10" : "bg-gray-100"
          }`}
        >
          {playerList.length} / {roomInfo.capacity}
        </span>
      </div>

      <ul className="space-y-3">
        {playerList.map((player) => {
          const isMe = player.id === playerInfo.id;
          const isHostPlayer = player.position === "host";

          return (
            <li
              key={player.id}
              className={`${getRowStyles(isMe, isHostPlayer)} ${
                !player.isConnected ? "opacity-50 grayscale" : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full ${
                    isHostPlayer
                      ? isNight
                        ? "bg-amber-500/20 text-amber-400"
                        : "bg-amber-100 text-amber-600"
                      : isNight
                      ? "bg-white/10 text-gray-400"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {isHostPlayer ? <LuCrown size={18} /> : <LuUser size={18} />}
                </div>

                <div className="flex flex-col leading-tight">
                  <span
                    className={`font-semibold text-base flex items-center gap-2 ${
                      isNight ? "text-gray-100" : "text-gray-800"
                    }`}
                  >
                    {player.name}

                    {/* HOST BADGE */}
                    {isHostPlayer && (
                      <span
                        className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border ${
                          isNight
                            ? "bg-amber-900/30 text-amber-400 border-amber-500/30"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}
                      >
                        Host
                      </span>
                    )}

                    {/* ME BADGE */}
                    {isMe && (
                      <span
                        className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border ${
                          isNight
                            ? "bg-blue-900/30 text-blue-300 border-blue-500/30"
                            : "bg-blue-50 text-blue-600 border-blue-200"
                        }`}
                      >
                        Você
                      </span>
                    )}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {!player.isConnected && (
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

                {connected && isHost() && player.id !== playerInfo.id && (
                  <button
                    onClick={() => kickPlayer(player.id)}
                    className="group p-2 hover:bg-red-50 rounded-full transition-colors"
                    title="Expulsar jogador"
                  >
                    <IoIosRemoveCircleOutline
                      size={22}
                      className="text-gray-400 group-hover:text-red-500 transition-colors"
                    />
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <div className="flex flex-col sm:flex-row gap-4 mt-8 pt-4 border-t border-gray-200/10">
        <Button
          className="flex-grow text-white"
          handleClick={leaveRoom}
          color="red"
        >
          Sair da sala
        </Button>

        {isHost() && (
          <Button
            className="flex-grow shadow-lg shadow-indigo-500/20"
            handleClick={startGame}
            disabled={!canStart}
          >
            {!isRoomFull
              ? `Aguardando (${playerList.length}/${roomInfo.capacity})`
              : !everyoneConnected
              ? "Aguardando reconexão..."
              : "Começar Jogo"}
          </Button>
        )}
      </div>
    </div>
  );
}

export default Room;
