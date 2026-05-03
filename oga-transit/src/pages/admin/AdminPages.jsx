/**
 * pages/admin/AdminPages.jsx — Admin Pages (Buses, Drivers, Bookings, Staff)
 */

import { useState, useEffect, useCallback } from "react";
import { usePolling } from "../../hooks/usePolling";
import api from "../../utils/api";
import { useAuth } from "../../context/AuthContext";

// ── Shared helpers ──
export function Spinner() {
  return <div className="flex justify-center py-20"><div className="text-4xl animate-bounce">🚌</div></div>;
}
export function Alert({ type, message, onClose }) {
  return (
    <div className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold ${
      type === "error" ? "bg-red-50 text-red-700 border border-red-200" : "bg-green-50 text-green-700 border border-green-200"
    }`}>
      <span>{type === "error" ? "⚠️" : "✅"} {message}</span>
      <button onClick={onClose} className="ml-4 opacity-60 hover:opacity-100">✕</button>
    </div>
  );
}
export function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-screen overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
          <h3 className="font-bold text-stone-900">{title}</h3>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-700 text-xl">✕</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
export function Field({ label, value, onChange, type = "text", placeholder }) {
  return (
    <div>
      <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm bg-stone-50 focus:outline-none focus:border-green-500 transition-colors" />
    </div>
  );
}

/* ══════════════════════════════════════
   BUSES PAGE
══════════════════════════════════════ */
export function BusesPage() {
  const { isSuperAdmin } = useAuth();
  const [buses,    setBuses]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editBus,  setEditBus]  = useState(null);
  const [error,    setError]    = useState("");
  const [success,  setSuccess]  = useState("");

  useEffect(() => { load(); }, []);

  async function load() {
    try { setBuses(await api.get("/buses")); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  async function changeStatus(id, status) {
    try { await api.patch(`/buses/${id}/status`, { status }); flash("Status updated."); load(); }
    catch (e) { setError(e.message); }
  }

  async function deleteBus(id) {
    if (!window.confirm("Remove this bus from the fleet?")) return;
    try { await api.delete(`/buses/${id}`); flash("Bus removed."); load(); }
    catch (e) { setError(e.message); }
  }

  function flash(msg) { setSuccess(msg); setTimeout(() => setSuccess(""), 3000); }

  const statusColor = { active: "bg-green-100 text-green-700", maintenance: "bg-amber-100 text-amber-700", inactive: "bg-red-100 text-red-600" };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h2 className="font-black text-stone-900 text-xl">Fleet / Buses</h2><p className="text-stone-500 text-sm">{buses.length} buses registered</p></div>
        <button onClick={() => { setEditBus(null); setShowForm(true); }} className="bg-green-700 text-white text-sm font-bold px-4 py-2.5 rounded-xl hover:bg-green-800">+ Add Bus</button>
      </div>
      {error   && <Alert type="error"   message={error}   onClose={() => setError("")} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess("")} />}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {buses.map(bus => (
          <div key={bus.id} className="bg-white rounded-2xl border border-stone-200 p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-black text-stone-900">{bus.plateNumber}</p>
                <p className="text-stone-500 text-xs">{bus.model} · {bus.year}</p>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold capitalize ${statusColor[bus.status]}`}>{bus.status}</span>
            </div>
            <div className="space-y-1 text-sm mb-4">
              <div className="flex justify-between"><span className="text-stone-400">Capacity</span><span className="font-semibold">{bus.capacity} seats</span></div>
              <div className="flex justify-between"><span className="text-stone-400">Route</span><span className="font-semibold text-right text-xs">{bus.route ? `${bus.route.from} → ${bus.route.to}` : <span className="text-red-400">Unassigned</span>}</span></div>
              <div className="flex justify-between"><span className="text-stone-400">Driver</span><span className="font-semibold">{bus.driver?.name || <span className="text-red-400">None</span>}</span></div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => { setEditBus(bus); setShowForm(true); }} className="text-xs text-blue-600 font-semibold border border-blue-200 px-2.5 py-1 rounded-lg hover:bg-blue-50">Edit</button>
              {bus.status !== "maintenance" && <button onClick={() => changeStatus(bus.id, "maintenance")} className="text-xs text-amber-600 font-semibold border border-amber-200 px-2.5 py-1 rounded-lg hover:bg-amber-50">Maintenance</button>}
              {bus.status === "maintenance" && <button onClick={() => changeStatus(bus.id, "active")}      className="text-xs text-green-600 font-semibold border border-green-200 px-2.5 py-1 rounded-lg hover:bg-green-50">Activate</button>}
              {isSuperAdmin && <button onClick={() => deleteBus(bus.id)} className="text-xs text-red-500 font-semibold border border-red-200 px-2.5 py-1 rounded-lg hover:bg-red-50">Remove</button>}
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <Modal title={editBus ? "Edit Bus" : "Add New Bus"} onClose={() => setShowForm(false)}>
          <BusForm bus={editBus} onSaved={() => { setShowForm(false); load(); flash(editBus ? "Bus updated." : "Bus added."); }} onClose={() => setShowForm(false)} />
        </Modal>
      )}
    </div>
  );
}

