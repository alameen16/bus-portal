/**
 * pages/admin/RoutesPage.jsx — Manage Bus Routes
 *
 * Features:
 *   - List all routes with status, bus, driver
 *   - Create new route (modal form)
 *   - Edit existing route
 *   - Activate / Deactivate route
 *   - Delete route (superadmin only)
 */

import { useState, useEffect } from "react";
import api from "../../utils/api";
import { useAuth } from "../../context/AuthContext";

export default function RoutesPage() {
  const { isSuperAdmin } = useAuth();
  const [routes,    setRoutes]    = useState([]);
  const [buses,     setBuses]     = useState([]);
  const [drivers,   setDrivers]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [showForm,  setShowForm]  = useState(false);
  const [editRoute, setEditRoute] = useState(null); // null = create new
  const [error,     setError]     = useState("");
  const [success,   setSuccess]   = useState("");

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    try {
      const [r, b, d] = await Promise.all([
        api.get("/routes"),
        api.get("/buses"),
        api.get("/drivers"),
      ]);
      setRoutes(r);
      setBuses(b);
      setDrivers(d);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function toggleStatus(id) {
    try {
      await api.patch(`/routes/${id}/status`, {});
      showSuccess("Route status updated.");
      loadAll();
    } catch (err) { setError(err.message); }
  }

  async function deleteRoute(id) {
    if (!window.confirm("Delete this route permanently?")) return;
    try {
      await api.delete(`/routes/${id}`);
      showSuccess("Route deleted.");
      loadAll();
    } catch (err) { setError(err.message); }
  }

  function showSuccess(msg) {
    setSuccess(msg);
    setTimeout(() => setSuccess(""), 3000);
  }

  function openCreate() { setEditRoute(null); setShowForm(true); }
  function openEdit(r)  { setEditRoute(r);    setShowForm(true); }

  if (loading) return <Spinner />;

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-black text-stone-900 text-xl">Bus Routes</h2>
          <p className="text-stone-500 text-sm">{routes.length} routes total</p>
        </div>
        <button
          onClick={openCreate}
          className="bg-green-700 text-white text-sm font-bold px-4 py-2.5 rounded-xl hover:bg-green-800 transition-colors"
        >
          + New Route
        </button>
      </div>

      {/* Alerts */}
      {error   && <Alert type="error"   message={error}   onClose={() => setError("")} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess("")} />}

      {/* Routes Table */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-100">
                {["Route", "Price", "Departures", "Bus", "Driver", "Status", "Actions"].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-bold text-stone-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {routes.map(route => (
                <tr key={route.id} className="border-b border-stone-100 last:border-0 hover:bg-stone-50">
                  <td className="px-5 py-4">
                    <p className="font-bold text-stone-900">{route.from} → {route.to}</p>
                    <p className="text-xs text-stone-400">{route.distance} · {route.duration}</p>
                  </td>
                  <td className="px-5 py-4 font-bold text-green-700">₦{route.price?.toLocaleString()}</td>
                  <td className="px-5 py-4 text-stone-500 text-xs">{route.departures?.join(", ") || "—"}</td>
                  <td className="px-5 py-4 text-stone-600 text-xs">{route.bus?.plateNumber || <span className="text-red-400">Unassigned</span>}</td>
                  <td className="px-5 py-4 text-stone-600 text-xs">{route.driver?.name    || <span className="text-red-400">Unassigned</span>}</td>
                  <td className="px-5 py-4">
                    <StatusBadge status={route.status} />
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(route)}        className="text-xs text-blue-600 font-semibold hover:underline">Edit</button>
                      <button onClick={() => toggleStatus(route.id)} className="text-xs text-amber-600 font-semibold hover:underline">
                        {route.status === "active" ? "Deactivate" : "Activate"}
                      </button>
                      {isSuperAdmin && (
                        <button onClick={() => deleteRoute(route.id)} className="text-xs text-red-500 font-semibold hover:underline">Delete</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Modal */}
      {showForm && (
        <RouteFormModal
          route={editRoute}
          buses={buses}
          drivers={drivers}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); loadAll(); showSuccess(editRoute ? "Route updated." : "Route created."); }}
        />
      )}

    </div>
  );
}

/* ── Route Create/Edit Form Modal ── */
function RouteFormModal({ route, buses, drivers, onClose, onSaved }) {
  const isEdit = !!route;
  const [form, setForm] = useState({
    from:          route?.from          || "",
    to:            route?.to            || "",
    fromTerminal:  route?.fromTerminal  || "",
    toTerminal:    route?.toTerminal    || "",
    price:         route?.price         || "",
    duration:      route?.duration      || "",
    distance:      route?.distance      || "",
    departures:    route?.departures?.join(", ") || "",
    stops:         route?.stops?.join(", ")      || "",
    busId:         route?.busId         || "",
    driverId:      route?.driverId      || "",
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");

  function update(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function save() {
    setSaving(true);
    setError("");
    try {
      const payload = {
        ...form,
        price:      Number(form.price),
        departures: form.departures.split(",").map(s => s.trim()).filter(Boolean),
        stops:      form.stops.split(",").map(s => s.trim()).filter(Boolean),
        busId:      form.busId    || null,
        driverId:   form.driverId || null,
      };
      if (isEdit) {
        await api.put(`/routes/${route.id}`, payload);
      } else {
        await api.post("/routes", payload);
      }
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={isEdit ? "Edit Route" : "Create New Route"} onClose={onClose}>
      {error && <Alert type="error" message={error} onClose={() => setError("")} />}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="From City"       value={form.from}         onChange={v => update("from", v)} />
        <Field label="To City"         value={form.to}           onChange={v => update("to", v)} />
        <Field label="From Terminal"   value={form.fromTerminal}  onChange={v => update("fromTerminal", v)} />
        <Field label="To Terminal"     value={form.toTerminal}    onChange={v => update("toTerminal", v)} />
        <Field label="Price (₦)"       value={form.price}         onChange={v => update("price", v)} type="number" />
        <Field label="Duration"        value={form.duration}      onChange={v => update("duration", v)} placeholder="e.g. 6h 15m" />
        <Field label="Distance"        value={form.distance}      onChange={v => update("distance", v)} placeholder="e.g. 755km" />
        <Field label="Departures (comma separated)" value={form.departures} onChange={v => update("departures", v)} placeholder="06:00, 09:00, 12:00" />
        <Field label="Stops (comma separated)" value={form.stops} onChange={v => update("stops", v)} placeholder="e.g. Ore, Lokoja" />
        <div>
          <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">Assign Bus</label>
          <select value={form.busId} onChange={e => update("busId", e.target.value)} className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm bg-stone-50 focus:outline-none focus:border-green-500">
            <option value="">— None —</option>
            {buses.filter(b => b.status === "active").map(b => (
              <option key={b.id} value={b.id}>{b.plateNumber} ({b.model})</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">Assign Driver</label>
          <select value={form.driverId} onChange={e => update("driverId", e.target.value)} className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm bg-stone-50 focus:outline-none focus:border-green-500">
            <option value="">— None —</option>
            {drivers.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex justify-end gap-3 mt-6">
        <button onClick={onClose} className="px-5 py-2 text-sm font-semibold text-stone-600 border border-stone-200 rounded-lg hover:bg-stone-50">Cancel</button>
        <button onClick={save} disabled={saving} className="px-5 py-2 text-sm font-bold text-white bg-green-700 rounded-lg hover:bg-green-800 disabled:opacity-60">
          {saving ? "Saving..." : isEdit ? "Update Route" : "Create Route"}
        </button>
      </div>
    </Modal>
  );
}

// ── Shared small components ──
function Spinner() {
  return <div className="flex justify-center py-20"><div className="text-4xl animate-bounce">🚌</div></div>;
}

function StatusBadge({ status }) {
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-bold capitalize ${
      status === "active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
    }`}>{status}</span>
  );
}

function Alert({ type, message, onClose }) {
  return (
    <div className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold ${
      type === "error" ? "bg-red-50 text-red-700 border border-red-200" : "bg-green-50 text-green-700 border border-green-200"
    }`}>
      <span>{type === "error" ? "⚠️" : "✅"} {message}</span>
      <button onClick={onClose} className="ml-4 opacity-60 hover:opacity-100">✕</button>
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-screen overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
          <h3 className="font-bold text-stone-900">{title}</h3>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-700 text-xl">✕</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", placeholder }) {
  return (
    <div>
      <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm bg-stone-50 focus:outline-none focus:border-green-500 transition-colors"
      />
    </div>
  );
}
