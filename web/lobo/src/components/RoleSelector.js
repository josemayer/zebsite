import { useState, useEffect } from "react";
import NumericInput from "./NumericInput";

export default function RoleSelector(props) {
  const { availableRoles, roles, setRoles, setCapacity } = props;

  useEffect(() => {
    let capacity = 1;
    Object.entries(roles).forEach((entry) => {
      const [roleName, quantity] = entry;
      capacity += quantity;
    });

    setCapacity(capacity);
  }, [roles]);

  function selectRole(event, roleName) {
    const newRoles = { ...roles };

    if (!event.target.checked) {
      delete newRoles[roleName];
    } else {
      newRoles[roleName] = 1;
    }

    setRoles(newRoles);
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
      {availableRoles.map((role, index) => {
        return (
          <div key={index}>
            <input
              type="checkbox"
              onChange={(e) => selectRole(e, role.name)}
              id={role.name}
              value={role.name}
            />
            <label htmlFor={role.name}>{role.title}</label>

            {isRoleSelected(role.name) && (
              <NumericInput
                placeholder="Quantidade"
                min="1"
                onChange={(e) => changeRoleQuantity(e, role.name)}
                value={roles[role.name]}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
