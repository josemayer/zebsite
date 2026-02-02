import { useContext } from "react";
import { ThemeContext } from "../App";

function TextInput(props) {
  const { isNight } = useContext(ThemeContext);

  return (
    <input
      type="text"
      className={`px-4 w-full py-2 rounded-lg ${
        isNight
          ? "bg-white/10 border border-white/20 text-white placeholder-gray-400"
          : "bg-white border border-gray-300 text-[#2e1065] placeholder-gray-500"
      } focus:outline-none focus:border-blue-400 transition-colors`}
      value={props.value}
      onChange={props.onChange}
      placeholder={props.placeholder}
      disabled={props.disabled}
    />
  );
}

TextInput.defaultProps = {
  value: "",
  onChange: () => {},
  placeholder: "",
  disabled: false,
};

export default TextInput;
