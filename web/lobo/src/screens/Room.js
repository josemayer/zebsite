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
    <div>
      <h1>
        Sala {roomInfo.code} ({`${playerList.length}/${roomInfo.capacity}`})
      </h1>
      <ul>
        {playerList.map((player, index) => (
          <li
            key={index}
            style={player.position === "host" ? { color: "red" } : {}}
          >
            {player.name}
          </li>
        ))}
      </ul>
      {connected && <Button handleClick={leaveRoom}>Sair da sala</Button>}
      {connected && isHost() && (
        <Button
          handleClick={startGame}
          disabled={playerList.length < roomInfo.capacity}
        >
          Começar o jogo
        </Button>
      )}
    </div>
  );
}

export default Room;
