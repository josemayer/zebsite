function GameHost(props) {
  return (
    <div>
      <h1>Sala {props.roomCode}</h1>
      <h2>Funções</h2>
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
