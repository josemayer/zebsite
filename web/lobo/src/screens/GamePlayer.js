function GamePlayer(props) {
  return (
    <div>
      <h1>
        {props.roomCode} - {props.playerName}
      </h1>
      <p>Role: {props.playerRole}</p>
    </div>
  );
}

export default GamePlayer;
