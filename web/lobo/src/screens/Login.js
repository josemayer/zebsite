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
    } else if (playerInput.length > 20) {
      setError("O nome não pode ter mais de 20 caracteres");
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
    <div className="flex flex-col">
      <div>
        <TextInput
          placeholder="Nome"
          value={playerInput}
          onChange={(e) => setPlayerInput(e.target.value)}
          disabled={loggedIn}
          width="300px"
        />
      </div>
      <div className="text-white text-center py-2">Entrar como...</div>
      <div className="grid grid-cols-2 gap-4">
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
