import {
  type ReaderSettings,
  changeFont,
  changeFontSize,
  toggleTheme,
} from "@novelot-types/readerSettingsLogic";
import { expect, it, describe } from "vitest";

const settings: ReaderSettings = {
  theme: "light",
  font: "serif",
  fontSize: 18,
};

describe("changeFontSize", () => {
  it("Increases font size by delta", () => {
    expect(changeFontSize(settings, 2)).toEqual({ ...settings, fontSize: 20 });
  });

  it("Decreases font size by delta", () => {
    expect(changeFontSize(settings, -2)).toEqual({ ...settings, fontSize: 16 });
  });

  it("Stays at maximum font size", () => {
    expect(changeFontSize({ ...settings, fontSize: 28 }, 2).fontSize).toBe(28);
  });

  it("Stays at minimum font size", () => {
    expect(changeFontSize({ ...settings, fontSize: 14 }, -2).fontSize).toBe(14);
  });

  it("Does not mutate the given settings", () => {
    changeFontSize(settings, 2);
    expect(settings.fontSize).toBe(18);
  });
});

describe("toggleTheme", () => {
  it("Switches light to dark", () => {
    expect(toggleTheme(settings)).toEqual({ ...settings, theme: "dark" });
  });

  it("Switches dark to light", () => {
    expect(toggleTheme({ ...settings, theme: "dark" })).toEqual(settings);
  });
});

describe("changeFont", () => {
  it("Changes to the given font", () => {
    expect(changeFont(settings, "sans")).toEqual({ ...settings, font: "sans" });
  });

  it("Changes to system font", () => {
    expect(changeFont(settings, "system")).toEqual({
      ...settings,
      font: "system",
    });
  });

  it("Changes to serif font", () => {
    expect(changeFont({ ...settings, font: "sans" }, "serif")).toEqual(
      settings,
    );
  });
});
