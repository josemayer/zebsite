import RoleSelector from './RoleSelector';
import { useState, useEffect } from 'react';
import io from 'socket.io-client';

function App() {
  const endpoint = process.env.REACT_APP_SOCKET_ENDPOINT || "http://localhost:4000/";
  const defaultCapacity = 1;


  const [currentScreen, setCurrentScreen] = useState('login');
  const [error, setError] = useState("");
  const [socket, setSocket] = useState(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [connected, setConnected] = useState(false);
  const [roomCode, setRoomCode] = useState("");
  const [roomInput, setRoomInput] = useState("");
  const [name, setName] = useState("");
  const [playerInfo, setPlayerInfo] = useState({});
  const [roles, setRoles] = useState({});
  const [availableRoles, setAvailableRoles] = useState([]);
  const [capacity, setCapacity] = useState(defaultCapacity);
  const [playerList, setPlayerList] = useState([]);
  const [playerRole, setPlayerRole] = useState("");
  const [gameStarted, setGameStarted] = useState(false);

  useEffect(() => {
    fetch(`${endpoint}werewolf/roles`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch available roles');
        else return res.json();
      })
      .then(data => {
        setAvailableRoles(data.roles);
      });
  }, []);

  useEffect(() => {
    const newSocket = io(endpoint, { autoConnect: false });
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    setError("");
  }, [currentScreen]);

  useEffect(() => {
    playerList.forEach((player) => {
      if (player.id === playerInfo.id && player.position !== playerInfo.position) {
        const newPlayerInfo = {
          name: player.name,
          id: player.id,
          position: player.position
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

  function handleHost() {
    setLoggedIn(true);
    setCurrentScreen("roomConfig");
  }

  function isHost() {
    return playerInfo.position === "host";
  }

  function createRoom() {
    if (socket) {
      socket.connect();
      const roomData = {
        capacity: parseInt(capacity),
        roles: roles
      };

      const playerData = {
        name: name,
        position: "host",
      };

      socket.emit("create_new_room", { roomData: roomData, playerData: playerData});

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

  function handlePlayer() {
    setLoggedIn(true);
    setCurrentScreen("joinRoom");
  }

  function joinRoom() {
    if (socket) {
      socket.connect();
      const playerData = {
        name: name,
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

  function backToSelect() {
    setLoggedIn(false);
    setCurrentScreen("login");
    setRoles({});
  }

  const screens = {
    login: (
      <div>
        <p>
          <input placeholder="Player name" value={name} onChange={(e) => setName(e.target.value)} disabled={loggedIn} />
        </p>
        <p>
          <button onClick={handleHost} disabled={loggedIn}>Host</button>
          <button onClick={handlePlayer} disabled={loggedIn}>Player</button>
        </p>
      </div>
    ),
    joinRoom: (
      <div>
        <p>
          <input placeholder="Room code" value={roomInput} onChange={(e) => setRoomInput(e.target.value)} disabled={!loggedIn || connected} />
        </p>
        <p>
          <button onClick={backToSelect} disabled={!loggedIn || connected}>Back</button>
          <button onClick={joinRoom} disabled={!loggedIn || connected}>Go to room</button>
        </p>
      </div>
    ),
    roomConfig: (
      <div>
        <p>
          <label htmlFor="capacity">Capacity:</label>
          <input id="capacity" value={capacity} onChange={(e) => setCapacity(e.target.value)} disabled={!loggedIn || connected} />
        </p>
        <RoleSelector availableRoles={availableRoles} roles={roles} setRoles={setRoles} />
        <p>
          <button onClick={createRoom} disabled={!loggedIn || connected}>Create room</button>
        </p>
      </div>
    ),
    room: (
      <div>
        <h1>{roomCode}</h1>
        <ul>
          {playerList.map((player, index) => (
            <li key={index} style={player.position === "host" ? { color: "red" } : {}}>{player.name}</li>
          ))}
        </ul>
        {connected && <button onClick={leaveRoom}>Leave Room</button>}
        {connected && isHost() && <button onClick={startGame}>Start Game</button>}
      </div>
    ),
    gameHost: (
      <div>
        <h1>{roomCode} - Started Game</h1>
        <ul>
          {playerList.map((player, index) => player.position !== "host" && <li key={index}>{player.name} - {player.role}</li>)}
        </ul>
      </div>
    ),
    gamePlayer: (
      <div>
        <h1>{roomCode} - {name}</h1>
        <p>Role: {playerRole}</p>
      </div>
    )
  };

  return (
    <div className="App">
      <h1>Socket.io Client</h1>
      <div style={{color: "red"}}>{error}</div>

      {currentScreen === 'login' && screens.login}
      {currentScreen === 'joinRoom' && screens.joinRoom}
      {currentScreen === 'room' && screens.room}
      {currentScreen === 'roomConfig' && screens.roomConfig}
      {currentScreen === 'gameHost' && screens.gameHost}
      {currentScreen === 'gamePlayer' && screens.gamePlayer}
    </div>
  );
}

export default App;
