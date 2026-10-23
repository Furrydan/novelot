import { expect, describe, it, vi, afterEach } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import ReaderSettings from "./ReaderSettings";
import userEvent from "@testing-library/user-event";
import type { ReaderSettings as Settings } from "@novelot-types/readerSettingsLogic";

const defaultSettings: Settings = {
  theme: "light",
  font: "sans",
  fontSize: 20,
};

const onSettingsChange = vi.fn<(settings: Settings) => void>();

const renderReaderSettings = (settings: Partial<Settings> = {}) => {
  render(
    <ReaderSettings
      settings={{ ...defaultSettings, ...settings }}
      onSettingsChange={onSettingsChange}
    />,
  );
};

describe("ReaderSettings", () => {
  afterEach(() => {
    vi.resetAllMocks();
    cleanup();
  });

  it("Theme is displayed in light mode", async () => {
    renderReaderSettings({ theme: "light" });

    const darkThemeButton = screen.getByRole("button", {
      name: "Switch to dark theme",
    });
    await userEvent.click(darkThemeButton);
    expect(onSettingsChange).toHaveBeenCalledExactlyOnceWith({
      ...defaultSettings,
      theme: "dark",
    });
  });

  it("Theme is displayed in dark mode", async () => {
    renderReaderSettings({ theme: "dark" });

    const lightThemeButton = screen.getByRole("button", {
      name: "Switch to light theme",
    });
    await userEvent.click(lightThemeButton);
    expect(onSettingsChange).toHaveBeenCalledExactlyOnceWith(defaultSettings);
  });

  it("Shows the current font as selected", () => {
    renderReaderSettings({ font: "serif" });

    expect(screen.getByRole("combobox")).toHaveValue("serif");
  });

  it("Changes font to the selected option", async () => {
    renderReaderSettings({ font: "sans" });

    await userEvent.selectOptions(screen.getByRole("combobox"), "serif");
    expect(onSettingsChange).toHaveBeenCalledExactlyOnceWith({
      ...defaultSettings,
      font: "serif",
    });
  });

  it("Decreases font size by 2", async () => {
    renderReaderSettings({ fontSize: 16 });

    expect(screen.getByText("16")).toBeInTheDocument();
    const decreaseButton = screen.getByRole("button", { name: "A−" });
    await userEvent.click(decreaseButton);
    expect(onSettingsChange).toHaveBeenCalledExactlyOnceWith({
      ...defaultSettings,
      fontSize: 14,
    });
  });

  it("Increases font size by 2", async () => {
    renderReaderSettings();

    const increaseButton = screen.getByRole("button", { name: "A+" });
    await userEvent.click(increaseButton);
    expect(onSettingsChange).toHaveBeenCalledExactlyOnceWith({
      ...defaultSettings,
      fontSize: 22,
    });
  });

  it("Disables decrease at minimum font size", () => {
    renderReaderSettings({ fontSize: 14 });

    expect(screen.getByRole("button", { name: "A−" })).toBeDisabled();
  });

  it("Disables increase at maximum font size", () => {
    renderReaderSettings({ fontSize: 28 });

    expect(screen.getByRole("button", { name: "A+" })).toBeDisabled();
  });
});
