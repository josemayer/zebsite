function GamePlayer(props) {
  return (
    <div className="flex flex-col w-[300px]">
      <div className="text-3xl text-center text-white border-b-[1px] pb-2">
        {props.playerName}
      </div>
      <div className="text-xl text-white text-center font-bold mb-2">
        {props.playerRole}
      </div>
      <p className="text-white">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin aliquam
        vel sapien quis tempor. Nulla fermentum ac augue vitae euismod. Quisque
        nec egestas arcu. Maecenas nibh augue, eleifend ac varius vitae. nec.
      </p>
    </div>
  );
}

export default GamePlayer;
