export default function Button({label}) {
    return (
        <button className="auth-button" type="submit">
            {label}
        </button>
    );
}