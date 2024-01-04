function TextInput(props) {
  return (
    <input
      type="text"
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
