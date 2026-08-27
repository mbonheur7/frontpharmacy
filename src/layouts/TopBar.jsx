import React from "react";

export default function TopBar({
  title,
  onMenuClick,
  darkMode,
  onThemeToggle,
}) {
  return (
    <header className="topbar">
      <button
        className="btn btn-ghost btn-sm topbar-menu-btn"
        onClick={onMenuClick}
        aria-label={navOpenLabel(darkMode)}
        title="Toggle navigation"
      >
        <span className="menu-icon" aria-hidden="true">
          ☰
        </span>
      </button>

      <div className="topbar-title">{title}</div>

      <div className="topbar-spacer" />

      <button
        className="theme-toggle"
        onClick={onThemeToggle}
        aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
        title={darkMode ? "Light mode" : "Dark mode"}
      >
        <span aria-hidden="true">{darkMode ? "☀" : "☾"}</span>
        <span className="theme-toggle-text">
          {darkMode ? "Light" : "Dark"}
        </span>
      </button>
    </header>
  );
}

function navOpenLabel(darkMode) {
  return darkMode ? "Toggle navigation" : "Toggle navigation";
}