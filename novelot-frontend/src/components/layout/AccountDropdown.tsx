import { FaTimes } from "react-icons/fa";
import { useAuth } from "@/context/AuthContext";
import "./Dropdown.css";
import "./AccountDropdown.css";

type AccountDropdownProps = { onClose: () => void };

const MENU_ITEMS = [
  { label: "Profile", route: "TODO" },
  { label: "Reading History", route: "TODO" },
];

function AccountDropdown({ onClose }: AccountDropdownProps) {
  const { user, logout, isLoading } = useAuth();

  const handleLogout = async () => {
    await logout().catch(() => {});
    onClose();
  };

  return (
    <div className="dropdown account-dropdown">
      <div className="dropdown__header">
        <span className="account-dropdown__title">{user?.email}</span>
        <button
          type="button"
          className="dropdown__close"
          onClick={onClose}
          aria-label="Close"
        >
          <FaTimes />
        </button>
      </div>
      <ul className="account-dropdown__menu">
        {MENU_ITEMS.map((item) => (
          <li key={item.label}>
            <button
              className="account-dropdown__item"
              type="button"
              onClick={onClose}
            >
              {item.label}
            </button>
          </li>
        ))}
      </ul>
      <hr className="account-dropdown__divider" />
      <button
        type="button"
        className="account-dropdown__item account-dropdown__item--danger"
        onClick={handleLogout}
        disabled={isLoading}
      >
        {isLoading ? "Logging Out..." : "Logout"}
      </button>
    </div>
  );
}

export default AccountDropdown;
