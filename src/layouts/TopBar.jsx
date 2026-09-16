import React from "react";
import {
  Menu,
  MessageCircle,
  Sun,
  Moon,
} from "lucide-react";

import { useChat } from "../context/ChatContext";


export default function TopBar({
  title,
  onMenuClick,
  darkMode,
  onThemeToggle,
}) {

  const {
    totalUnread,
    toggleChat,
    isOpen,
  } = useChat();


  return (
    <header className="topbar">

      {/* ================= MENU ================= */}

      <button
        className="btn btn-ghost btn-sm topbar-menu-btn"
        onClick={onMenuClick}
        aria-label="Toggle navigation"
        title="Toggle navigation"
      >
        <span className="menu-icon" aria-hidden="true">
          ☰
        </span>
      </button>


      {/* ================= TITLE ================= */}

      <div className="topbar-title">
        {title}
      </div>


      <div className="topbar-spacer" />


      {/* ================= CHAT ================= */}

      <button
        className={
          "chat-toggle" +
          (isOpen ? " active" : "")
        }
        onClick={toggleChat}
        aria-label="Open team chat"
        title="Team chat"
      >

        <MessageCircle size={20} />


        {totalUnread > 0 && (
          <span className="chat-notification-badge">

            {totalUnread > 99
              ? "99+"
              : totalUnread}

          </span>
        )}

      </button>


      {/* ================= THEME ================= */}

      <button
        className="theme-toggle"
        onClick={onThemeToggle}
        aria-label={
          darkMode
            ? "Switch to light mode"
            : "Switch to dark mode"
        }
        title={
          darkMode
            ? "Light mode"
            : "Dark mode"
        }
      >

        {darkMode
          ? <Sun size={16} />
          : <Moon size={16} />
        }

        <span className="theme-toggle-text">
          {darkMode
            ? "Light"
            : "Dark"}
        </span>

      </button>

    </header>
  );
}