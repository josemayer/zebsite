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
    setRoomCode,
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
        setRoomCode(room.code.toString());
        setPlayerList(room.players);
        setPlayerInfo(room.joinedPlayer);
      });

      socket.on("error", (error) => {
        setError(error);
      });
    }
  }

  return (
    <div>
      <p>
        <TextInput
          placeholder="Room code"
          value={roomInput}
          onChange={(e) => setRoomInput(e.target.value)}
          disabled={!loggedIn || connected}
        />
      </p>
      <p>
        <Button handleClick={backToSelect} disabled={!loggedIn || connected}>
          Back
        </Button>
        <Button handleClick={joinRoom} disabled={!loggedIn || connected}>
          Go to room
        </Button>
      </p>
    </div>
  );
}

export default JoinRoom;
