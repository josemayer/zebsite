function GamePlayer(props) {
  return (
    <div>
      <h1>Sala {props.roomCode}</h1>
      <h2>{props.playerName}</h2>
      <p>Role: {props.playerRole}</p>
    </div>
  );
}

export default GamePlayer;
