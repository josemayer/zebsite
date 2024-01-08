import { IoMdInformationCircle } from "react-icons/io";
import { GiDeathSkull } from "react-icons/gi";
import { FaUndo } from "react-icons/fa";
import { useState, useEffect } from "react";
import Modal from "../components/Modal";

function GameHost(props) {
  const endpoint = props.endpoint;

  const [roles, setRoles] = useState({});
  const [openModal, setOpenModal] = useState(false);
  const [isAlive, setIsAlive] = useState({});
  const [modalInfo, setModalInfo] = useState({});

  useEffect(() => {
    const isAliveObj = props.playerList.reduce((acc, player) => {
      return { ...acc, [player.id]: true };
    }, {});
    setIsAlive(isAliveObj);
  }, [props.playerList]);

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

  useEffect(() => {
    if (modalInfo && modalInfo.name) {
      setOpenModal(true);
    }
  }, [modalInfo]);

  useEffect(() => {
    if (!openModal) {
      setModalInfo({});
    }
  }, [openModal]);

  return (
    <div className="flex flex-col w-[300px]">
      <Modal opened={openModal} close={() => setOpenModal(false)}>
        <div className="flex flex-col items-center max-w-[300px]">
          <div className="w-[150px] mb-8">
            <img
              src={`${endpoint}werewolf/${modalInfo.name}.svg`}
              alt={modalInfo.title}
            />
          </div>
          <div className="text-xl text-center font-bold mb-2">
            {modalInfo.title}
          </div>
          <p className="text-justify">{modalInfo.description}</p>
        </div>
      </Modal>
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
                <div class="flex justify-between items-center">
                  <span className={!isAlive[player.id] ? "opacity-50" : ""}>
                    {player.name} - {roles[player.role]?.title}
                    <IoMdInformationCircle
                      className="ml-2 mb-1 inline-block text-base text-white cursor-pointer"
                      onClick={() => setModalInfo(roles[player.role])}
                    />
                  </span>
                  <span>
                    {isAlive[player.id] ? (
                      <button
                        className="text-white text-xl"
                        onClick={() => {
                          setIsAlive({ ...isAlive, [player.id]: false });
                        }}
                      >
                        <GiDeathSkull />
                      </button>
                    ) : (
                      <button
                        className="text-white text-xl"
                        onClick={() => {
                          setIsAlive({ ...isAlive, [player.id]: true });
                        }}
                      >
                        <FaUndo />
                      </button>
                    )}
                  </span>
                </div>
              </li>
            )
        )}
      </ul>
    </div>
  );
}

export default GameHost;
