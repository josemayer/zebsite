import Button from "../components/Button";
import Modal from "../components/Modal";
import { useEffect, useContext, useState } from "react";
import { IoIosRemoveCircleOutline } from "react-icons/io";
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
    console.log("--- START GAME DEBUG ---");
    console.log("Socket object exists:", !!socket);
    if (socket) console.log("Socket connected:", socket.connected);
    console.log("Room Code:", roomInfo.code);
    console.log("Player List Length:", playerList.length);
    console.log("Room Capacity:", roomInfo.capacity);

    if (!socket || !socket.connected) {
      setError("Erro: Conexão perdida com o servidor.");
      return;
    }

    if (socket && roomInfo.code) {
      console.log("EMITTING 'start_game' NOW...");
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
        {playerList.map((player) => (
          <li
            key={player.id}
            className={`flex justify-between items-center p-2 rounded ${
              player.position === "host"
                ? "bg-yellow-600/20 border border-yellow-500/50"
                : "bg-white/5"
            } ${!player.isConnected ? "opacity-60" : ""}`}
          >
            <span
              className={`flex items-center gap-2 ${
                player.position === "host"
                  ? "text-yellow-400 font-bold"
                  : isNight
                  ? "text-white"
                  : "text-[#2e1065]"
              }`}
            >
              {player.name} {player.position === "host" && "👑"}{" "}
              {player.id === playerInfo.id && (
                <span className="text-gray-400 text-sm">(Você)</span>
              )}
              {!player.isConnected && (
                <span className="flex items-center gap-1 text-yellow-400 text-sm">
                  <span className="reconnect-dot">●</span>
                  <span className="reconnect-dot reconnect-dot-delay-1">●</span>
                  <span className="reconnect-dot reconnect-dot-delay-2">●</span>
                </span>
              )}
            </span>

            {connected && isHost() && player.id !== playerInfo.id && (
              <button
                onClick={() => kickPlayer(player.id)}
                className="text-red-400 hover:text-red-300 transition-colors"
              >
                <IoIosRemoveCircleOutline size={24} />
              </button>
            )}
          </li>
        ))}
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
            disabled={playerList.length < roomInfo.capacity}
          >
            {playerList.length < roomInfo.capacity
              ? `Aguardando jogadores (${playerList.length}/${roomInfo.capacity})`
              : "Começar o Jogo"}
          </Button>
        )}
      </div>
    </div>
  );
}

export default Room;
