function Card(props) {
  return (
    <div
      className={`${props.bgClass} ${props.textClass} ${
        props.hFull && "h-full"
      } rounded-lg px-4 py-2 flex flex-col justify-between transition-all select-none`}
    >
      <div>{props.children}</div>
      <div>{props.footer}</div>
    </div>
  );
}

Card.defaultProps = {
  hFull: false,
  bgClass: "bg-white",
  textClass: "text-black",
};

export default Card;
