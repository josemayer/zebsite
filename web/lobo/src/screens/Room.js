import Button from "../components/Button";
import { useState, useEffect, useContext } from "react";
import { UserStateContext } from "../App";

function Room(props) {
  const { connected, setConnected, setLoggedIn, setCurrentScreen } =
    useContext(UserStateContext);

  const {
    socket,
    playerList,
    roomCode,
    playerInfo,
    setPlayerList,
    setPlayerInfo,
    setError,
    setGameStarted,
    setPlayerRole,
    setRoomCode,
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
  }, [playerList]);

  useEffect(() => {
    if (socket) {
      const updateEvents = ["player_joined", "player_left"];

      updateEvents.forEach((event) => {
        socket.on(event, (players) => {
          setPlayerList(players);
        });
      });

      socket.on("game_started_player", (data) => {
        setGameStarted(true);
        setPlayerRole(data.playerRole);
        setCurrentScreen("gamePlayer");

        setConnected(false);
        setLoggedIn(false);
        socket.disconnect();
      });
    }
  }, [socket]);

  function leaveRoom() {
    if (socket) {
      socket.emit("leave_room", roomCode);

      socket.on("room_left", () => {
        setConnected(false);
        setRoomCode("");
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
      socket.emit("start_game", roomCode);

      socket.on("game_started_host", (data) => {
        setGameStarted(true);
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
      <h1>Sala {roomCode}</h1>
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
        <Button handleClick={startGame}>Começar o jogo</Button>
      )}
    </div>
  );
}

export default Room;
