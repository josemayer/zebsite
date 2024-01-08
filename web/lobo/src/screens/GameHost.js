function GameHost(props) {
  return (
    <div className="flex flex-col w-[300px]">
      <div className="flex justify-between items-center text-3xl text-white border-b-[1px] pb-2 mb-4">
        <span>
          Sala <strong>{props.roomCode}</strong>
        </span>
        <span className="text-xl">
          ({`${props.playerList.length} jogadores`})
        </span>
      </div>
      <h2 className="text-xl text-white text-center mb-4">Funções</h2>
      <ul className="list-disc list-inside text-white">
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
