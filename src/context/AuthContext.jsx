import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

import { authApi } from "../api/auth";
import { ApiError } from "../api/client";

const AuthContext = createContext(null);


export function AuthProvider({ children }) {

  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);


  // =========================================================
  // RESTORE SESSION ON PAGE LOAD
  // =========================================================

  useEffect(() => {

    let cancelled = false;


    async function restoreSession() {

      try {

        const data = await authApi.me();

        if (!cancelled) {
          setUser(data.user);
        }

      } catch {

        if (!cancelled) {
          setUser(null);
        }

      } finally {

        if (!cancelled) {
          setInitializing(false);
        }

      }

    }


    restoreSession();


    return () => {
      cancelled = true;
    };

  }, []);


  // =========================================================
  // LOGIN
  // =========================================================

  const login = useCallback(
    async (username, password) => {

      const data =
        await authApi.login(
          username,
          password
        );

      setUser(data.user);

      return data.user;

    },
    []
  );


  // =========================================================
  // LOGOUT
  // =========================================================

  const logout = useCallback(
    async () => {

      try {

        await authApi.logout();

      } catch {

        // Always clear frontend session state.

      } finally {

        setUser(null);

      }

    },
    []
  );


  // =========================================================
  // ROLE NORMALIZATION
  // =========================================================

  /*
    We normalize the role here once.

    Examples:

    "Super Admin"  -> "super admin"
    "Admin Viewer" -> "admin viewer"
    "viewer"       -> "viewer"
  */

  const normalizedRole =
    (user?.role || "")
      .trim()
      .toLowerCase();


  // =========================================================
  // ROLE CHECKS
  // =========================================================

  const isSuperAdmin =
    normalizedRole === "super admin";


  /*
    Keep support for older role values.

    Your intended database role is:
    "Admin Viewer"

    But this also supports:
    "viewer"
    "admin_viewer"
  */

  const isAdminViewer =
    normalizedRole === "admin viewer" ||
    normalizedRole === "admin_viewer" ||
    normalizedRole === "viewer";


  /*
    IMPORTANT:

    Some of your existing files use isAdmin.

    In this system, "admin actions" means
    Super Admin actions.

    Therefore isAdmin is simply an alias
    for isSuperAdmin.

    This prevents existing files such as
    Stock.jsx and Reports.jsx from breaking.
  */

  const isAdmin =
    isSuperAdmin;


  // =========================================================
  // ADMIN PAGE ACCESS
  // =========================================================

  /*
    Both roles can VIEW:

    - Users
    - Activity Log

    Only Super Admin can perform actions.
  */

  const canViewAdminControls =
    isSuperAdmin ||
    isAdminViewer;


  const canManageAdminControls =
    isSuperAdmin;


  // =========================================================
  // CONTEXT VALUE
  // =========================================================

  const value = {

    user,

    role:
      user
        ? user.role
        : null,


    isAuthenticated:
      Boolean(user),


    // -------------------------------------------------------
    // ROLE FLAGS
    // -------------------------------------------------------

    isAdmin,

    isSuperAdmin,

    isAdminViewer,


    // -------------------------------------------------------
    // PAGE PERMISSIONS
    // -------------------------------------------------------

    canViewAdminControls,

    canManageAdminControls,


    // -------------------------------------------------------
    // AUTH STATE
    // -------------------------------------------------------

    initializing,

    login,

    logout,

  };


  return (

    <AuthContext.Provider
      value={value}
    >

      {children}

    </AuthContext.Provider>

  );

}


export function useAuth() {

  const ctx =
    useContext(AuthContext);


  if (!ctx) {

    throw new Error(
      "useAuth must be used within an AuthProvider"
    );

  }


  return ctx;

}


export { ApiError };