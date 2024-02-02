import { useState, useEffect } from "react";
import { IoMdInformationCircle } from "react-icons/io";

import NumericInput from "./NumericInput";
import Card from "./Card";
import Modal from "./Modal";

export default function RoleSelector(props) {
  const { availableRoles, roles, setRoles, setCapacity } = props;

  const [openModal, setOpenModal] = useState(false);
  const [modalInfo, setModalInfo] = useState({});

  useEffect(() => {
    let capacity = 1;
    Object.entries(roles).forEach((entry) => {
      const quantity = entry[1];
      capacity += quantity;
    });

    setCapacity(capacity);
  }, [roles, setCapacity]);

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

    if (event.target.value !== "")
      newRoles[roleName] = parseInt(event.target.value);
    else newRoles[roleName] = 0;
    setRoles(newRoles);
  }

  function isRoleSelected(roleName) {
    return roles.hasOwnProperty(roleName);
  }

  return (
    <div>
      <Modal opened={openModal} close={() => setOpenModal(false)}>
        <div className="flex flex-col items-center">
          <div className="w-[150px] mb-8">
            <img
              src={`${props.imagesEndpoint}${modalInfo.name}.svg`}
              alt={modalInfo.title}
            />
          </div>
          <div className="text-xl text-center font-bold mb-2">
            {modalInfo.title}
          </div>
          <p className="text-justify">{modalInfo.description}</p>
        </div>
      </Modal>
      <div class="grid grid-cols-2 auto-rows-max gap-4">
        {availableRoles.map((role, index) => {
          return (
            <label htmlFor={role.name}>
              <Card
                key={index}
                hFull
                bgClass={isRoleSelected(role.name) ? "bg-yellow" : "bg-white"}
                footer={
                  <div className="flex justify-between min-h-[30px] items-center mt-2">
                    <IoMdInformationCircle
                      onClick={(e) => handleModalOpen(e, role)}
                      className="text-black text-2xl"
                    />
                    {isRoleSelected(role.name) && (
                      <NumericInput
                        placeholder="Quantidade"
                        min="1"
                        onChange={(e) => changeRoleQuantity(e, role.name)}
                        value={roles[role.name]}
                      />
                    )}
                  </div>
                }
              >
                <div className="flex items-center py-1">
                  <input
                    type="checkbox"
                    onChange={(e) => selectRole(e, role.name)}
                    id={role.name}
                    value={role.name}
                    className="mr-2"
                  />
                  <span className="mr-2">{role.title}</span>
                </div>
                <div className="flex justify-center mt-2">
                  <div
                    className="w-[100px] h-[100px] bg-center bg-contain bg-no-repeat"
                    style={{
                      backgroundImage: `url(${props.imagesEndpoint}${role.name}.svg)`,
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
