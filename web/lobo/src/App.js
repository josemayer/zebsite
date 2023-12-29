import { useState, useEffect } from 'react';
import io from 'socket.io-client';

function App() {
  const [currentScreen, setCurrentScreen] = useState('login');
  const [socket, setSocket] = useState(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [connected, setConnected] = useState(false);
  const [roomCode, setRoomCode] = useState("");
  const [roomInput, setRoomInput] = useState("");
  const [name, setName] = useState("");
  const [playerList, setPlayerList] = useState([]);

  useEffect(() => {
    const newSocket = io("http://localhost:4000", { autoConnect: false });
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (socket) {
      const updateEvents = ["player_joined", "player_left"];

      updateEvents.forEach((event) => {
        socket.on(event, (players) => {
          setPlayerList(players);
        });
      });
    }
  }, [socket]);

  function handleHost() {
    if (socket) {
      socket.connect();
      const playerData = {
        name: name,
        position: "host",
      };

      setLoggedIn(true);
      setConnected(true);
      setCurrentScreen("room");
      socket.emit("create_new_room", playerData);

      socket.on("room_created", (room) => {
        setRoomCode(room.code.toString());
        setPlayerList(room.players);
      });
    }
  }

  function handlePlayer() {
    setLoggedIn(true);
    setCurrentScreen("joinRoom");
  }

  function loginPlayer() {
    if (socket) {
      socket.connect();
      const playerData = {
        name: name,
        position: "player",
        roomCode: roomInput,
      };

      setLoggedIn(true);
      setConnected(true);
      setCurrentScreen("room");
      socket.emit("join_room", playerData);

      socket.on("room_joined", (room) => {
        setRoomCode(room.code.toString());
        setPlayerList(room.players);
      });

      socket.on("error", (error) => {
        console.error(error);
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
        setCurrentScreen("joinRoom");
      });

      socket.on("error", (error) => {
        console.error(error);
      });
    }
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
          <button onClick={loginPlayer} disabled={!loggedIn || connected}>Go to room</button>
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
      </div>
    )
  };

  return (
    <div className="App">
      <h1>Socket.io Client</h1>

      {currentScreen === 'login' && screens.login}
      {currentScreen === 'joinRoom' && screens.joinRoom}
      {currentScreen === 'room' && screens.room}
    </div>
  );
}

export default App;
