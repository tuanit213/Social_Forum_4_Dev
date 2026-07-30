export const themes = [
  {
    id: "vscode-dark",
    name: "VS Code Dark",
    colors: {
      primary: "#1e1e1e",
      secondary: "#252526",
      elevated: "#2d2d30",
      border: "#3c3c3c",
      text: "#d4d4d4",
      accent: "#007acc",
    },
  },
  {
    id: "github-dark",
    name: "GitHub Dark",
    colors: {
      primary: "#0d1117",
      secondary: "#161b22",
      elevated: "#21262d",
      border: "#30363d",
      text: "#c9d1d9",
      accent: "#58a6ff",
    },
  },
  {
    id: "monokai",
    name: "Monokai",
    colors: {
      primary: "#272822",
      secondary: "#2d2e27",
      elevated: "#3e3d32",
      border: "#49483e",
      text: "#f8f8f2",
      accent: "#66d9ef",
    },
  },
  {
    id: "dracula",
    name: "Dracula",
    colors: {
      primary: "#282a36",
      secondary: "#21222c",
      elevated: "#44475a",
      border: "#44475a",
      text: "#f8f8f2",
      accent: "#bd93f9",
    },
  },
  {
    id: "light-studio",
    name: "Light Studio",
    colors: {
      primary: "#ffffff",
      secondary: "#f3f3f3",
      elevated: "#e8e8e8",
      border: "#d4d4d4",
      text: "#1e1e1e",
      accent: "#0066b8",
    },
  },
];

export const THEME_STORAGE_KEY = "socialforum.theme";
export const EDITOR_FONT_STORAGE_KEY = "socialforum.editorFont";
export const DEFAULT_THEME = "vscode-dark";
export const DEFAULT_EDITOR_FONT = "Consolas";
