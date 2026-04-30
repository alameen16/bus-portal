/**
 * components/Navbar.jsx — Top Navigation Bar
 */
import { useAuth } from "../context/AuthContext";

const NAV_LINKS = [
  { label: "Home",   page: "Home" },
  { label: "My Bookings", page: "MyBookings" },
  { label: "Support",     page: "Support" },
];

export default function Navbar({ currentPage, setCurrentPage }) {
  const { user, logout } = useAuth();

  function handleLogout() {
    logout();
    setCurrentPage("Home");
  }

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-stone-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

        <button onClick={() => setCurrentPage("Home")}
          className="font-black text-sm tracking-widest text-green-800 uppercase">
         Bus Portal
        </button>

        <div className="flex gap-8">
          {NAV_LINKS.map((link) => {
            const isActive = currentPage === link.page;
            return (
              <button key={link.label} onClick={() => setCurrentPage(link.page)}
                className={`text-sm font-medium pb-1 border-b-2 transition-colors duration-200 ${isActive ? "text-green-700 border-green-600" : "text-stone-500 border-transparent hover:text-green-700"}`}>
                {link.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              {["superadmin","localAdmin"].includes(user.role) && (
                <button onClick={() => setCurrentPage("AdminStaff")}
                  className="text-sm font-medium text-stone-600 border border-stone-300 rounded-lg px-4 py-2 hover:border-green-600 hover:text-green-700 transition-colors">
                  Admin Portal
                </button>
              )}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-green-700 flex items-center justify-center text-white text-xs font-bold">
                  {user.avatar}
                </div>
                <button onClick={handleLogout}
                  className="text-sm font-semibold text-red-500 hover:text-red-700 transition-colors">
                  Logout
                </button>
              </div>
            </>
          ) : (
            <>
              <button onClick={() => setCurrentPage("AdminStaff")}
                className="text-sm font-medium text-stone-600 border border-stone-300 rounded-lg px-4 py-2 hover:border-green-600 hover:text-green-700 transition-colors">
                Admin Portal
              </button>
              <button onClick={() => setCurrentPage("Login")}
                className="text-sm font-semibold text-white bg-green-700 rounded-lg px-4 py-2 hover:bg-green-800 transition-colors">
                Login
              </button>
            </>
          )}
        </div>

      </div>
    </nav>
  );
}