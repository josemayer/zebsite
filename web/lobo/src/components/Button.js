function Button(props) {
  const { disabled, className, children, handleClick, color } = props;

  function bgClass() {
    switch (color) {
      case "purple":
        return "bg-purple";
      case "green":
        return "bg-green";
      case "red":
        return "bg-red";
      case "yellow":
        return "bg-yellow";
      default:
        return "bg-orange";
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
