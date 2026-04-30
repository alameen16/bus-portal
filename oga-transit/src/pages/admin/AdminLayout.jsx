/**
 * pages/admin/AdminLayout.jsx — Admin Shell
 *
 * The sidebar + topbar that wraps ALL admin pages.
 * Each admin page is rendered inside the <main> area.
 *
 * Props:
 *   - currentPage: active page name (to highlight sidebar link)
 *   - setCurrentPage: navigate between admin pages
 *   - children: the page content rendered inside
 */

import { useState } from "react";
import { useAuth } from "../../context/AuthContext";

// All sidebar navigation links with role restrictions
const SIDEBAR_LINKS = [
  { page: "AdminStaff",    label: "Staff Management", icon: "/user-round.svg",  roles: ["superadmin"] },
  { page: "AdminRoutes",   label: "Routes",           icon: "/map.svg",      roles: ["superadmin", "localAdmin"] },
  { page: "AdminBuses",    label: "Fleet / Buses",    icon: "/bus.svg",         roles: ["superadmin", "localAdmin"] },
  { page: "AdminDrivers",  label: "Drivers",          icon: "/steering.png",      roles: ["superadmin", "localAdmin"] },
  { page: "AdminBookings", label: "Bookings",         icon: "/notepad-text.svg",     roles: ["superadmin", "localAdmin"] },
];

export default function AdminLayout({ currentPage, setCurrentPage, children }) {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  function handleLogout() {
    logout();
    setCurrentPage("Home");
  }

  // Filter links based on user's role
  const visibleLinks = SIDEBAR_LINKS.filter(link =>
    link.roles.includes(user?.role)
  );

  return (
    <div className="flex min-h-screen bg-stone-100">

      {/* ════ SIDEBAR ════ */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-60 bg-green-950 flex flex-col
        transform transition-transform duration-300
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        lg:relative lg:translate-x-0
      `}>

        {/* Logo */}
        <div className="px-5 py-5 border-b border-green-800">
          <h1 className="text-white font-black text-sm tracking-widest">ADMIN PORTAL</h1>
        </div>

        {/* User info */}
        <div className="px-5 py-4 border-b border-green-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-green-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {user?.avatar || "?"}
            </div>
            <div className="overflow-hidden">
              <p className="text-white font-semibold text-sm truncate">{user?.name}</p>
              <p className="text-green-400 text-xs capitalize">{user?.role}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {visibleLinks.map(link => {
            const isActive = currentPage === link.page;
            return (
              <button
                key={link.page}
                onClick={() => { setCurrentPage(link.page); setSidebarOpen(false); }}
                className={`
                  w-full flex items-center gap-3 px-5 py-3 text-sm font-medium
                  border-l-2 transition-all duration-150 text-left
                  ${isActive
                    ? "text-white bg-green-800/50 border-l-green-400"
                    : "text-green-300 border-l-transparent hover:text-white hover:bg-green-800/30"
                  }
                `}
              >
                <img src={link.icon} alt={link.label} className="w-5 h-5 invert" />
                <span>{link.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="px-5 py-4 border-t border-green-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 text-sm text-green-300 hover:text-red-400 transition-colors"
          >
            <img src="/log-out.svg" alt="Logout" className="w-5 h-5 invert" />
            <span>Logout</span>
          </button> 
        </div>

      </aside>

      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ════ MAIN AREA ════ */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top bar */}
        <header className="bg-white border-b border-stone-200 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
          {/* Mobile menu toggle */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden text-stone-600 text-xl mr-4"
          >
            ☰
          </button>

          {/* Page title */}
          <h2 className="font-bold text-stone-800 text-base">
            {SIDEBAR_LINKS.find(l => l.page === currentPage)?.label || "Admin"}
          </h2>

          {/* Right side: view site + user */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setCurrentPage("Home")}
              className="text-sm text-green-700 font-semibold hover:underline hidden sm:block"
            >
              ← View Site
            </button>
            <div className="w-8 h-8 rounded-full bg-green-700 flex items-center justify-center text-white text-xs font-bold">
              {user?.avatar}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>

      </div>
    </div>
  );
}