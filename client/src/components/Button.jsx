export default function Button({ label, onClick, type = "button" }) {
  return (
    <button className="auth-button" type={type} onClick={onClick}>
      {label}
    </button>
  );
}
