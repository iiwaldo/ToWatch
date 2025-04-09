export default function Button({label,onClick}) {
    return (
        <button className="auth-button" type="submit" onClick={onClick}>
            {label}
        </button>
    );
}