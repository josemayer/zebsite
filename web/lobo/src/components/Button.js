function Button(props) {
  const { disabled } = props;

  return (
    <button
      className={`bg-${props.color} py-2 px-4 rounded-md ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      }}`}
      onClick={props.handleClick}
      disabled={props.disabled}
    >
      {props.children}
    </button>
  );
}

Button.defaultProps = {
  color: "orange",
  handleClick: () => {},
  disabled: false,
};

export default Button;
