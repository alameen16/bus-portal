/**
 * App.jsx — Root Component
 *
 * Manages routing for all user types.
 * Also manages `selectedRoute` state so when a user
 * clicks a route card, that route is passed to BookingsPage.
 */

import { useState } from "react";
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

export default function App() {
  const { user, loading } = useAuth();
  const [currentPage,   setCurrentPage]   = useState("Home");
  const [selectedRoute, setSelectedRoute] = useState(null);

  function goToBookings(route = null) {
    setSelectedRoute(route);
    setCurrentPage("Bookings");
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50">
      <div className="text-4xl animate-bounce">🚌</div>
    </div>
  );

  // ── Driver portal ──
  if (currentPage === "DriverDashboard" ||
     (user?.role === "driver" && currentPage !== "Login")) {
    return <DriverDashboard setCurrentPage={setCurrentPage} />;
  }

  // ── Admin pages (protected) ──
  if (ADMIN_PAGES.includes(currentPage)) {
    if (!user || !["superadmin","localAdmin"].includes(user.role)) {
      return <LoginPage setCurrentPage={setCurrentPage} />;
    }
    return (
      <AdminLayout currentPage={currentPage} setCurrentPage={setCurrentPage}>
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
    return <LoginPage setCurrentPage={setCurrentPage} />;
  }

  // ── Public / Staff pages ──
  return (
    <div className="min-h-screen bg-stone-50 font-sans">
      <Navbar currentPage={currentPage} setCurrentPage={setCurrentPage} />

      {currentPage === "Home" && (
        <HomePage setCurrentPage={setCurrentPage} goToBookings={goToBookings} />
      )}

      {currentPage === "Bookings" && (
        <BookingsPage
          route={selectedRoute}
          setCurrentPage={setCurrentPage}
          goToBookings={goToBookings}
        />
      )}

      {currentPage === "MyBookings" && (
        <MyBookingsPage setCurrentPage={setCurrentPage} />
      )}

      {currentPage === "Support" && <SupportPage />}

      {currentPage === "AllRoutes" && (
        <AllRoutesPage
          setCurrentPage={setCurrentPage}
          goToBookings={goToBookings}
        />
      )}
    </div>
  );
}