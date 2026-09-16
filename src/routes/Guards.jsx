import React from "react";

import {
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";

import {
  useAuth,
} from "../context/AuthContext";


// =========================================================
// PROTECTED ROUTE
// =========================================================

export function ProtectedRoute() {

  const {
    isAuthenticated,
    initializing,
  } = useAuth();


  const location =
    useLocation();


  /*
    Wait while we check whether the user's
    existing session is still valid.
  */

  if (initializing) {

    return (
      <div className="center-page">

        Loading...

      </div>
    );

  }


  /*
    Not logged in.
  */

  if (!isAuthenticated) {

    return (

      <Navigate
        to="/login"
        replace
        state={{
          from: location,
        }}
      />

    );

  }


  return <Outlet />;

}


// =========================================================
// ADMIN VIEW ROUTE
// =========================================================

export function AdminRoute() {

  const {
    initializing,
    canViewAdminControls,
  } = useAuth();


  /*
    Wait until authentication is restored.
  */

  if (initializing) {

    return (
      <div className="center-page">

        Loading...

      </div>
    );

  }


  /*
    Only:

    - Super Admin
    - Admin Viewer

    can access these pages.
  */

  if (!canViewAdminControls) {

    return (

      <Navigate
        to="/forbidden"
        replace
      />

    );

  }


  return <Outlet />;

}