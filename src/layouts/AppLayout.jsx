import React, { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";

const TITLES = {
  "/dashboard": "Dashboard",
  "/medicines": "Medicines",
  "/stock": "Stock Management",
  "/sales": "Sales",
  "/alerts": "Alerts",
  "/reports": "Reports",
  "/profile": "Profile",
  "/users": "User Accounts",
  "/activity-log": "Activity Log",
};

export default function AppLayout() {
  const [navOpen, setNavOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("vi-pharmacy-theme") === "dark";
  });

  const location = useLocation();
  const title = TITLES[location.pathname] || "VI-PHARMACY";

  useEffect(() => {
    localStorage.setItem(
      "vi-pharmacy-theme",
      darkMode ? "dark" : "light"
    );

    document.documentElement.dataset.theme = darkMode ? "dark" : "light";
  }, [darkMode]);

  return (
    <div className={`app-shell${navOpen ? "" : " sidebar-collapsed"}`}>
      <Sidebar
        open={navOpen}
        onNavigate={() => setNavOpen(false)}
      />

      <div className="app-main">
        <TopBar
          title={title}
          onMenuClick={() => setNavOpen((open) => !open)}
          darkMode={darkMode}
          onThemeToggle={() => setDarkMode((dark) => !dark)}
        />

        <div className="app-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}