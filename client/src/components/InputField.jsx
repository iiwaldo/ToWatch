import React from "react";

export default function InputField({ label, type, value, onChange, required }) {
  return (
    <div className="auth-field">
      <input
        className="auth-input"
        type={type}
        placeholder={label}  // Use label as the placeholder
        value={value}
        onChange={onChange}
        required={required}
      />
    </div>
  );
}
