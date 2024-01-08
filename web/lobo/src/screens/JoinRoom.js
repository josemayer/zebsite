import Button from "../components/Button";
import TextInput from "../components/TextInput";
import { useState, useContext } from "react";
import { UserStateContext } from "../App";

function JoinRoom(props) {
  const { loggedIn, connected, setLoggedIn, setConnected, setCurrentScreen } =
    useContext(UserStateContext);

  const {
    socket,
    setPlayerList,
    setPlayerInfo,
    setError,
    playerName,
    setRoomInfo,
  } = props;

  const [roomInput, setRoomInput] = useState("");

  function backToSelect() {
    setLoggedIn(false);
    setCurrentScreen("login");
  }

  function joinRoom() {
    if (socket) {
      socket.connect();
      const playerData = {
        name: playerName,
        position: "player",
        roomCode: roomInput,
      };

      socket.emit("join_room", playerData);

      socket.on("room_joined", (room) => {
        setLoggedIn(true);
        setConnected(true);
        setCurrentScreen("room");
        setRoomInfo({ code: room.code.toString(), capacity: room.capacity });
        setPlayerList(room.players);
        setPlayerInfo(room.joinedPlayer);
      });

      socket.on("error", (error) => {
        setError(error);
      });
    }
  }

  return (
    <div className="flex flex-col">
      <div className="mb-4">
        <TextInput
          placeholder="Código da sala"
          value={roomInput}
          onChange={(e) => setRoomInput(e.target.value)}
          disabled={!loggedIn || connected}
          width="300px"
        />
      </div>
      <div className="flex justify-evenly">
        <Button
          handleClick={backToSelect}
          disabled={!loggedIn || connected}
          color="red"
        >
          Voltar
        </Button>
        <Button handleClick={joinRoom} disabled={!loggedIn || connected}>
          Entrar na sala
        </Button>
      </div>
    </div>
  );
}

export default JoinRoom;
