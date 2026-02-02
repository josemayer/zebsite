function Button(props) {
  const { disabled, className, children, handleClick, color } = props;

  function bgClass() {
    switch (color) {
      case "purple":
        return "bg-brandPurple";
      case "green":
        return "bg-brandGreen";
      case "red":
        return "bg-brandRed";
      case "yellow":
        return "bg-brandYellow";
      default:
        return "bg-brandOrange";
    }
  }

  return (
    <button
      className={`${bgClass()} py-2 px-4 rounded-md ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      } ${className}`}
      onClick={handleClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

Button.defaultProps = {
  color: "",
  handleClick: () => {},
  disabled: false,
};

export default Button;
