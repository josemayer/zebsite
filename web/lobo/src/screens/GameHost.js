import { useState, useEffect } from "react";

function GameHost(props) {
  const endpoint = props.endpoint;

  const [roles, setRoles] = useState({});

  useEffect(() => {
    fetch(`${endpoint}werewolf/roles`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch available roles");
        else return res.json();
      })
      .then((data) => {
        const rolesObj = data.roles.reduce((acc, role) => {
          return { ...acc, [role.name]: role };
        }, {});
        setRoles(rolesObj);
      });

    return () => {
      setRoles([]);
    };
  }, [endpoint]);

  return (
    <div className="flex flex-col w-[300px]">
      <div className="flex justify-between items-center text-3xl text-white border-b-[1px] pb-2 mb-4">
        <span>
          Sala <strong>{props.roomCode}</strong>
        </span>
        <span className="text-xl">
          (
          {`${props.playerList.length - 1} jogador${
            props.playerList.length - 1 > 1 ? "es" : ""
          }`}
          )
        </span>
      </div>
      <h2 className="text-xl text-white text-center mb-4">Funções</h2>
      <ul className="list-disc list-inside text-white">
        {props.playerList.map(
          (player, index) =>
            player.position !== "host" && (
              <li key={index}>
                {player.name} - {roles[player.role]?.title}
              </li>
            )
        )}
      </ul>
    </div>
  );
}

export default GameHost;
