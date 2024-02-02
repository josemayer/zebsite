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

  function checkInput() {
    if (roomInput === "") {
      setError("O código da sala não pode ser vazio");
      return false;
    }
    return true;
  }

  function joinRoom() {
    if (!checkInput()) return;

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
          placeholder="Número da sala"
          value={roomInput}
          onChange={(e) => setRoomInput(e.target.value)}
          disabled={!loggedIn || connected}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Button
          handleClick={backToSelect}
          disabled={!loggedIn || connected}
          color="red"
          className="text-white"
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
