import "./ReaderSettings.css";
import { FaMoon, FaSun } from "react-icons/fa";
import {
  FONT_SIZE_RANGE,
  FONTS,
  changeFont,
  changeFontSize,
  toggleTheme,
  type Font,
  type ReaderSettings as Settings,
} from "@novelot-types/readerSettingsLogic";

type ReaderSettingsProps = {
  settings: Settings;
  onSettingsChange: (settings: Settings) => void;
};

function ReaderSettings({ settings, onSettingsChange }: ReaderSettingsProps) {
  return (
    <div className="reader-settings__box" data-theme={settings.theme}>
      <div className="reader-settings__box__theme">
        <label>Theme: </label>
        <button
          type="button"
          className="reader-settings__box__theme__icon"
          onClick={() => onSettingsChange(toggleTheme(settings))}
          aria-label={settings.theme === "light" ? "Switch to dark theme" : "Switch to light theme"}
        >
          {settings.theme === "light" ? <FaSun /> : <FaMoon />}
        </button>
      </div>
      <div className="reader-settings__box__font">
        <label>Font : </label>
        <select
          value={settings.font}
          onChange={(e) =>
            onSettingsChange(changeFont(settings, e.target.value as Font))
          }
        >
          {FONTS.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <div className="reader-settings__box__size">
        <button
          type="button"
          className="reader-settings__box__size__button"
          onClick={() =>
            onSettingsChange(changeFontSize(settings, -FONT_SIZE_RANGE.step))
          }
          disabled={settings.fontSize <= FONT_SIZE_RANGE.min}
        >
          A−
        </button>
        <p>{settings.fontSize}</p>
        <button
          type="button"
          className="reader-settings__box__size__button"
          onClick={() =>
            onSettingsChange(changeFontSize(settings, FONT_SIZE_RANGE.step))
          }
          disabled={settings.fontSize >= FONT_SIZE_RANGE.max}
        >
          A+
        </button>
      </div>
    </div>
  );
}

export default ReaderSettings;
