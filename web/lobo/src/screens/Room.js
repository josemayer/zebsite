import Button from "../components/Button";
import Modal from "../components/Modal";
import { useEffect, useContext, useState } from "react";
import { IoIosRemoveCircleOutline } from "react-icons/io";
// Added LuUser to imports to match GameBoard style
import { LuUser } from "react-icons/lu";
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

  return (
    <div className="flex flex-col">
      <Modal opened={kickModalOpen} close={closeKickModalAndLeaveRoom}>
        Você foi expulso da sala!
      </Modal>

      <div
        className={`flex justify-between items-center text-3xl border-b-[1px] pb-2 mb-4 ${
          isNight ? "text-white" : "text-[#2e1065]"
        }`}
      >
        <span>
          Sala <strong>{roomInfo.code}</strong>
        </span>
        <span className="text-xl">
          ({`${playerList.length}/${roomInfo.capacity}`})
        </span>
      </div>

      <ul className="space-y-2">
        {playerList.map((player) => {
          const isMe = player.id === playerInfo.id;

          return (
            <li
              key={player.id}
              className={`p-2 rounded flex items-center justify-between transition-all border ${
                player.position === "host"
                  ? "bg-yellow-600/20 border-yellow-500/50"
                  : isMe
                  ? isNight
                    ? "bg-blue-900/40 border-blue-400/50"
                    : "bg-blue-100 border-blue-200 shadow-sm"
                  : isNight
                  ? "bg-white/5 border-white/5"
                  : "bg-white border-gray-200 shadow-sm"
              } ${!player.isConnected ? "opacity-60" : ""}`}
            >
              <div className="flex items-center gap-2">
                <div className="flex-shrink-0 flex items-center justify-center w-5">
                  <LuUser
                    className={
                      player.position === "host"
                        ? "text-yellow-400"
                        : isMe
                        ? isNight
                          ? "text-blue-400"
                          : "text-blue-600"
                        : isNight
                        ? "text-gray-400"
                        : "text-gray-500"
                    }
                    size={16}
                  />
                </div>

                <span
                  className={`text-sm font-medium ${
                    player.position === "host"
                      ? "text-yellow-400 font-bold"
                      : isNight
                      ? "text-white"
                      : "text-[#2e1065]"
                  }`}
                >
                  {player.name} {player.position === "host" && "👑"}{" "}
                  {isMe && (
                    <span className="text-gray-400 font-normal text-xs ml-1">
                      (Você)
                    </span>
                  )}
                </span>
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
                    className="text-red-400 hover:text-red-300 transition-colors ml-2"
                    title="Expulsar jogador"
                  >
                    <IoIosRemoveCircleOutline size={22} />
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <div className="flex flex-col sm:flex-row gap-4 mt-8">
        <Button
          className="flex-grow text-white"
          handleClick={leaveRoom}
          color="red"
        >
          Sair da sala
        </Button>

        {isHost() && (
          <Button
            className="flex-grow"
            handleClick={startGame}
            disabled={!canStart}
          >
            {!isRoomFull
              ? `Aguardando jogadores (${playerList.length}/${roomInfo.capacity})`
              : !everyoneConnected
              ? "Aguardando reconexão..."
              : "Começar o Jogo"}
          </Button>
        )}
      </div>
    </div>
  );
}

export default Room;
