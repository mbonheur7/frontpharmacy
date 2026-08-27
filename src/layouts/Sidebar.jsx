import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Pill,
  Package,
  ShoppingCart,
  Bell,
  BarChart3,
  UserCircle,
  Users,
  ClipboardList,
  LogOut,
} from "lucide-react";

import logo from "../assets/logo/vi-pharmacy-logo.jpeg";
import { useAuth } from "../context/AuthContext";


const NAV_ITEMS = [
  {
    to: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    to: "/medicines",
    label: "Medicines",
    icon: Pill,
  },
  {
    to: "/stock",
    label: "Stock",
    icon: Package,
  },
  {
    to: "/sales",
    label: "Sales",
    icon: ShoppingCart,
  },
  {
    to: "/alerts",
    label: "Alerts",
    icon: Bell,
  },
  {
    to: "/reports",
    label: "Reports",
    icon: BarChart3,
  },
  {
    to: "/profile",
    label: "Profile",
    icon: UserCircle,
  },
];


const ADMIN_NAV_ITEMS = [
  {
    to: "/users",
    label: "Users",
    icon: Users,
  },
  {
    to: "/activity-log",
    label: "Activity Log",
    icon: ClipboardList,
  },
];


export default function Sidebar({ open, onNavigate }) {
  const { user, isAdmin, logout } = useAuth();

  const linkClass = ({ isActive }) =>
    "sidebar-link" + (isActive ? " active" : "");


  return (
    <>
      {open && (
        <div
          className="sidebar-scrim"
          onClick={onNavigate}
        />
      )}


      <aside
        className={"sidebar" + (open ? " open" : "")}
      >

        {/* ---------------------------------------------------
            Brand
        --------------------------------------------------- */}

        <div className="sidebar-brand">

          <div className="sidebar-logo">
            <img
              src={logo}
              alt="VI-PHARMACY logo"
            />
          </div>

          <div>
            <div className="sidebar-brand-text">
              VI-PHARMACY
            </div>

            <div className="sidebar-brand-tagline">
              Your Health, Our Priority
            </div>
          </div>

        </div>


        {/* ---------------------------------------------------
            Main navigation
        --------------------------------------------------- */}

        <nav className="sidebar-nav">

          {NAV_ITEMS.map((item) => {

            const Icon = item.icon;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={linkClass}
                onClick={onNavigate}
              >

                <Icon
                  className="sidebar-icon"
                  size={18}
                  strokeWidth={1.9}
                  aria-hidden="true"
                />

                <span>
                  {item.label}
                </span>

              </NavLink>
            );

          })}


          {/* -------------------------------------------------
              Admin navigation
          ------------------------------------------------- */}

          {isAdmin && (
            <>
              <div className="sidebar-section-label">
                Administration
              </div>

              {ADMIN_NAV_ITEMS.map((item) => {

                const Icon = item.icon;

                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={linkClass}
                    onClick={onNavigate}
                  >

                    <Icon
                      className="sidebar-icon"
                      size={18}
                      strokeWidth={1.9}
                      aria-hidden="true"
                    />

                    <span>
                      {item.label}
                    </span>

                  </NavLink>
                );

              })}
            </>
          )}

        </nav>


        {/* ---------------------------------------------------
            User / logout
        --------------------------------------------------- */}

        <div className="sidebar-footer">

          <div className="sidebar-user">

            <div className="sidebar-user-icon">
              <UserCircle
                size={18}
                strokeWidth={1.8}
              />
            </div>

            <div className="sidebar-user-details">

              <strong>
                {user?.fullname}
              </strong>

              <span>
                {user?.role}
              </span>

            </div>

          </div>


          <button
            className="sidebar-logout"
            onClick={logout}
            type="button"
          >

            <LogOut
              size={17}
              strokeWidth={1.9}
              aria-hidden="true"
            />

            <span>
              Log out
            </span>

          </button>

        </div>

      </aside>
    </>
  );
}