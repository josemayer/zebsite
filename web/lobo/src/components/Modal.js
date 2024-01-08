import { useEffect } from "react";
import { IoIosCloseCircleOutline } from "react-icons/io";

function Modal(props) {
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === "Escape") {
        props.close();
      }
    };
    window.addEventListener("keydown", handleEsc);

    return () => {
      window.removeEventListener("keydown", handleEsc);
    };
  }, [props]);

  return props.opened ? (
    <div
      className="w-screen h-screen bg-black bg-opacity-50 absolute top-0 left-0 flex items-center justify-center z-10"
      onClick={props.close}
    >
      <div
        className="bg-white px-12 py-8 rounded relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-1 right-1">
          <button onClick={props.close}>
            <IoIosCloseCircleOutline className="text-2xl text-black" />
          </button>
        </div>
        {props.children}
      </div>
    </div>
  ) : null;
}

export default Modal;