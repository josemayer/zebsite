import { useState, useEffect, createContext, useRef } from "react";
import io from "socket.io-client";

import Login from "./screens/Login";
import JoinRoom from "./screens/JoinRoom";
import Room from "./screens/Room";
import RoomConfig from "./screens/RoomConfig";
import GameBoard from "./screens/GameBoard";

import Logo from "./components/Logo";
import Error from "./components/Error";

import "./App.css";

function ThemeTransitionOverlay({ isNight, gameState }) {
  const [showOverlay, setShowOverlay] = useState(false);
  const [isFading, setIsFading] = useState(false);
  const [transitionEmoji, setTransitionEmoji] = useState("");
  const lastThemeRef = useRef(isNight);
  const audioRef = useRef(null);
  const fadeIntervalRef = useRef(null);

  useEffect(() => {
    const fadeAudio = (audio, targetVolume, duration = 500) => {
      if (!audio) return;

      const startVolume = audio.volume;
      const volumeDiff = targetVolume - startVolume;
      const steps = 20;
      const stepDuration = duration / steps;
      let currentStep = 0;

      clearInterval(fadeIntervalRef.current);

      fadeIntervalRef.current = setInterval(() => {
        currentStep++;
        const progress = currentStep / steps;
        audio.volume = startVolume + volumeDiff * progress;

        if (currentStep >= steps) {
          clearInterval(fadeIntervalRef.current);
          audio.volume = targetVolume;
          if (targetVolume === 0) {
            audio.pause();
            audio.currentTime = 0;
          }
        }
      }, stepDuration);
    };

    const playThemeSound = (isNightTheme) => {
      if (audioRef.current) {
        fadeAudio(audioRef.current, 0, 200);
      }

      const audioSrc = isNightTheme ? "/wolf-howling.mp3" : "/clock-alarm.mp3";
      audioRef.current = new Audio(audioSrc);

      audioRef.current.volume = 0;
      audioRef.current.loop = false;

      audioRef.current
        .play()
        .then(() => {
          fadeAudio(audioRef.current, 0.6, 300);
        })
        .catch((err) => {
          console.log("Audio play failed:", err);
        });
    };

    if (lastThemeRef.current !== isNight && gameState?.phase) {
      const startTimer = setTimeout(() => {
        const emoji = isNight ? "🌙" : "⏰";

        setTransitionEmoji(emoji);
        setShowOverlay(true);
        setIsFading(false);

        playThemeSound(isNight);

        const fadeStartTimer = setTimeout(() => {
          setIsFading(true);
        }, 1500);

        const fadeCompleteTimer = setTimeout(() => {
          setShowOverlay(false);
          setIsFading(false);

          if (audioRef.current) {
            fadeAudio(audioRef.current, 0, 500);
          }
        }, 2000);

        return () => {
          clearTimeout(fadeStartTimer);
          clearTimeout(fadeCompleteTimer);
        };
      }, 200);

      lastThemeRef.current = isNight;

      return () => clearTimeout(startTimer);
    }
  }, [isNight, gameState?.phase]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      if (fadeIntervalRef.current) {
        clearInterval(fadeIntervalRef.current);
      }
    };
  }, []);

  if (!showOverlay) return null;

  return (
    <div
      className={`fixed inset-0 z-50 pointer-events-none transition-opacity duration-500 ${
        isFading ? "opacity-0" : "opacity-100"
      }`}
    >
      <div
        className={`absolute inset-0 bg-black/20 backdrop-blur-sm transition-all duration-500 ${
          isFading ? "backdrop-blur-none bg-transparent" : ""
        }`}
      />

      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className={`text-8xl transition-opacity duration-500 ${
            isFading ? "opacity-0" : "animate-bounce"
          }`}
        >
          <div
            className="animate-in slide-in-from-bottom-4 duration-1000 ease-out"
            style={{
              animation: "slideUp 1s ease-out forwards",
            }}
          >
            {transitionEmoji}
          </div>
        </div>
      </div>
    </div>
  );
}

export const UserStateContext = createContext();

export const ThemeContext = createContext();

function ThemeProvider({ children, gameState }) {
  const isNight = gameState?.phase === "NIGHT";

  return (
    <ThemeContext.Provider value={{ isNight }}>
      <div className="min-h-screen relative overflow-hidden">
        <div
          className={`absolute inset-0 bg-gradient-to-b from-[#fff5f5] to-[#d8b4fe] theme-layer ${
            !isNight ? "opacity-100" : "opacity-0"
          }`}
        />
        <div
          className={`absolute inset-0 bg-gradient-to-b from-[#1a0b2e] to-[#522aa9] theme-layer ${
            isNight ? "opacity-100" : "opacity-0"
          }`}
        />
        <div className="relative z-10">{children}</div>
      </div>
    </ThemeContext.Provider>
  );
}

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
  const [gameState, setGameState] = useState(null);
  const [secretData, setSecretData] = useState(null);

  const isNight = gameState?.phase === "NIGHT";

  useEffect(() => {
    const newSocket = io(endpoint, {
      autoConnect: false,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity,
    });
    setSocket(newSocket);

    const handleBeforeUnload = () => {
      newSocket.disconnect();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      newSocket.disconnect();
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [endpoint]);

  useEffect(() => {
    if (!socket) return;

    const handleConnect = () => {
      setConnected(true);
      if (roomInfo.code && name) {
        const position = playerInfo.position || "player";
        socket.emit("join_room", {
          name,
          position,
          roomCode: roomInfo.code,
        });
      }
    };

    const handleDisconnect = () => {
      setConnected(false);
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
    };
  }, [socket, roomInfo, name, playerInfo]);

  useEffect(() => {
    if (!socket) return;

    const onGameUpdate = (data) => {
      setGameState(data);
      setCurrentScreen((prev) => (prev !== "gameBoard" ? "gameBoard" : prev));
    };

    const onSecretData = (data) => {
      setSecretData(data);
    };

    const onError = (msg) => {
      setTranslatedError(msg);
    };

    socket.on("game_update", onGameUpdate);
    socket.on("player_secret_data", onSecretData);
    socket.on("error", onError);

    return () => {
      socket.off("game_update", onGameUpdate);
      socket.off("player_secret_data", onSecretData);
      socket.off("error", onError);
    };
  }, [socket]);

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
    <ThemeProvider gameState={gameState}>
      <div className="flex justify-center items-center min-h-screen font-['Salsa']">
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
          <ThemeTransitionOverlay isNight={isNight} gameState={gameState} />

          <div className="flex flex-col justify-start p-4 w-[320px] sm:w-[450px] md:w-[550px]">
            <Logo gameState={gameState} />
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
            {currentScreen === "gameBoard" && (
              <GameBoard
                socket={socket}
                gameState={gameState}
                secretData={secretData}
                playerName={name}
                endpoint={endpoint}
              />
            )}
          </div>
        </UserStateContext.Provider>
      </div>
    </ThemeProvider>
  );
}

export default App;
