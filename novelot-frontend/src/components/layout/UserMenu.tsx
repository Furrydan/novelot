import { useState } from "react";
import { FaUser } from "react-icons/fa";
import { useAuth } from "@/context/AuthContext";
import AuthDropdown from "@components/auth/AuthDropdown";
import "./UserMenu.css";

function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, isLoggedIn } = useAuth();

  const toggle = () => setIsOpen((prev) => !prev);
  const close = () => setIsOpen(false);

  return (
    <div className="usermenu">
      {isLoggedIn ? (
        <div className="usermenu__trigger">
          <FaUser className="usermenu__icon" />
          <span className="usermenu__text">{user?.email}</span>
        </div>
      ) : (
        <button type="button" className="usermenu__trigger" onClick={toggle}>
          <FaUser className="usermenu__icon" />
          <span className="usermenu__text">Login / Register</span>
        </button>
      )}
      {isOpen && <AuthDropdown onClose={close} />}
    </div>
  );
}

export default UserMenu;
