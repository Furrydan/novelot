export type Theme = "light" | "dark";

export type Font = "serif" | "sans" | "system";

export const FONT_SIZE_RANGE = { min: 14, max: 28, step: 2 } as const;

export const FONTS:{ value: Font; label: string }[] = [
  { value: "sans", label: "Sans" },
  { value: "serif", label: "Serif" },
  { value: "system", label: "System" },
];

export const changeFontSize = (
  settings: ReaderSettings,
  delta: number,
): ReaderSettings => ({
  ...settings,
  fontSize: Math.min(
    FONT_SIZE_RANGE.max,
    Math.max(FONT_SIZE_RANGE.min, settings.fontSize + delta),
  ),
});

export const toggleTheme = (settings: ReaderSettings): ReaderSettings => ({
  ...settings,
  theme: settings.theme === "light" ? "dark" : "light",
});

export const changeFont = (
  settings: ReaderSettings,
  font: Font,
): ReaderSettings => ({ ...settings, font });

export type ReaderSettings = {
  theme: Theme;
  font: Font;
  fontSize: number;
};
