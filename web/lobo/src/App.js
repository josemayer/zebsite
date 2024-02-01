import Login from "./screens/Login";
import JoinRoom from "./screens/JoinRoom";
import Room from "./screens/Room";
import RoomConfig from "./screens/RoomConfig";
import GameHost from "./screens/GameHost";
import GamePlayer from "./screens/GamePlayer";

import Logo from "./components/Logo";
import Error from "./components/Error";

import { useState, useEffect, createContext } from "react";
import io from "socket.io-client";

import "./App.css";

export const UserStateContext = createContext();

function App() {
  const endpoint =
    process.env.REACT_APP_SOCKET_ENDPOINT || "http://localhost:4000/";

  const [currentScreen, setCurrentScreen] = useState("login");
  const [error, setError] = useState("");
  const [socket, setSocket] = useState(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [connected, setConnected] = useState(false);
  const [roomInfo, setRoomInfo] = useState({});
  const [name, setName] = useState("");
  const [playerInfo, setPlayerInfo] = useState({});
  const [playerList, setPlayerList] = useState([]);
  const [playerRole, setPlayerRole] = useState("");

  useEffect(() => {
    const newSocket = io(endpoint, {
      autoConnect: false,
      closeOnBeforeunload: false,
    });
    setSocket(newSocket);

    const handleBeforeUnload = (e) => {
      newSocket.emit("manual_disconnect");
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      newSocket.disconnect();
      setSocket(null);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [endpoint]);

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
    <div className="flex justify-center items-center h-screen font-['Salsa'] bg-purple relative">
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
        <div className="flex flex-col justify-center p-4 w-[250px] sm:w-[300px] md:w-[400px]">
          <Logo />
          <Error error={error} />

          {currentScreen === "login" && (
            <Login
              playerName={name}
              setPlayerName={setName}
              setError={setError}
            />
          )}
          {currentScreen === "joinRoom" && (
            <JoinRoom
              playerName={name}
              setRoomInfo={setRoomInfo}
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
              roomInfo={roomInfo}
              playerInfo={playerInfo}
              setRoomInfo={setRoomInfo}
              setPlayerRole={setPlayerRole}
              isHost={isHost}
            />
          )}
          {currentScreen === "roomConfig" && (
            <RoomConfig
              playerName={name}
              socket={socket}
              setPlayerList={setPlayerList}
              setPlayerInfo={setPlayerInfo}
              setError={setTranslatedError}
              endpoint={endpoint}
              setRoomInfo={setRoomInfo}
            />
          )}
          {currentScreen === "gameHost" && (
            <GameHost
              roomCode={roomInfo.code}
              playerList={playerList}
              endpoint={endpoint}
            />
          )}
          {currentScreen === "gamePlayer" && (
            <GamePlayer
              roomCode={roomInfo.code}
              playerName={name}
              playerRole={playerRole}
              endpoint={endpoint}
            />
          )}
        </div>
      </UserStateContext.Provider>
    </div>
  );
}

export default App;
