/**
 * components/Navbar.jsx — Top Navigation Bar (Responsive)
 */
import { useState } from "react";
import { useAuth } from "../context/AuthContext";

const NAV_LINKS = [
  { label: "Home",        page: "Home" },
  { label: "My Bookings", page: "MyBookings" },
  { label: "Support",     page: "Support" },
];

export default function Navbar({ currentPage, setCurrentPage }) {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  function handleLogout() {
    logout();
    setCurrentPage("Home");
    setMenuOpen(false);
  }

  function handleNav(page) {
    setCurrentPage(page);
    setMenuOpen(false);
  }

  const isAdmin = user && ["superadmin", "localAdmin"].includes(user.role);

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-stone-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

        {/* Logo */}
        <button
          onClick={() => handleNav("Home")}
          className="font-black text-sm tracking-widest text-green-800 uppercase"
        >
          Bus Portal
        </button>

        {/* Desktop nav links */}
        <div className="hidden md:flex gap-8">
          {NAV_LINKS.map((link) => {
            const isActive = currentPage === link.page;
            return (
              <button
                key={link.label}
                onClick={() => handleNav(link.page)}
                className={`text-sm font-medium pb-1 border-b-2 transition-colors duration-200 ${
                  isActive
                    ? "text-green-700 border-green-600"
                    : "text-stone-500 border-transparent hover:text-green-700"
                }`}
              >
                {link.label}
              </button>
            );
          })}
        </div>

        {/* Desktop right side */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              {isAdmin && (
                <button
                  onClick={() => handleNav("AdminStaff")}
                  className="text-sm font-medium text-stone-600 border border-stone-300 rounded-lg px-4 py-2 hover:border-green-600 hover:text-green-700 transition-colors"
                >
                  Admin Portal
                </button>
              )}
              <div className="flex items-center gap-2">
                {/* Avatar — clicks to Profile page */}
                <button
                  onClick={() => handleNav("Profile")}
                  title="My Profile"
                  className="w-8 h-8 rounded-full bg-green-700 flex items-center justify-center text-white text-xs font-bold hover:bg-green-800 transition-colors"
                >
                  {user.avatar}
                </button>
                <button
                  onClick={handleLogout}
                  className="text-sm font-semibold text-red-500 hover:text-red-700 transition-colors"
                >
                  Logout
                </button>
              </div>
            </>
          ) : (
            <>
              <button
                onClick={() => handleNav("AdminStaff")}
                className="text-sm font-medium text-stone-600 border border-stone-300 rounded-lg px-4 py-2 hover:border-green-600 hover:text-green-700 transition-colors"
              >
                Admin Portal
              </button>
              <button
                onClick={() => handleNav("Login")}
                className="text-sm font-semibold text-white bg-green-700 rounded-lg px-4 py-2 hover:bg-green-800 transition-colors"
              >
                Login
              </button>
            </>
          )}
        </div>

        {/* Mobile right side — avatar/login + hamburger */}
        <div className="flex md:hidden items-center gap-3">
          {user ? (
            <button
              onClick={() => handleNav("Profile")}
              title="My Profile"
              className="w-8 h-8 rounded-full bg-green-700 flex items-center justify-center text-white text-xs font-bold hover:bg-green-800 transition-colors"
            >
              {user.avatar}
            </button>
          ) : (
            <button
              onClick={() => handleNav("Login")}
              className="text-sm font-semibold text-white bg-green-700 rounded-lg px-3 py-1.5 hover:bg-green-800 transition-colors"
            >
              Login
            </button>
          )}

          {/* Hamburger button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 rounded-lg text-stone-600 hover:bg-stone-100 transition-colors"
            aria-label="Toggle menu"
          >
            {menuOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

      </div>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-stone-100 px-6 py-4 flex flex-col gap-1 shadow-md">
          {NAV_LINKS.map((link) => {
            const isActive = currentPage === link.page;
            return (
              <button
                key={link.label}
                onClick={() => handleNav(link.page)}
                className={`text-left text-sm font-medium py-3 px-3 rounded-lg transition-colors ${
                  isActive
                    ? "text-green-700 bg-green-50 font-semibold"
                    : "text-stone-600 hover:bg-stone-50 hover:text-green-700"
                }`}
              >
                {link.label}
              </button>
            );
          })}

          {/* Profile link in mobile menu */}
          {user && (
            <button
              onClick={() => handleNav("Profile")}
              className="text-left text-sm font-medium py-3 px-3 rounded-lg text-stone-600 hover:bg-stone-50 hover:text-green-700 transition-colors"
            >
              My Profile
            </button>
          )}

          {/* Admin portal link in mobile menu */}
          {(isAdmin || !user) && (
            <button
              onClick={() => handleNav("AdminStaff")}
              className="text-left text-sm font-medium py-3 px-3 rounded-lg text-stone-600 hover:bg-stone-50 hover:text-green-700 transition-colors"
            >
              Admin Portal
            </button>
          )}

          {/* Logout in mobile menu */}
          {user && (
            <button
              onClick={handleLogout}
              className="text-left text-sm font-semibold py-3 px-3 rounded-lg text-red-500 hover:bg-red-50 transition-colors mt-1 border-t border-stone-100 pt-4"
            >
              Logout
            </button>
          )}
        </div>
      )}
    </nav>
  );
}