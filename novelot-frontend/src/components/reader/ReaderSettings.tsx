import "./ReaderSettings.css";
import { FaMoon, FaSun } from "react-icons/fa";
import type { Font, Theme } from "@novelot-types/ReaderSettings";

type ReaderSettingsProps = {
  theme: Theme;
  toggleTheme: () => void;
  font: Font;
  changeFont: (font: Font) => void;
  size: number;
  changeSize: (number: number) => void;
};

const MIN_FONT_SIZE = 14;
const MAX_FONT_SIZE = 28;
const FONT_SIZE_STEP = 2;

function ReaderSettings({
  theme,
  toggleTheme,
  font,
  changeFont,
  size,
  changeSize,
}: ReaderSettingsProps) {
  return (
    <div className="reader-settings__box" data-theme={theme}>
      <div className="reader-settings__box__theme">
        <label>Theme: </label>
        <button
          type="button"
          className="reader-settings__box__theme__icon"
          onClick={toggleTheme}
          aria-label={theme === "light" ? "Switch to dark theme" : "Switch to light theme"}
        >
          {theme === "light" ? <FaSun /> : <FaMoon />}
        </button>
      </div>
      <div className="reader-settings__box__font">
        <label>Font : </label>
        <select
          value={font}
          onChange={(e) =>
            changeFont(e.target.value as ReaderSettingsProps["font"])
          }
        >
          <option value={"sans"}>Sans</option>
          <option value={"serif"}>Serif</option>
          <option value={"system"}>System</option>
        </select>
      </div>
      <div className="reader-settings__box__size">
        <button
          type="button"
          className="reader-settings__box__size__button"
          onClick={() => changeSize(-FONT_SIZE_STEP)}
          disabled={size <= MIN_FONT_SIZE}
        >
          A−
        </button>
        <p>{size}</p>
        <button
          type="button"
          className="reader-settings__box__size__button"
          onClick={() => changeSize(FONT_SIZE_STEP)}
          disabled={size >= MAX_FONT_SIZE}
        >
          A+
        </button>
      </div>
    </div>
  );
}

export default ReaderSettings;
