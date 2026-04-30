/**
 * hooks/usePolling.js — Auto-refresh Data Hook
 *
 * Fetches data from the backend every `interval` milliseconds.
 * Used on all admin pages so data is always up to date.
 *
 * Usage:
 *   const { data, loading, error, refresh } = usePolling(
 *     () => api.get("/bookings"),
 *     1000  // refresh every 1 second
 *   );
 */

import { useState, useEffect, useCallback, useRef } from "react";

export function usePolling(fetchFn, interval = 60000) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  // Use a ref so the interval always uses the latest fetchFn
  const fetchRef = useRef(fetchFn);
  fetchRef.current = fetchFn;

  const load = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const result = await fetchRef.current();
      setData(result);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    load(true);
  }, [load]);

  // Set up polling interval
  useEffect(() => {
    const timer = setInterval(() => {
      load(false); // silent refresh — no loading spinner
    }, interval);

    // Clean up when component unmounts
    return () => clearInterval(timer);
  }, [load, interval]);

  return { data, loading, error, refresh: () => load(true) };
}