function BusForm({ bus, onSaved, onClose }) {
  const [form, setForm] = useState({ plateNumber: bus?.plateNumber || "", model: bus?.model || "", capacity: bus?.capacity || "", year: bus?.year || new Date().getFullYear(), color: bus?.color || "Green/White", amenities: bus?.amenities?.join(", ") || "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const upd = (k, v) => setForm(p => ({ ...p, [k]: v }));

  async function save() {
    setSaving(true);
    try {
      const payload = { ...form, capacity: Number(form.capacity), year: Number(form.year), amenities: form.amenities.split(",").map(s => s.trim()).filter(Boolean) };
      if (bus) await api.put(`/buses/${bus.id}`, payload);
      else     await api.post("/buses", payload);
      onSaved();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  }

  return (
    <div className="space-y-4">
      {error && <Alert type="error" message={error} onClose={() => setError("")} />}
      <Field label="Plate Number" value={form.plateNumber} onChange={v => upd("plateNumber", v)} placeholder="e.g. OGA-4421-LG" />
      <Field label="Model"        value={form.model}       onChange={v => upd("model", v)}       placeholder="e.g. Mercedes Sprinter" />
      <div className="grid grid-cols-2 gap-4">
        <Field label="Capacity (seats)" value={form.capacity} onChange={v => upd("capacity", v)} type="number" />
        <Field label="Year"             value={form.year}     onChange={v => upd("year", v)}     type="number" />
      </div>
      <Field label="Amenities (comma separated)" value={form.amenities} onChange={v => upd("amenities", v)} placeholder="WiFi, AC, USB Ports" />
      <div className="flex justify-end gap-3 pt-2">
        <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-stone-600 border border-stone-200 rounded-lg hover:bg-stone-50">Cancel</button>
        <button onClick={save} disabled={saving} className="px-4 py-2 text-sm font-bold text-white bg-green-700 rounded-lg hover:bg-green-800 disabled:opacity-60">{saving ? "Saving..." : bus ? "Update" : "Add Bus"}</button>
      </div>
    </div>
  );
}


/* ══════════════════════════════════════
   DRIVERS PAGE
══════════════════════════════════════ */
export function DriversPage() {
  const { isSuperAdmin } = useAuth();
  const [drivers,  setDrivers]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editDrv,  setEditDrv]  = useState(null);
  const [error,    setError]    = useState("");
  const [success,  setSuccess]  = useState("");

  useEffect(() => { load(); }, []);
  async function load() {
    try { setDrivers(await api.get("/drivers")); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  async function changeStatus(id, status) {
    try { await api.patch(`/drivers/${id}/status`, { status }); flash(`Driver ${status}.`); load(); }
    catch (e) { setError(e.message); }
  }

  async function deleteDriver(id) {
    if (!window.confirm("Remove this driver?")) return;
    try { await api.delete(`/drivers/${id}`); flash("Driver removed."); load(); }
    catch (e) { setError(e.message); }
  }

  function flash(msg) { setSuccess(msg); setTimeout(() => setSuccess(""), 3000); }

  const statusColor = { "on-duty": "bg-green-100 text-green-700", "off-duty": "bg-stone-100 text-stone-600", suspended: "bg-red-100 text-red-600" };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h2 className="font-black text-stone-900 text-xl">Drivers</h2><p className="text-stone-500 text-sm">{drivers.length} drivers</p></div>
        <button onClick={() => { setEditDrv(null); setShowForm(true); }} className="bg-green-700 text-white text-sm font-bold px-4 py-2.5 rounded-xl hover:bg-green-800">+ Add Driver</button>
      </div>
      {error   && <Alert type="error"   message={error}   onClose={() => setError("")} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess("")} />}

      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-stone-50 border-b border-stone-100">
              {["Driver", "License", "Bus", "Route", "Trips", "Status", "Actions"].map(h =>
                <th key={h} className="text-left px-5 py-3 text-xs font-bold text-stone-500 uppercase tracking-wider">{h}</th>)}
            </tr></thead>
            <tbody>
              {drivers.map(d => (
                <tr key={d.id} className="border-b border-stone-100 last:border-0 hover:bg-stone-50">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold text-xs">{d.avatar}</div>
                      <div><p className="font-semibold text-stone-900">{d.name}</p><p className="text-xs text-stone-400">{d.email}</p></div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-xs text-stone-500 font-mono">{d.licenseNumber}</td>
                  <td className="px-5 py-4 text-xs text-stone-600">{d.bus?.plateNumber || <span className="text-red-400">None</span>}</td>
                  <td className="px-5 py-4 text-xs text-stone-600">{d.route ? `${d.route.from} → ${d.route.to}` : <span className="text-red-400">None</span>}</td>
                  <td className="px-5 py-4 font-semibold">{d.totalTrips}</td>
                  <td className="px-5 py-4"><span className={`px-2.5 py-1 rounded-full text-xs font-bold capitalize ${statusColor[d.status]}`}>{d.status}</span></td>
                  <td className="px-5 py-4">
                    <div className="flex gap-2 flex-wrap">
                      <button onClick={() => { setEditDrv(d); setShowForm(true); }} className="text-xs text-blue-600 font-semibold hover:underline">Edit</button>
                      {d.status !== "on-duty"  && <button onClick={() => changeStatus(d.id, "on-duty")}  className="text-xs text-green-600 font-semibold hover:underline">On Duty</button>}
                      {d.status !== "off-duty" && <button onClick={() => changeStatus(d.id, "off-duty")} className="text-xs text-amber-600 font-semibold hover:underline">Off Duty</button>}
                      {d.status !== "suspended"&& <button onClick={() => changeStatus(d.id, "suspended")}className="text-xs text-red-500 font-semibold hover:underline">Suspend</button>}
                      {isSuperAdmin && <button onClick={() => deleteDriver(d.id)} className="text-xs text-red-400 font-semibold hover:underline">Delete</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <Modal title={editDrv ? "Edit Driver" : "Add New Driver"} onClose={() => setShowForm(false)}>
          <DriverForm driver={editDrv} onSaved={() => { setShowForm(false); load(); flash(editDrv ? "Driver updated." : "Driver added."); }} onClose={() => setShowForm(false)} />
        </Modal>
      )}
    </div>
  );
}

function DriverForm({ driver, onSaved, onClose }) {
  const [form, setForm] = useState({
    name:             driver?.name             || "",
    email:            driver?.email            || "",
    phone:            driver?.phone            || "",
    licenseNumber:    driver?.licenseNumber    || "",
    licenseExpiry:    driver?.licenseExpiry    || "",
    emergencyContact: driver?.emergencyContact || "",
    password:         "",
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");
  const upd = (k, v) => setForm(p => ({ ...p, [k]: v }));

  async function save() {
    if (!driver && !form.password) { setError("A login password is required for new drivers."); return; }
    setSaving(true);
    try {
      if (driver) { const { password, ...updates } = form; await api.put(`/drivers/${driver.id}`, updates); }
      else        { await api.post("/drivers", form); }
      onSaved();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  }

  return (
    <div className="space-y-4">
      {error && <Alert type="error" message={error} onClose={() => setError("")} />}
      <Field label="Full Name"         value={form.name}             onChange={v => upd("name", v)} />
      <Field label="Email"             value={form.email}            onChange={v => upd("email", v)} type="email" />
      <Field label="Phone"             value={form.phone}            onChange={v => upd("phone", v)} />
      <Field label="License Number"    value={form.licenseNumber}    onChange={v => upd("licenseNumber", v)} />
      <Field label="License Expiry"    value={form.licenseExpiry}    onChange={v => upd("licenseExpiry", v)} type="date" />
      <Field label="Emergency Contact" value={form.emergencyContact} onChange={v => upd("emergencyContact", v)} placeholder="Name - Phone" />
      {!driver && (
        <div>
          <Field label="Login Password" value={form.password} onChange={v => upd("password", v)} type="password" placeholder="Driver will use this to log in" />
          <p className="text-xs text-stone-400 mt-1 ml-1">Share this password with the driver after creation.</p>
        </div>
      )}
      <div className="flex justify-end gap-3 pt-2">
        <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-stone-600 border border-stone-200 rounded-lg hover:bg-stone-50">Cancel</button>
        <button onClick={save} disabled={saving} className="px-4 py-2 text-sm font-bold text-white bg-green-700 rounded-lg hover:bg-green-800 disabled:opacity-60">{saving ? "Saving..." : driver ? "Update Driver" : "Add Driver"}</button>
      </div>
    </div>
  );
}


/* ══════════════════════════════════════
   BOOKINGS PAGE
══════════════════════════════════════ */
export function AdminBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState("all");
  const [search,   setSearch]   = useState("");
  const [error,    setError]    = useState("");
  const [success,  setSuccess]  = useState("");

  const { data: bookingsData, loading: bLoading } = usePolling(() => api.get("/bookings"), 1000);
  useEffect(() => {
    if (bookingsData) { setBookings(bookingsData); setLoading(false); }
  }, [bookingsData]);
  useEffect(() => { setLoading(bLoading); }, [bLoading]);

  async function updateStatus(id, status) {
    try { await api.patch(`/bookings/${id}/status`, { status }); flash(`Booking ${status}.`); }
    catch (e) { setError(e.message); }
  }

  function flash(msg) { setSuccess(msg); setTimeout(() => setSuccess(""), 3000); }

  const filtered = bookings.filter(b => {
    const matchStatus = filter === "all" || b.status === filter;
    const matchSearch = search === "" ||
      b.passengerName.toLowerCase().includes(search.toLowerCase()) ||
      b.bookingRef.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  // Export currently filtered bookings to CSV
  function exportCSV() {
    const headers = ["Ref", "Staff", "Route", "Date", "Departure", "Seat", "Status"];
    const rows = filtered.map(b => [
      b.bookingRef,
      b.passengerName,
      `${b.from} → ${b.to}`,
      b.date,
      b.departure,
      b.seats?.join(", ") || b.seat,
      b.status,
    ]);

    const csv  = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `bookings-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const statusColor = {
    confirmed: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-600",
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-5">

      {/* Header with Export CSV button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-black text-stone-900 text-xl">Bookings</h2>
          <p className="text-stone-500 text-sm">{bookings.length} total bookings</p>
        </div>
        <button
          onClick={exportCSV}
          className="border border-green-600 text-green-700 text-sm font-bold px-4 py-2.5 rounded-xl hover:bg-green-50 transition-colors"
        >
          Export CSV
        </button>
      </div>

      {error   && <Alert type="error"   message={error}   onClose={() => setError("")} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess("")} />}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search staff name or ref..."
          className="border border-stone-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-green-500 flex-1 min-w-48"
        />
        {["all", "confirmed", "cancelled"].map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-colors ${
              filter === s ? "bg-green-700 text-white" : "bg-white border border-stone-200 text-stone-600 hover:border-green-400"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-100">
                {["Ref", "Staff", "Route", "Date", "Departure", "Seat", "Status", "Actions"].map(h =>
                  <th key={h} className="text-left px-4 py-3 text-xs font-bold text-stone-500 uppercase tracking-wider">{h}</th>
                )}
              </tr>
            </thead>
            <tbody>
              {filtered.map(b => (
                <tr key={b.id} className="border-b border-stone-100 last:border-0 hover:bg-stone-50">
                  <td className="px-4 py-3 font-mono text-xs text-stone-400">{b.bookingRef}</td>
                  <td className="px-4 py-3 font-semibold text-stone-900">{b.passengerName}</td>
                  <td className="px-4 py-3 text-stone-600 text-xs">{b.from} → {b.to}</td>
                  <td className="px-4 py-3 text-stone-500 text-xs">{b.date}</td>
                  <td className="px-4 py-3 text-stone-500 text-xs">{b.departure}</td>
                  <td className="px-4 py-3 text-center font-semibold">{b.seats?.join(", ") || b.seat}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold capitalize ${statusColor[b.status] || "bg-stone-100 text-stone-500"}`}>
                      {b.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {b.status !== "cancelled" && (
                      <button
                        onClick={() => updateStatus(b.id, "cancelled")}
                        className="text-xs text-red-500 font-semibold hover:underline"
                      >
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


/* ══════════════════════════════════════
   STAFF PAGE
══════════════════════════════════════ */
export function StaffPage() {
  const [staff,       setStaff]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [showForm,    setShowForm]    = useState(false);
  const [showImport,  setShowImport]  = useState(false);
  const [editStaff,   setEditStaff]   = useState(null);
  const [error,       setError]       = useState("");
  const [success,     setSuccess]     = useState("");

  useEffect(() => { load(); }, []);
  async function load() {
    try { setStaff(await api.get("/staff")); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  async function changeRole(id, role) {
    try { await api.patch(`/staff/${id}/role`, { role }); flash("Role updated."); load(); }
    catch (e) { setError(e.message); }
  }

  async function toggleStatus(id, current) {
    const status = current === "active" ? "suspended" : "active";
    try { await api.patch(`/staff/${id}/status`, { status }); flash(`Account ${status}.`); load(); }
    catch (e) { setError(e.message); }
  }

  async function deleteStaff(id) {
    if (!window.confirm("Remove this staff member?")) return;
    try { await api.delete(`/staff/${id}`); flash("Staff removed."); load(); }
    catch (e) { setError(e.message); }
  }

  function flash(msg) { setSuccess(msg); setTimeout(() => setSuccess(""), 3000); }

  const ROLE_CONFIG = {
    superadmin: { label: "Super Admin", color: "bg-purple-100 text-purple-700" },
    localAdmin:  { label: "Local Admin", color: "bg-blue-100 text-blue-700" },
    staff:       { label: "Staff", color: "bg-green-100 text-green-700" },
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-black text-stone-900 text-xl">Staff Management</h2>
          <p className="text-stone-500 text-sm">{staff.length} staff members</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowImport(true)}
            className="border border-green-600 text-green-700 text-sm font-bold px-4 py-2.5 rounded-xl hover:bg-green-50 transition-colors"
          >
            Import CSV
          </button>
          <button
            onClick={() => { setEditStaff(null); setShowForm(true); }}
            className="bg-green-700 text-white text-sm font-bold px-4 py-2.5 rounded-xl hover:bg-green-800"
          >
            + Add Staff
          </button>
        </div>
      </div>

      {error   && <Alert type="error"   message={error}   onClose={() => setError("")} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess("")} />}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {staff.map(s => (
          <div key={s.id} className="bg-white rounded-2xl border border-stone-200 p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold">{s.avatar}</div>
              <div>
                <p className="font-bold text-stone-900">{s.name}</p>
                <p className="text-xs text-stone-400">{s.email}</p>
              </div>
            </div>
            <div className="flex items-center justify-between mb-4">
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${(ROLE_CONFIG[s.role] || {color:"bg-stone-100 text-stone-600"}).color}`}>
                {(ROLE_CONFIG[s.role] || {label: s.role}).label}
              </span>
              <span className={`text-xs font-semibold ${s.status === "active" ? "text-green-600" : "text-red-500"}`}>{s.status}</span>
            </div>
            <div className="flex gap-2 flex-wrap">
              <select onChange={e => changeRole(s.id, e.target.value)} value={s.role}
                className="text-xs border border-stone-200 rounded-lg px-2 py-1 focus:outline-none focus:border-green-500 flex-1">
                <option value="superadmin">Super Admin</option>
                <option value="localAdmin">Local Admin</option>
                <option value="staff">Staff</option>
              </select>
              <button onClick={() => { setEditStaff(s); setShowForm(true); }} className="text-xs font-semibold text-blue-600 border border-blue-200 px-2.5 py-1 rounded-lg hover:bg-blue-50">Edit</button>
              <button onClick={() => toggleStatus(s.id, s.status)} className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${s.status === "active" ? "text-amber-600 border-amber-200 hover:bg-amber-50" : "text-green-600 border-green-200 hover:bg-green-50"}`}>
                {s.status === "active" ? "Suspend" : "Activate"}
              </button>
              <button onClick={() => deleteStaff(s.id)} className="text-xs font-semibold text-red-500 border border-red-200 px-2.5 py-1 rounded-lg hover:bg-red-50">Remove</button>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <Modal
          title={editStaff ? `Edit — ${editStaff.name}` : "Add New Staff Member"}
          onClose={() => { setShowForm(false); setEditStaff(null); }}
        >
          <AddStaffForm
            staff={editStaff}
            onSaved={() => { setShowForm(false); setEditStaff(null); load(); flash(editStaff ? "Staff member updated." : "Staff member added."); }}
            onClose={() => { setShowForm(false); setEditStaff(null); }}
          />
        </Modal>
      )}

      {showImport && (
        <Modal title="Import Staff from CSV" onClose={() => setShowImport(false)}>
          <ImportStaffForm
            onImported={(msg) => { setShowImport(false); load(); flash(msg); }}
            onClose={() => setShowImport(false)}
          />
        </Modal>
      )}
    </div>
  );
}

/* ── ADD / EDIT STAFF FORM ── */
function AddStaffForm({ staff: existingStaff, onSaved, onClose }) {
  const isEdit = !!existingStaff;
  const [form, setForm] = useState({
    name:     existingStaff?.name  || "",
    email:    existingStaff?.email || "",
    phone:    existingStaff?.phone || "",
    role:     existingStaff?.role  || "staff",
    password: "",
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");
  const upd = (k, v) => setForm(p => ({ ...p, [k]: v }));

  function validate() {
    if (!form.name.trim())         return "Full name is required.";
    if (!form.email.trim())        return "Email address is required.";
    if (!form.email.includes("@")) return "Enter a valid email address.";
    if (!isEdit && !form.password.trim())    return "Password is required.";
    if (!isEdit && form.password.length < 6) return "Password must be at least 6 characters.";
    if (isEdit && form.password && form.password.length < 6) return "New password must be at least 6 characters.";
    return null;
  }

  async function save() {
    const err = validate();
    if (err) { setError(err); return; }
    setSaving(true);
    setError("");
    try {
      if (isEdit) {
        const payload = { name: form.name, email: form.email, phone: form.phone, role: form.role };
        if (form.password.trim()) payload.password = form.password;
        await api.put(`/staff/${existingStaff.id}`, payload);
      } else {
        await api.post("/staff", form);
      }
      onSaved();
    } catch (e) {
      setError(e.message || `Failed to ${isEdit ? "update" : "add"} staff.`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {error && <Alert type="error" message={error} onClose={() => setError("")} />}
      <Field label="Full Name" value={form.name}     onChange={v => upd("name", v)}     placeholder="e.g. Emeka Okafor" />
      <Field label="Email"     value={form.email}    onChange={v => upd("email", v)}    type="email" placeholder="staff@company.ng" />
      <Field label="Phone"     value={form.phone}    onChange={v => upd("phone", v)} />
      <Field label="Password"  value={form.password} onChange={v => upd("password", v)} type="password" placeholder="Min 6 characters" />
      <div>
        <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">Role</label>
        <select value={form.role} onChange={e => upd("role", e.target.value)} className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm bg-stone-50 focus:outline-none focus:border-green-500">
          <option value="staff">Staff — book & view own bookings</option>
          <option value="localAdmin">Local Admin — manage routes, buses, drivers, bookings</option>
          <option value="superadmin">Super Admin — full system access</option>
        </select>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-stone-600 border border-stone-200 rounded-lg hover:bg-stone-50">Cancel</button>
        <button onClick={save} disabled={saving} className="px-4 py-2 text-sm font-bold text-white bg-green-700 rounded-lg hover:bg-green-800 disabled:opacity-60">
          {saving ? "Saving..." : isEdit ? "Update Staff" : "Add Staff"}
        </button>
      </div>
    </div>
  );
}

/* ── IMPORT STAFF FORM ── */
function ImportStaffForm({ onImported, onClose }) {
  const [importing, setImporting] = useState(false);
  const [error,     setError]     = useState("");
  const [preview,   setPreview]   = useState([]);
  const [fileName,  setFileName]  = useState("");

  function parseCSV(text) {
    const lines   = text.trim().split("\n");
    const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
    return lines.slice(1).map(line => {
      const values = line.split(",").map(v => v.trim());
      const obj    = {};
      headers.forEach((h, i) => { obj[h] = values[i] || ""; });
      return obj;
    }).filter(row => row.name || row.email);
  }

  function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = parseCSV(ev.target.result);
        setPreview(parsed);
        setError("");
      } catch {
        setError("Could not parse CSV. Make sure it has name, email, phone, role columns.");
      }
    };
    reader.readAsText(file);
  }

  async function handleImport() {
    if (preview.length === 0) { setError("No data to import."); return; }
    setImporting(true);
    setError("");
    try {
      const result = await api.post("/staff/bulk", { staff: preview });
      onImported(result.message);
    } catch (e) {
      setError(e.message || "Import failed.");
    } finally {
      setImporting(false);
    }
  }

  function downloadTemplate() {
    const csv  = "name,email,phone,role\nJohn Doe,john@company.com,08012345678,staff\nJane Smith,jane@company.com,08098765432,staff";
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = "staff_import_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      {error && <Alert type="error" message={error} onClose={() => setError("")} />}

      <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 text-sm text-stone-600">
        <p className="font-semibold text-stone-800 mb-1">CSV Format Required</p>
        <p className="text-xs text-stone-500 mb-3">Your CSV must have these columns: <span className="font-mono bg-white px-1 rounded">name, email, phone, role</span></p>
        <p className="text-xs text-stone-500 mb-3">All imported staff will have <span className="font-semibold text-stone-700">password</span> as their default password. They can change it after logging in.</p>
        <button onClick={downloadTemplate} className="text-xs text-green-700 font-bold underline">
          Download CSV template
        </button>
      </div>

      <div>
        <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Upload CSV File</label>
        <input
          type="file"
          accept=".csv"
          onChange={handleFile}
          className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm bg-stone-50 focus:outline-none focus:border-green-500"
        />
        {fileName && <p className="text-xs text-stone-400 mt-1">{fileName} — {preview.length} rows found</p>}
      </div>

      {preview.length > 0 && (
        <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
          <p className="text-xs font-bold text-stone-500 uppercase tracking-wider px-4 py-2 bg-stone-50 border-b border-stone-100">Preview ({preview.length} staff)</p>
          <div className="max-h-48 overflow-y-auto">
            {preview.slice(0, 10).map((row, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-2 border-b border-stone-50 last:border-0 text-sm">
                <span className="font-semibold text-stone-800">{row.name}</span>
                <span className="text-stone-400 text-xs">{row.email}</span>
                <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-semibold">{row.role || "staff"}</span>
              </div>
            ))}
            {preview.length > 10 && (
              <p className="text-xs text-stone-400 text-center py-2">...and {preview.length - 10} more</p>
            )}
          </div>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-stone-600 border border-stone-200 rounded-lg hover:bg-stone-50">Cancel</button>
        <button
          onClick={handleImport}
          disabled={importing || preview.length === 0}
          className="px-4 py-2 text-sm font-bold text-white bg-green-700 rounded-lg hover:bg-green-800 disabled:opacity-60"
        >
          {importing ? "Importing..." : `Import ${preview.length} Staff`}
        </button>
      </div>
    </div>
  );
}