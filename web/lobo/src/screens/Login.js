import Button from "../components/Button";
import TextInput from "../components/TextInput";
import { useState, useContext } from "react";
import { UserStateContext } from "../App";

function Login(props) {
  const { playerName, setPlayerName, setError } = props;

  const { loggedIn, setLoggedIn, setCurrentScreen } =
    useContext(UserStateContext);

  const [playerInput, setPlayerInput] = useState(playerName);

  function checkInput() {
    if (playerInput === "") {
      setError("O nome não pode ser vazio");
      return false;
    }
    return true;
  }

  function handleHost() {
    if (!checkInput()) return;

    setLoggedIn(true);
    setPlayerName(playerInput);
    setCurrentScreen("roomConfig");
  }

  function handlePlayer() {
    if (!checkInput()) return;

    setLoggedIn(true);
    setPlayerName(playerInput);
    setCurrentScreen("joinRoom");
  }

  return (
    <div className="bla">
      <p>
        <TextInput
          placeholder="Nome"
          value={playerInput}
          onChange={(e) => setPlayerInput(e.target.value)}
          disabled={loggedIn}
          width="300px"
        />
      </p>
      <div className="text-white text-center py-2">Entrar como...</div>
      <div className="flex justify-evenly">
        <Button handleClick={handleHost} disabled={loggedIn} color="orange">
          Anfitrião
        </Button>
        <Button handleClick={handlePlayer} disabled={loggedIn} color="yellow">
          Jogador
        </Button>
      </div>
    </div>
  );
}

export default Login;
