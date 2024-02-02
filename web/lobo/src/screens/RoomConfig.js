import Button from "../components/Button";
import RoleSelector from "../components/RoleSelector";
import { useState, useEffect, useContext } from "react";
import { UserStateContext } from "../App";

function Room(props) {
  const { connected, loggedIn, setConnected, setLoggedIn, setCurrentScreen } =
    useContext(UserStateContext);

  const {
    socket,
    setPlayerList,
    setPlayerInfo,
    setError,
    endpoint,
    playerName,
    setRoomInfo,
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
  }, [endpoint]);

  function backToLogin() {
    setCurrentScreen("login");
    setConnected(false);
    setLoggedIn(false);
  }

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
        setRoomInfo({ code: room.code, capacity: room.capacity });
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
      <div className="text-white mb-4">
        <div className="flex items-center mb-2">
          <label htmlFor="capacity" className="mr-4">
            Capacidade da sala:
          </label>
          <div className="bg-orange rounded-lg px-4 py-2">{capacity}</div>
        </div>
        <div className="text-xs">
          A capacidade é calculada automaticamente e leva em conta a quantidade
          das funções e o anfitrião.
        </div>
      </div>
      <div className="py-2 text-white">
        Selecione as posições desejadas e especifique a quantidade:
      </div>
      <RoleSelector
        availableRoles={availableRoles}
        roles={roles}
        setRoles={setRoles}
        setCapacity={setCapacity}
        imagesEndpoint={`${endpoint}werewolf/`}
      />
      <div className="mt-2 flex justify-evenly items-center">
        <Button
          handleClick={backToLogin}
          disabled={!loggedIn || connected}
          color="red"
        >
          Voltar
        </Button>
        <Button handleClick={createRoom} disabled={!loggedIn || connected}>
          Criar sala
        </Button>
      </div>
    </div>
  );
}

export default Room;
