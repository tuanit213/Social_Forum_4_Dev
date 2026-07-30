import { useEffect, useMemo, useState } from "react";
import { ThemeContext } from "@/contexts/themeStore";
import {
  DEFAULT_EDITOR_FONT,
  DEFAULT_THEME,
  EDITOR_FONT_STORAGE_KEY,
  THEME_STORAGE_KEY,
  themes,
} from "@/contexts/themeOptions";

const getStoredTheme = () => {
  if (typeof window === "undefined") return DEFAULT_THEME;
  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  return themes.some((theme) => theme.id === storedTheme) ? storedTheme : DEFAULT_THEME;
};

const getStoredEditorFont = () => {
  if (typeof window === "undefined") return DEFAULT_EDITOR_FONT;
  return window.localStorage.getItem(EDITOR_FONT_STORAGE_KEY) || DEFAULT_EDITOR_FONT;
};

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(getStoredTheme);
  const [editorFont, setEditorFontState] = useState(getStoredEditorFont);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    const normalizedFont = editorFont.trim() || DEFAULT_EDITOR_FONT;
    document.documentElement.style.setProperty("--editor-font", `"${normalizedFont}", "Consolas", monospace`);
    window.localStorage.setItem(EDITOR_FONT_STORAGE_KEY, normalizedFont);
  }, [editorFont]);

  const value = useMemo(
    () => ({
      theme,
      themes,
      editorFont,
      setTheme: setThemeState,
      setEditorFont: setEditorFontState,
    }),
    [editorFont, theme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
