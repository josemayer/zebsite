import { useState, useEffect } from "react";
import { IoMdInformationCircle } from "react-icons/io";

import NumericInput from "./NumericInput";
import Card from "./Card";
import Modal from "./Modal";

export default function RoleSelector(props) {
  const { availableRoles, roles, setRoles, imagesEndpoint } = props;

  const [openModal, setOpenModal] = useState(false);
  const [modalInfo, setModalInfo] = useState({});

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

  function selectRole(event, roleName) {
    const newRoles = { ...roles };

    if (!event.target.checked) {
      delete newRoles[roleName];
    } else {
      newRoles[roleName] = 1;
    }

    setRoles(newRoles);
  }

  function handleModalOpen(event, role) {
    event.preventDefault();
    setModalInfo(role);
  }

  function changeRoleQuantity(event, roleName) {
    const newRoles = { ...roles };
    const val = event.target.value;

    if (val !== "" && !isNaN(val)) {
      newRoles[roleName] = parseInt(val);
    } else {
      newRoles[roleName] = 0;
    }
    setRoles(newRoles);
  }

  function isRoleSelected(roleName) {
    return Object.prototype.hasOwnProperty.call(roles, roleName);
  }

  return (
    <div>
      <Modal opened={openModal} close={() => setOpenModal(false)}>
        <div className="flex flex-col items-center">
          <div className="w-[150px] mb-8">
            <img
              src={`${imagesEndpoint}${modalInfo.name}.svg`}
              alt={modalInfo.title}
            />
          </div>
          <div className="text-xl text-center font-bold mb-2">
            {modalInfo.title}
          </div>
          <p className="text-justify">{modalInfo.description}</p>
        </div>
      </Modal>

      <div className="grid grid-cols-2 auto-rows-max gap-4">
        {availableRoles.map((role, index) => {
          const selected = isRoleSelected(role.name);

          return (
            <label
              key={role.name}
              htmlFor={role.name}
              className={
                index === availableRoles.length - 1 &&
                availableRoles.length % 2 === 1
                  ? "col-span-2"
                  : ""
              }
            >
              <Card
                hFull
                bgClass={selected ? "bg-brandYellow" : "bg-white"}
                footer={
                  <div className="flex justify-between min-h-[30px] items-center mt-2">
                    <IoMdInformationCircle
                      onClick={(e) => handleModalOpen(e, role)}
                      className="text-black text-2xl cursor-pointer"
                    />
                    {selected && (
                      <NumericInput
                        placeholder="Qtd"
                        min="1"
                        onChange={(e) => changeRoleQuantity(e, role.name)}
                        value={roles[role.name] || ""}
                      />
                    )}
                  </div>
                }
              >
                <div className="flex items-center py-1">
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={(e) => selectRole(e, role.name)}
                    id={role.name}
                    className="mr-2"
                  />
                  <span className="font-bold text-sm truncate">
                    {role.title}
                  </span>
                </div>
                <div className="flex justify-center mt-2">
                  <div
                    className="w-[80px] h-[80px] bg-center bg-contain bg-no-repeat"
                    style={{
                      backgroundImage: `url(${imagesEndpoint}${role.name}.svg)`,
                    }}
                  ></div>
                </div>
              </Card>
            </label>
          );
        })}
      </div>
    </div>
  );
}
