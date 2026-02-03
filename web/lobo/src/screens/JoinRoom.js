import Button from "../components/Button";
import TextInput from "../components/TextInput";
import { useState, useContext, useEffect } from "react";
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

  useEffect(() => {
    if (!socket) return;

    const handleJoined = (room) => {
      setLoggedIn(true);
      setConnected(true);
      setRoomInfo({ code: room.code.toString(), capacity: room.capacity });
      setPlayerList(room.players);
      setPlayerInfo(room.joinedPlayer);
      setCurrentScreen("room");
    };

    const handleErr = (error) => {
      setError(error);
      setConnected(false);
    };

    socket.on("room_joined", handleJoined);
    socket.on("error", handleErr);

    return () => {
      socket.off("room_joined", handleJoined);
      socket.off("error", handleErr);
    };
  }, [
    socket,
    setCurrentScreen,
    setConnected,
    setLoggedIn,
    setPlayerInfo,
    setPlayerList,
    setRoomInfo,
    setError,
  ]);

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
      if (!socket.connected) {
        socket.connect();
        socket.once("connect", () => {
          socket.emit("join_room", {
            name: playerName,
            position: "player",
            roomCode: roomInput,
          });
        });
      } else {
        socket.emit("join_room", {
          name: playerName,
          position: "player",
          roomCode: roomInput,
        });
      }
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
      <div className="grid sm:grid-cols-2 sm:gap-4 gap-2">
        <Button
          handleClick={backToSelect}
          disabled={!loggedIn || connected}
          color="red"
          className="text-white order-last sm:order-first"
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
