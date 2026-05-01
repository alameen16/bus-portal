/**
 * pages/AllRoutesPage.jsx — All Routes with Smart Search
 *
 * - Shows all active routes from the backend (live, polls every 3s)
 * - Search by From/To city — exact matches shown first, similar below
 * - Each route card opens its own dedicated booking page
 */

import { useState, useEffect, useCallback } from "react";

const BASE_URL = import.meta.env.VITE_API_URL + "/api";;

export default function AllRoutesPage({ setCurrentPage, goToBookings }) {
  const [from,          setFrom]          = useState("");
  const [to,            setTo]            = useState("");
  const [exactRoutes,   setExactRoutes]   = useState([]);
  const [similarRoutes, setSimilarRoutes] = useState([]);
  const [allRoutes,     setAllRoutes]     = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [searching,     setSearching]     = useState(false);
  const [hasSearched,   setHasSearched]   = useState(false);

  // On mount, read search params passed from home page hero search
  useEffect(() => {
    const saved = sessionStorage.getItem("oga_search");
    if (saved) {
      const { from: f, to: t } = JSON.parse(saved);
      sessionStorage.removeItem("oga_search");
      if (f) setFrom(f);
      if (t) setTo(t);
      // Trigger search after state is set
      setTimeout(() => {
        if (f || t) {
          const params = new URLSearchParams();
          if (f) params.set("from", f);
          if (t) params.set("to", t);
          fetch(`${BASE_URL}/routes/search?` + params)
            .then(r => r.json())
            .then(data => {
              setExactRoutes(data.exact || []);
              setSimilarRoutes(data.similar || []);
              setHasSearched(true);
            });
        }
      }, 100);
    }
  }, []);

  // Load all routes on mount and poll every 3 seconds
  const loadAll = useCallback(async () => {
    try {
      const res = await fetch(`${BASE_URL}/routes/search`);
      const data = await res.json();
      setAllRoutes(data.exact || []);
    } catch {
      // silently fail on poll
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
    const interval = setInterval(loadAll, 600000);
    return () => clearInterval(interval);
  }, [loadAll]);

  // Search routes
  async function handleSearch() {
    if (!from && !to) return;
    setSearching(true);
    setHasSearched(true);
    try {
      const params = new URLSearchParams();
      if (from) params.set("from", from);
      if (to)   params.set("to", to);
      const res  = await fetch(`${BASE_URL}/routes/search?${params}`);
      const data = await res.json();
      setExactRoutes(data.exact   || []);
      setSimilarRoutes(data.similar || []);
    } catch {
      setExactRoutes([]);
      setSimilarRoutes([]);
    } finally {
      setSearching(false);
    }
  }

  function clearSearch() {
    setFrom("");
    setTo("");
    setHasSearched(false);
    setExactRoutes([]);
    setSimilarRoutes([]);
  }

  const displayRoutes   = hasSearched ? exactRoutes   : allRoutes;
  const displaySimilar  = hasSearched ? similarRoutes : [];

  return (
    <div className="min-h-screen bg-stone-50">

      {/* ── Search Header ── */}
      <div className="bg-green-950 px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <button onClick={() => setCurrentPage("Home")} className="text-green-400 text-sm mb-4 flex items-center gap-1 hover:text-green-300">
            ← Back to Home
          </button>
          <h1 className="text-white font-black text-3xl mb-6">Find Your Route</h1>

          {/* Search bar */}
          <div className="bg-white rounded-2xl p-4 flex flex-wrap gap-3 items-end shadow-xl">
            <SearchField label="From" value={from} onChange={setFrom} placeholder="e.g. Lagos" />
            <SearchField label="To"   value={to}   onChange={setTo}   placeholder="e.g. Abuja" />
            <button
              onClick={handleSearch}
              disabled={searching}
              className="bg-green-700 text-white font-bold px-6 py-2.5 rounded-xl hover:bg-green-800 transition-colors disabled:opacity-60"
            >
              {searching ? "Searching..." : "Search Routes"}
            </button>
            {hasSearched && (
              <button onClick={clearSearch} className="text-sm text-stone-500 hover:text-stone-700 font-semibold">
                Clear ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Results ── */}
      <div className="max-w-7xl mx-auto px-6 py-10">

        {loading ? (
          <div className="text-center py-20"><div className="text-4xl animate-bounce mb-3">🚌</div><p className="text-stone-500">Loading routes...</p></div>
        ) : (
          <>
            {/* Exact matches */}
            {displayRoutes.length > 0 && (
              <div className="mb-10">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-black text-stone-900 text-xl">
                    {hasSearched ? `${displayRoutes.length} Route(s) Found` : `All Routes (${displayRoutes.length})`}
                  </h2>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" title="Live updates" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {displayRoutes.map(route => (
                    <RouteCard key={route.id} route={route} onBook={() => goToBookings(route)} />
                  ))}
                </div>
              </div>
            )}

            {/* Similar routes */}
            {displaySimilar.length > 0 && (
              <div>
                <h2 className="font-bold text-stone-600 text-lg mb-4">Similar Routes You Might Like</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {displaySimilar.map(route => (
                    <RouteCard key={route.id} route={route} onBook={() => goToBookings(route)} similar />
                  ))}
                </div>
              </div>
            )}

            {/* No results */}
            {hasSearched && displayRoutes.length === 0 && displaySimilar.length === 0 && (
              <div className="text-center py-20">
                <div className="text-5xl mb-4">🔍</div>
                <p className="font-bold text-stone-700 text-lg mb-1">No routes found</p>
                <p className="text-stone-500 text-sm mb-4">Try searching with a different city name</p>
                <button onClick={clearSearch} className="text-green-700 font-semibold hover:underline">Show all routes</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function SearchField({ label, value, onChange, placeholder }) {
  return (
    <div className="flex flex-col gap-1 flex-1 min-w-28">
      <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">{label}</label>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        onKeyDown={e => e.key === "Enter" && document.querySelector("[data-search]")?.click()}
        className="border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-500 transition-colors"
      />
    </div>
  );
}

function RouteCard({ route, onBook, similar }) {
  const images = {
    "default":      "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&q=80",
  };
  const img = images[route.from] || images["default"];

  return (
    <div className={`relative rounded-2xl overflow-hidden group cursor-pointer h-64 ${similar ? "opacity-80" : ""}`} onClick={onBook}>
      <img src={img} alt={route.from} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

      {similar && (
        <div className="absolute top-3 left-3 bg-amber-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">Similar</div>
      )}

      <div className="absolute bottom-0 left-0 right-0 p-4">
        <h3 className="text-white font-black text-lg leading-tight mb-1">{route.from} → {route.to}</h3>
        <p className="text-white/55 text-xs mb-3">{route.duration} · {route.departures?.length} daily departures</p>
        <div className="flex items-center justify-between">
          <span className="text-green-400 font-black text-xl">₦{route.price?.toLocaleString()}</span>
          <button
            onClick={(e) => { e.stopPropagation(); onBook(); }}
            className="bg-green-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-green-500 transition-colors"
          >
            Book Now
          </button>
        </div>
      </div>
    </div>
  );
}