/**
 * pages/HomePage.jsx — Staff Internal Dashboard
 */

import { useAuth } from "../context/AuthContext";

const QUICK_ACTIONS = [
  {
    label: "View Schedules",
    description: "Browse all available routes and departure times.",
    icon: "/public/map.svg",
    page: "AllRoutes",
    color: "bg-green-50 border-green-200 hover:border-green-500",
    iconBg: "bg-green-100",
  },
  {
    label: "New Booking",
    description: "Reserve your seat on today's staff shuttle.",
    icon: "/public/bus.svg",
    page: "Bookings",
    color: "bg-stone-50 border-stone-200 hover:border-green-500",
    iconBg: "bg-stone-100",
  },
  {
    label: "My Bookings",
    description: "View, edit or cancel your existing bookings.",
    icon: "/public/notepad-text.svg",
    page: "MyBookings",
    color: "bg-stone-50 border-stone-200 hover:border-green-500",
    iconBg: "bg-stone-100",
  },
  {
    label: "Support",
    description: "Access help resources and raise an issue.",
    icon: "/public/customer.svg",
    page: "Support",
    color: "bg-stone-50 border-stone-200 hover:border-green-500",
    iconBg: "bg-stone-100",
  },
];

export default function HomePage({ setCurrentPage }) {
  const { user } = useAuth();

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <main className="max-w-4xl mx-auto px-6 py-12">

      <div className="mb-10">
        <p className="text-green-700 text-xs font-bold uppercase tracking-widest mb-1">
         Staff Portal
        </p>
        <h1 className="text-stone-900 font-black text-3xl mb-1">
          {greeting}, {user?.name?.split(" ")[0] || "Staff"} 👋
        </h1>
        <p className="text-stone-500 text-sm">
          What would you like to do today?
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {QUICK_ACTIONS.map((action) => (
          <button
            key={action.label}
            onClick={() => setCurrentPage(action.page)}
            className={`
              flex items-start gap-4 p-5 rounded-xl border text-left
              transition-all duration-150 group ${action.color}
            `}
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${action.iconBg}`}>
              <img src={action.icon} alt={action.label} className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-stone-800 text-sm mb-0.5 group-hover:text-green-700 transition-colors">
                {action.label}
              </p>
              <p className="text-stone-500 text-xs leading-relaxed">
                {action.description}
              </p>
            </div>
          </button>
        ))}
      </div>

      <div className="border-t border-stone-200 mt-10 pt-6">
        <p className="text-xs text-stone-400 text-center">
         Bus Portal · {new Date().toLocaleDateString("en-NG", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

    </main>
  );
}