/**
 * context/AuthContext.jsx — Global Authentication State
 *
 * This provides the logged-in user's info to EVERY component in the app
 * without having to pass it down as props manually.
 *
 * Wrap your entire app in <AuthProvider> (done in main.jsx).
 * Then use the useAuth() hook anywhere to get the current user.
 *
 * Usage in any component:
 *   import { useAuth } from "../context/AuthContext";
 *   const { user, login, logout } = useAuth();
 */

import { createContext, useContext, useState, useEffect } from "react";
import api from "../utils/api";

// Create the context object
const AuthContext = createContext(null);

/**
 * AuthProvider — wraps the whole app
 * Manages: user, token, login, logout
 */
export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);   // logged-in user object
  const [loading, setLoading] = useState(true);   // true while checking stored token

  // On app load, check if there's a saved token and restore the session
  useEffect(() => {
    const token = localStorage.getItem("oga_token");
    if (token) {
      // Verify the token is still valid by fetching /api/auth/me
      api.get("/auth/me")
        .then(userData => setUser(userData))
        .catch(() => {
          // Token is invalid or expired — clear it
          localStorage.removeItem("oga_token");
          localStorage.removeItem("oga_user");
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  /**
   * login(email, password)
   * Calls the backend, saves the token, sets the user.
   * Returns the user object so the caller knows where to redirect.
   */
  async function login(email, password) {
    const response = await api.post("/auth/login", { email, password });

    // Save token to localStorage so it persists across page refreshes
    localStorage.setItem("oga_token", response.token);
    localStorage.setItem("oga_user", JSON.stringify(response.user));

    setUser(response.user);
    return response.user; // caller uses this to decide redirect
  }

  /**
   * logout()
   * Clears local state and storage.
   */
  function logout() {
    localStorage.removeItem("oga_token");
    localStorage.removeItem("oga_user");
    setUser(null);
  }

  // Helper booleans for easy role checks in components
  const isAdmin  = user && ["superadmin", "localAdmin"].includes(user.role);
  const isDriver = user?.role === "driver";
  const isStaff  = user?.role === "staff";   // staff = public site only
  const isSuperAdmin    = user?.role === "superadmin";
  const isLocalAdmin    = user?.role === "localAdmin";

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      logout,
      isAdmin,
      isDriver,
      isStaff,
      isSuperAdmin,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * useAuth() — hook to access auth state
 * Call this in any component that needs the current user.
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return context;
}