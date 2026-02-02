import Button from "../components/Button";
import RoleSelector from "../components/RoleSelector";
import { useState, useEffect, useContext } from "react";
import { UserStateContext, ThemeContext } from "../App";

function RoomConfig(props) {
  const { connected, setConnected, setLoggedIn, setCurrentScreen } =
    useContext(UserStateContext);
  const { isNight } = useContext(ThemeContext);

  const {
    socket,
    setPlayerList,
    setPlayerInfo,
    setError,
    endpoint,
    playerName,
    setRoomInfo,
  } = props;

  const [capacity, setCapacity] = useState(0);
  const [roles, setRoles] = useState({});
  const [availableRoles, setAvailableRoles] = useState([]);

  useEffect(() => {
    const total = Object.values(roles).reduce((a, b) => a + b, 0);
    setCapacity(total);
  }, [roles]);

  useEffect(() => {
    fetch(`${endpoint}werewolf/roles`)
      .then((res) => res.json())
      .then((data) => setAvailableRoles(data.roles))
      .catch((err) => console.error("Error fetching roles:", err));
  }, [endpoint]);

  useEffect(() => {
    if (!socket) return;

    const handleCreated = (room) => {
      setConnected(true);
      setRoomInfo({ code: room.code, capacity: room.capacity });
      setPlayerList(room.players);
      setPlayerInfo(room.joinedPlayer);
      setCurrentScreen("room");
    };

    const handleErr = (err) => {
      if (setError) setError(err);
    };

    socket.on("room_created", handleCreated);
    socket.on("error", handleErr);

    return () => {
      socket.off("room_created", handleCreated);
      socket.off("error", handleErr);
    };
  }, [
    socket,
    setCurrentScreen,
    setConnected,
    setPlayerInfo,
    setPlayerList,
    setRoomInfo,
    setError,
  ]);

  function backToLogin() {
    setCurrentScreen("login");
    setConnected(false);
    setLoggedIn(false);
  }

  function createRoom() {
    if (!socket) return;

    if (capacity === 0) {
      setError("Selecione pelo menos uma função!");
      return;
    }

    const roomData = {
      capacity: capacity,
      roles: roles,
    };

    const playerData = {
      name: playerName,
      position: "host",
    };

    if (!socket.connected) {
      socket.connect();
      socket.once("connect", () => {
        socket.emit("create_new_room", { roomData, playerData });
      });
    } else {
      socket.emit("create_new_room", { roomData, playerData });
    }
  }

  return (
    <div className="flex flex-col">
      <div className={`mb-4 ${isNight ? "text-white" : "text-[#2e1065]"}`}>
        <div className="flex items-center mb-2">
          <label htmlFor="capacity" className="mr-4 text-lg">
            Capacidade da sala:
          </label>
          <div className="bg-orange-300 rounded-lg px-4 py-2 font-bold text-xl">
            {capacity}
          </div>
        </div>
        <p
          className={`text-xs italic ${
            isNight ? "text-gray-300" : "text-gray-600"
          }`}
        >
          A capacidade é sincronizada com a soma das funções selecionadas.
        </p>
      </div>

      <RoleSelector
        availableRoles={availableRoles}
        roles={roles}
        setRoles={setRoles}
        imagesEndpoint={`${endpoint}werewolf/`}
      />

      <div className="mt-6 grid grid-cols-2 gap-4">
        <Button
          handleClick={backToLogin}
          color="red"
          className={isNight ? "text-white" : "text-gray-800"}
        >
          Voltar
        </Button>
        <Button handleClick={createRoom} disabled={connected}>
          Criar sala
        </Button>
      </div>
    </div>
  );
}

export default RoomConfig;
