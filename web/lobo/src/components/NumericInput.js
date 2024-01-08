function NumericInput(props) {
  return (
    <input
      type="number"
      className="pl-3 pr-1 rounded-md"
      value={props.value}
      onChange={props.onChange}
      placeholder={props.placeholder}
      min={props.min}
      max={props.max}
      disabled={props.disabled}
    />
  );
}

NumericInput.defaultProps = {
  value: 0,
  onChange: () => {},
  placeholder: "",
  min: 0,
  max: 100,
  disabled: false,
};

export default NumericInput;
