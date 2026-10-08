import { useState } from "react";
import { FaTimes } from "react-icons/fa";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";
import "@components/layout/Dropdown.css";
import "./AuthDropdown.css";

type AuthDropdownProps = {
  onClose: () => void;
};

function AuthDropdown({ onClose }: AuthDropdownProps) {
  const [mode, setMode] = useState<"login" | "register">("login");

  return (
    <div className="dropdown auth-dropdown">
      <div className="dropdown__header">
        <div className="auth-dropdown__tabs">
          <button
            type="button"
            className={`auth-dropdown__tab ${mode === "login" ? "auth-dropdown__tab--active" : ""}`}
            onClick={() => setMode("login")}
          >
            Login
          </button>
          <button
            type="button"
            className={`auth-dropdown__tab ${mode === "register" ? "auth-dropdown__tab--active" : ""}`}
            onClick={() => setMode("register")}
          >
            Register
          </button>
        </div>
        <button
          type="button"
          className="dropdown__close"
          onClick={onClose}
          aria-label="Close"
        >
          <FaTimes />
        </button>
      </div>
      <div className="auth-dropdown__body">
        {mode === "login" && <LoginForm onSuccess={onClose} />}
        {mode === "register" && <RegisterForm onSuccess={onClose} />}
      </div>
    </div>
  );
}

export default AuthDropdown;
