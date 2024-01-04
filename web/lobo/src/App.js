import Login from "./screens/Login";
import JoinRoom from "./screens/JoinRoom";
import Room from "./screens/Room";
import RoomConfig from "./screens/RoomConfig";
import GameHost from "./screens/GameHost";
import GamePlayer from "./screens/GamePlayer";

import Error from "./components/Error";

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

    document.title = "Jogo do Lobo";

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

  function setTranslatedError(error) {
    switch (error) {
      case "Room does not exist":
        setError("A sala não existe");
        break;
      case "Room is full":
        setError("A sala está cheia");
        break;
      case "No available rooms":
        setError("Não há códigos de sala disponíveis");
        break;
      case "Player already in room":
        setError("O jogador já está na sala");
        break;
      case "Player not found in room":
        setError("Jogador não encontrado na sala");
        break;
      case "Roles quantity is not equal to capacity without host":
        setError("A quantidade de funções não é igual à capacidade sem o host");
        break;
      case "Not all players have joined yet":
        setError(
          "Ainda não entraram jogadores suficientes para iniciar o jogo"
        );
        break;
      default:
        setError(error);
    }
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
        <h1>Lobo</h1>
        <Error error={error} />

        {currentScreen === "login" && <Login setPlayerName={setName} />}
        {currentScreen === "joinRoom" && (
          <JoinRoom
            playerName={name}
            setRoomCode={setRoomCode}
            socket={socket}
            setPlayerList={setPlayerList}
            setPlayerInfo={setPlayerInfo}
            setError={setTranslatedError}
          />
        )}
        {currentScreen === "room" && (
          <Room
            socket={socket}
            playerList={playerList}
            setPlayerList={setPlayerList}
            setPlayerInfo={setPlayerInfo}
            setError={setTranslatedError}
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
            setError={setTranslatedError}
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
