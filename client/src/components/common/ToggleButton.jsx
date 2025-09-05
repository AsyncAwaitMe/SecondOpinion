import React from "react";
import { useTheme } from "../../context/ThemeContext";

const ToggleButton = ({ className = "" }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle theme"
      title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      className={"px-3 py-1 rounded-md border transition-colors " + className}
    >
      {theme === "dark" ? "🌙" : "🌞"}
    </button>
  );
};

export default ToggleButton;
