import Button from "../components/Button";
import { useEffect, useContext } from "react";
import { UserStateContext } from "../App";

function Room(props) {
  const { connected, setConnected, setLoggedIn, setCurrentScreen } =
    useContext(UserStateContext);

  const {
    socket,
    playerList,
    roomInfo,
    playerInfo,
    setPlayerList,
    setPlayerInfo,
    setError,
    setPlayerRole,
    setRoomInfo,
    isHost,
  } = props;

  useEffect(() => {
    playerList.forEach((player) => {
      if (
        player.id === playerInfo.id &&
        player.position !== playerInfo.position
      ) {
        const newPlayerInfo = {
          name: player.name,
          id: player.id,
          position: player.position,
        };
        setPlayerInfo(newPlayerInfo);
      }
    });
  }, [playerInfo.id, playerInfo.position, playerList, setPlayerInfo]);

  useEffect(() => {
    if (socket) {
      const updateEvents = ["player_joined", "player_left"];

      updateEvents.forEach((event) => {
        socket.on(event, (players) => {
          setPlayerList(players);
        });
      });

      socket.on("game_started_player", (data) => {
        setPlayerRole(data.playerRole);
        setCurrentScreen("gamePlayer");

        setConnected(false);
        setLoggedIn(false);
        socket.disconnect();
      });
    }
  }, [
    socket,
    setPlayerList,
    setPlayerRole,
    setCurrentScreen,
    setConnected,
    setLoggedIn,
  ]);

  function leaveRoom() {
    if (socket) {
      socket.emit("leave_room", roomInfo.code);

      socket.on("room_left", () => {
        setConnected(false);
        setRoomInfo({});
        setPlayerList([]);
        setPlayerInfo({});
        setCurrentScreen("joinRoom");
      });

      socket.on("error", (error) => {
        setError(error);
      });
    }
  }

  function startGame() {
    if (socket) {
      socket.emit("start_game", roomInfo.code);

      socket.on("game_started_host", (data) => {
        setPlayerList(data.players);
        setCurrentScreen("gameHost");

        setConnected(false);
        setLoggedIn(false);
        socket.disconnect();
      });

      socket.on("error", (error) => {
        setError(error);
      });
    }
  }

  return (
    <div className="flex flex-col">
      <div className="flex justify-between items-center text-3xl text-white border-b-[1px] pb-2 mb-4">
        <span>
          Sala <strong>{roomInfo.code}</strong>
        </span>
        <span className="text-xl">
          ({`${playerList.length}/${roomInfo.capacity}`})
        </span>
      </div>
      <ul className="list-disc list-inside">
        {playerList.map((player, index) => (
          <li
            key={index}
            className={
              player.position === "host" ? "text-yellow mb-4" : "text-white"
            }
          >
            {player.name} {player.position === "host" ? "(Anfitrião)" : ""}{" "}
            {player.id === playerInfo.id ? "(Você)" : ""}
          </li>
        ))}
      </ul>
      <div className="flex flex-col sm:flex-row justify-evenly mt-4">
        {connected && (
          <Button
            className="mb-2 sm:mb-0 flex-grow text-white"
            handleClick={leaveRoom}
            color="red"
          >
            Sair da sala
          </Button>
        )}
        {connected && isHost() && (
          <Button
            className="mb-2 sm:mb-0 ml-0 sm:ml-4 flex-grow"
            handleClick={startGame}
            disabled={playerList.length < roomInfo.capacity}
          >
            Começar o jogo
          </Button>
        )}
      </div>
    </div>
  );
}

export default Room;
