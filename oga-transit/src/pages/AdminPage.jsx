/**
 * pages/AdminPage.jsx — Operations Dashboard (Admin)
 * 
 * This is the internal admin panel for Oga Transit staff.
 * It contains:
 *   - A sidebar navigation
 *   - Stats overview (revenue + active bookings)
 *   - A "Create New Route" form
 *   - A live fleet operations table
 * 
 * State managed here:
 *   - activeSection: which sidebar link is selected
 *   - selectedFleet: which buses are toggled on in the route form
 */

import { useState } from "react";
import { FLEET } from "../data";
import Card from "../components/Card";
import Button from "../components/Button";
import StatusBadge from "../components/StatusBadge";
import CapacityBar from "../components/CapacityBar";

// Sidebar navigation items
const SIDEBAR_LINKS = [
  { label: "Routes",           icon: "🗺" },
  { label: "Fleet Management", icon: "🚌" },
  { label: "Bookings",         icon: "📋" },
];

export default function AdminPage() {
  const [activeSection, setActiveSection] = useState("Dashboard");

  return (
    // flex = sidebar + main content side by side
    <div className="flex min-h-screen">

      {/* ════ SIDEBAR ════ */}
      <Sidebar activeSection={activeSection} setActiveSection={setActiveSection} />

      {/* ════ MAIN CONTENT ════ */}
      <main className="flex-1 bg-stone-50 p-8 overflow-auto">
        <DashboardHeader />
        <CreateRouteForm />
        <FleetTable />
      </main>

    </div>
  );
}


/* ─────────────────────────────────────────────
   SIDEBAR
───────────────────────────────────────────── */
function Sidebar({ activeSection, setActiveSection }) {
  return (
    <aside className="w-56 bg-white border-r border-stone-200 py-6 flex-shrink-0">

      {/* Admin user info */}
      <div className="px-5 pb-5 border-b border-stone-100 mb-4">
        {/* Avatar circle */}
        <div className="w-10 h-10 rounded-full bg-green-700 flex items-center justify-center text-white font-bold text-sm mb-2">
          AC
        </div>
        <p className="font-bold text-stone-800 text-sm">Admin Console</p>
        <p className="text-stone-400 text-xs">System Controller</p>
      </div>

      {/* Navigation links */}
      <nav>
        {SIDEBAR_LINKS.map((link) => {
          const isActive = activeSection === link.label;

          return (
            <button
              key={link.label}
              onClick={() => setActiveSection(link.label)}
              className={`
                w-full flex items-center gap-3 px-5 py-2.5 text-sm font-medium
                border-l-2 transition-all duration-150 text-left
                ${isActive
                  ? "text-green-700 bg-green-50/60 border-l-green-600"
                  : "text-stone-500 border-l-transparent hover:text-green-700 hover:bg-stone-50"
                }
              `}
            >
              <span>{link.icon}</span>
              <span>{link.label}</span>
            </button>
          );
        })}
      </nav>

    </aside>
  );
}


/* ─────────────────────────────────────────────
   DASHBOARD HEADER
   Shows title + key stats
───────────────────────────────────────────── */
function DashboardHeader() {
  return (
    <div className="flex items-start justify-between mb-8">

      {/* Title */}
      <div>
        <h1 className="font-black text-stone-900 text-3xl">Operations Hub</h1>
        <p className="text-stone-500 text-sm mt-1">Managing 24 active transit corridors</p>
      </div>

      {/* Stats */}
      <div className="flex gap-8">
        <StatBox label="Global Revenue"  value="₦14,285,000" />
        <StatBox label="Active Bookings" value="1,204" highlight />
      </div>

    </div>
  );
}

// One stat display box
function StatBox({ label, value, highlight = false }) {
  return (
    <div className="text-right">
      <p className="text-xs text-stone-500 uppercase tracking-widest font-bold mb-0.5">{label}</p>
      <p className={`font-black text-2xl ${highlight ? "text-green-700" : "text-stone-900"}`}>
        {value}
      </p>
    </div>
  );
}


