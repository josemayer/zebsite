function GameHost(props) {
  return (
    <div>
      <h1>{props.roomCode} - Started Game</h1>
      <ul>
        {props.playerList.map(
          (player, index) =>
            player.position !== "host" && (
              <li key={index}>
                {player.name} - {player.role}
              </li>
            )
        )}
      </ul>
    </div>
  );
}

export default GameHost;
