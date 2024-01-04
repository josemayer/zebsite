import Button from "../components/Button";
import TextInput from "../components/TextInput";
import RoleSelector from "../components/RoleSelector";
import { useState, useEffect, useContext } from "react";
import { UserStateContext } from "../App";

function Room(props) {
  const { connected, loggedIn, setConnected, setCurrentScreen } =
    useContext(UserStateContext);

  const {
    socket,
    playerList,
    setPlayerList,
    setPlayerInfo,
    setError,
    endpoint,
    playerName,
    setRoomCode,
  } = props;

  const defaultCapacity = 1;

  const [capacity, setCapacity] = useState(defaultCapacity);
  const [roles, setRoles] = useState({});
  const [availableRoles, setAvailableRoles] = useState([]);

  useEffect(() => {
    fetch(`${endpoint}werewolf/roles`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch available roles");
        else return res.json();
      })
      .then((data) => {
        setAvailableRoles(data.roles);
      });
  }, []);

  function createRoom() {
    if (socket) {
      socket.connect();
      const roomData = {
        capacity: parseInt(capacity),
        roles: roles,
      };

      const playerData = {
        name: playerName,
        position: "host",
      };

      socket.emit("create_new_room", {
        roomData: roomData,
        playerData: playerData,
      });

      socket.on("room_created", (room) => {
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
        <label htmlFor="capacity">Capacidade:</label>
        <TextInput
          id="capacity"
          value={capacity}
          onChange={(e) => setCapacity(e.target.value)}
          disabled={!loggedIn || connected}
        />
      </p>
      <p>Selecione as posições desejadas e especifique a quantidade:</p>
      <RoleSelector
        availableRoles={availableRoles}
        roles={roles}
        setRoles={setRoles}
      />
      <p>
        <Button handleClick={createRoom} disabled={!loggedIn || connected}>
          Criar sala
        </Button>
      </p>
    </div>
  );
}

export default Room;
