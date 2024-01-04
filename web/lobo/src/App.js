import Login from "./screens/Login";
import JoinRoom from "./screens/JoinRoom";
import Room from "./screens/Room";
import RoomConfig from "./screens/RoomConfig";
import GameHost from "./screens/GameHost";
import GamePlayer from "./screens/GamePlayer";

import { useState, useEffect, createContext } from "react";
import io from "socket.io-client";

export const UserStateContext = createContext();

function App() {
  const endpoint =
    process.env.REACT_APP_SOCKET_ENDPOINT || "http://localhost:4000/";

  const [currentScreen, setCurrentScreen] = useState("login");
  const [error, setError] = useState("");
  const [socket, setSocket] = useState(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [connected, setConnected] = useState(false);
  const [roomCode, setRoomCode] = useState("");
  const [name, setName] = useState("");
  const [playerInfo, setPlayerInfo] = useState({});
  const [playerList, setPlayerList] = useState([]);
  const [playerRole, setPlayerRole] = useState("");
  const [gameStarted, setGameStarted] = useState(false);

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

  function isHost() {
    return playerInfo.position === "host";
  }

  return (
    <div className="App">
      <UserStateContext.Provider
        value={{
          loggedIn,
          setLoggedIn,
          connected,
          setConnected,
          currentScreen,
          setCurrentScreen,
        }}
      >
        <h1>Socket.io Client</h1>
        <div style={{ color: "red" }}>{error}</div>

        {currentScreen === "login" && <Login setPlayerName={setName} />}
        {currentScreen === "joinRoom" && (
          <JoinRoom
            playerName={name}
            setRoomCode={setRoomCode}
            socket={socket}
            setPlayerList={setPlayerList}
            setPlayerInfo={setPlayerInfo}
            setError={setError}
          />
        )}
        {currentScreen === "room" && (
          <Room
            socket={socket}
            playerList={playerList}
            setPlayerList={setPlayerList}
            setPlayerInfo={setPlayerInfo}
            setError={setError}
            roomCode={roomCode}
            playerInfo={playerInfo}
            setRoomCode={setRoomCode}
            setGameStarted={setGameStarted}
            setPlayerRole={setPlayerRole}
            isHost={isHost}
          />
        )}
        {currentScreen === "roomConfig" && (
          <RoomConfig
            playerName={name}
            socket={socket}
            playerList={playerList}
            setPlayerList={setPlayerList}
            setPlayerInfo={setPlayerInfo}
            setError={setError}
            endpoint={endpoint}
            setRoomCode={setRoomCode}
          />
        )}
        {currentScreen === "gameHost" && (
          <GameHost roomCode={roomCode} playerList={playerList} />
        )}
        {currentScreen === "gamePlayer" && (
          <GamePlayer
            roomCode={roomCode}
            playerName={name}
            playerRole={playerRole}
          />
        )}
      </UserStateContext.Provider>
    </div>
  );
}

export default App;
