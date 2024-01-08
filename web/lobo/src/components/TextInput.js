function TextInput(props) {
  return (
    <input
      type="text"
      className={`px-4 w-[${props.width}] py-2 rounded-lg`}
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
  width: "200px",
};

export default TextInput;
