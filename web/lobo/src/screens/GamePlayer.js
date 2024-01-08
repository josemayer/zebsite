import { useState, useEffect } from "react";

function GamePlayer(props) {
  const { endpoint, playerName, playerRole } = props;

  const [roleInfo, setRoleInfo] = useState({});

  useEffect(() => {
    fetch(`${endpoint}werewolf/roles/${playerRole}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch your role information");
        else return res.json();
      })
      .then((data) => {
        setRoleInfo(data);
      });

    return () => {
      setRoleInfo({});
    };
  }, [endpoint]);

  return (
    <div className="flex flex-col w-[300px]">
      <div className="text-3xl text-center text-white border-b-[1px] pb-2">
        {playerName}
      </div>

      <div className="py-8 flex justify-center">
        <img
          src={`${endpoint}werewolf/${roleInfo.name}.svg`}
          width="150px"
          alt={roleInfo.title}
          style={{
            filter: `invert(100%) sepia(93%) saturate(0%) hue-rotate(201deg) brightness(106%) contrast(106%)`,
          }}
        />
      </div>

      <div className="text-xl text-white text-center font-bold mb-2">
        {roleInfo.title}
      </div>
      <p className="text-white text-justify">{roleInfo.description}</p>
    </div>
  );
}

export default GamePlayer;
