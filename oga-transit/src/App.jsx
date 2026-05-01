/**
 * App.jsx — Root Component
 *
 * Manages routing for all user types.
 * Also manages `selectedRoute` state so when a user
 * clicks a route card, that route is passed to BookingsPage.
 *
 * Features:
 *  - Hash-based routing so hard refresh restores current page
 *  - Booking page guard: redirects to Login if not authenticated
 */

import { useState, useEffect } from "react";
import { useAuth } from "./context/AuthContext";

// Public pages
import Navbar          from "./components/Navbar";
import HomePage        from "./pages/HomePage";
import BookingsPage    from "./pages/BookingsPage";
import MyBookingsPage  from "./pages/MyBookingsPage";
import SupportPage     from "./pages/SupportPage";
import AllRoutesPage   from "./pages/AllRoutesPage";
import LoginPage       from "./pages/LoginPage";

// Admin shell + pages
import AdminLayout        from "./pages/admin/AdminLayout";
import RoutesPage         from "./pages/admin/RoutesPage";
import {
  BusesPage,
  DriversPage,
  AdminBookingsPage,
  StaffPage,
} from "./pages/admin/AdminPages";

// Driver portal
import DriverDashboard from "./pages/driver/DriverDashboard";

const ADMIN_PAGES = [
  "AdminRoutes","AdminBuses",
  "AdminDrivers","AdminBookings","AdminStaff",
];

// Pages that require login
const PROTECTED_PAGES = ["Bookings", "MyBookings"];

// Read initial page from URL hash, fallback to Home
function getInitialPage() {
  const hash = window.location.hash.replace("#/", "");
  const valid = [
    "Home","Bookings","MyBookings","Support",
    "AllRoutes","Login","AdminRoutes","AdminBuses",
    "AdminDrivers","AdminBookings","AdminStaff","DriverDashboard",
  ];
  return valid.includes(hash) ? hash : "Home";
}

export default function App() {
  const { user, loading } = useAuth();
  const [currentPage,   setCurrentPage]   = useState(getInitialPage);
  const [selectedRoute, setSelectedRoute] = useState(null);

  // Sync page to URL hash so hard refresh restores position
  useEffect(() => {
    window.location.hash = `/${currentPage}`;
  }, [currentPage]);

  function goToBookings(route = null) {
    setSelectedRoute(route);
    setCurrentPage("Bookings");
  }

  // Wrapped setCurrentPage that guards protected pages
  function navigate(page) {
    if (PROTECTED_PAGES.includes(page) && !user) {
      setCurrentPage("Login");
      return;
    }
    setCurrentPage(page);
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50">
      <div className="text-4xl animate-bounce">🚌</div>
    </div>
  );

  // ── Driver portal ──
  if (currentPage === "DriverDashboard" ||
     (user?.role === "driver" && currentPage !== "Login")) {
    return <DriverDashboard setCurrentPage={navigate} />;
  }

  // ── Admin pages (protected) ──
  if (ADMIN_PAGES.includes(currentPage)) {
    if (!user || !["superadmin","localAdmin"].includes(user.role)) {
      return <LoginPage setCurrentPage={navigate} />;
    }
    return (
      <AdminLayout currentPage={currentPage} setCurrentPage={navigate}>
        {currentPage === "AdminRoutes"    && <RoutesPage />}
        {currentPage === "AdminBuses"     && <BusesPage />}
        {currentPage === "AdminDrivers"   && <DriversPage />}
        {currentPage === "AdminBookings"  && <AdminBookingsPage />}
        {currentPage === "AdminStaff"     && <StaffPage />}
      </AdminLayout>
    );
  }

  // ── Login page ──
  if (currentPage === "Login") {
    return <LoginPage setCurrentPage={navigate} />;
  }

  // ── Guard: if somehow on a protected page without user, redirect ──
  if (PROTECTED_PAGES.includes(currentPage) && !user) {
    return <LoginPage setCurrentPage={navigate} />;
  }

  // ── Public / Staff pages ──
  return (
    <div className="min-h-screen bg-stone-50 font-sans">
      <Navbar currentPage={currentPage} setCurrentPage={navigate} />

      {currentPage === "Home" && (
        <HomePage setCurrentPage={navigate} goToBookings={goToBookings} />
      )}

      {currentPage === "Bookings" && (
        <BookingsPage
          route={selectedRoute}
          setCurrentPage={navigate}
          goToBookings={goToBookings}
        />
      )}

      {currentPage === "MyBookings" && (
        <MyBookingsPage setCurrentPage={navigate} />
      )}

      {currentPage === "Support" && <SupportPage />}

      {currentPage === "AllRoutes" && (
        <AllRoutesPage
          setCurrentPage={navigate}
          goToBookings={goToBookings}
        />
      )}
    </div>
  );
}