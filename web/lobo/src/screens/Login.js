import Button from "../components/Button";
import TextInput from "../components/TextInput";
import { useState, useContext } from "react";
import { UserStateContext } from "../App";

function Login(props) {
  const { loggedIn, setLoggedIn, setCurrentScreen } =
    useContext(UserStateContext);

  const [playerInput, setPlayerInput] = useState("");

  function handleHost() {
    setLoggedIn(true);
    props.setPlayerName(playerInput);
    setCurrentScreen("roomConfig");
  }

  function handlePlayer() {
    setLoggedIn(true);
    props.setPlayerName(playerInput);
    setCurrentScreen("joinRoom");
  }

  return (
    <div>
      <p>
        <TextInput
          placeholder="Player name"
          value={playerInput}
          onChange={(e) => setPlayerInput(e.target.value)}
          disabled={loggedIn}
        />
      </p>
      <p>
        <Button handleClick={handleHost} disabled={loggedIn}>
          Host
        </Button>
        <Button handleClick={handlePlayer} disabled={loggedIn}>
          Player
        </Button>
      </p>
    </div>
  );
}

export default Login;