/* ─────────────────────────────────────────────
   CREATE ROUTE FORM
───────────────────────────────────────────── */
function CreateRouteForm() {
  // Track which fleet buses are toggled on
  const [selectedFleet, setSelectedFleet] = useState(["OGA-4421"]);
  const [from, setFrom] = useState("");
  const [to,   setTo]   = useState("");

  // Toggle a bus in/out of the selectedFleet array
  function toggleFleet(bus) {
    setSelectedFleet((prev) =>
      prev.includes(bus) ? prev.filter((b) => b !== bus) : [...prev, bus]
    );
  }

  return (
    <Card className="p-6 mb-6">
      <h3 className="text-green-700 font-bold text-sm uppercase tracking-widest mb-4">
        + Create New Route
      </h3>

      {/* Fleet bus toggles */}
      <div className="mb-4">
        <p className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-2">
          Assign Fleet Bus
        </p>
        <div className="flex gap-2 flex-wrap">
          {["OGA-4421", "OGA-1140"].map((bus) => {
            const isOn = selectedFleet.includes(bus);
            return (
              <button
                key={bus}
                onClick={() => toggleFleet(bus)}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-semibold transition-all
                  ${isOn
                    ? "border-green-600 bg-green-50 text-green-700"
                    : "border-stone-300 text-stone-600 hover:border-green-400"
                  }
                `}
              >
                {/* Checkmark only shown when selected */}
                {isOn && (
                  <span className="w-4 h-4 bg-green-600 rounded text-white text-xs flex items-center justify-center">
                    ✓
                  </span>
                )}
                {bus}
              </button>
            );
          })}
        </div>
      </div>

      {/* From / To inputs */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">
            Starting Point
          </label>
          <input
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            placeholder="e.g. Lagos Terminal"
            className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm bg-stone-50 focus:outline-none focus:border-green-500 transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">
            Destination
          </label>
          <input
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="e.g. Abuja Terminal"
            className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm bg-stone-50 focus:outline-none focus:border-green-500 transition-colors"
          />
        </div>
      </div>

      {/* Submit button */}
      <Button variant="dark" fullWidth>
        Initialize Route Structure
      </Button>

    </Card>
  );
}


/* ─────────────────────────────────────────────
   FLEET TABLE
   Shows all active buses with status
───────────────────────────────────────────── */
function FleetTable() {
  return (
    <Card title="Live Fleet Operations">

      {/* Action buttons (top right of card) */}
      <div className="flex justify-end gap-2 px-5 py-3 border-b border-stone-100">
        <button className="text-xs font-semibold text-stone-600 border border-stone-200 rounded-lg px-3 py-1.5 hover:border-green-500 hover:text-green-700 transition-colors">
          Export CSV
        </button>
        <button className="text-xs font-semibold text-stone-600 border border-stone-200 rounded-lg px-3 py-1.5 hover:border-green-500 hover:text-green-700 transition-colors">
          Filter
        </button>
      </div>

      {/* Table — overflow-x-auto allows horizontal scrolling on small screens */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">

          {/* Table header row */}
          <thead>
            <tr className="bg-stone-50 border-b border-stone-100">
              {["Route ID", "Corridor", "Next Departure", "Bus Assigned", "Load Factor", "Status", "Action"].map((col) => (
                <th key={col} className="text-left px-5 py-3 text-xs font-bold text-stone-500 uppercase tracking-widest">
                  {col}
                </th>
              ))}
            </tr>
          </thead>

          {/* Table body rows */}
          <tbody>
            {FLEET.map((route) => (
              <tr key={route.id} className="border-b border-stone-100 last:border-b-0 hover:bg-stone-50 transition-colors">

                {/* Route ID */}
                <td className="px-5 py-4 font-black text-stone-900">{route.id}</td>

                {/* Corridor (e.g. Lagos → Abuja) */}
                <td className="px-5 py-4 text-stone-700">{route.corridor}</td>

                {/* Departure time */}
                <td className="px-5 py-4 text-stone-600">{route.departure}</td>

                {/* Bus assigned */}
                <td className="px-5 py-4 text-stone-400 text-xs font-mono">{route.bus}</td>

                {/* Capacity bar */}
                <td className="px-5 py-4">
                  <CapacityBar percent={route.capacity} />
                </td>

                {/* Status badge */}
                <td className="px-5 py-4">
                  <StatusBadge status={route.status} />
                </td>

                {/* Action menu button */}
                <td className="px-5 py-4">
                  <button className="text-stone-400 hover:text-stone-700 text-lg">⋯</button>
                </td>

              </tr>
            ))}
          </tbody>

        </table>
      </div>

      {/* Add new route button at the bottom */}
      <div className="px-5 py-4 border-t border-stone-100">
        <button className="text-sm font-semibold text-green-700 border border-green-300 rounded-lg px-4 py-2 hover:bg-green-50 transition-colors">
          + Add New Route
        </button>
      </div>

    </Card>
  );
}
