/**
 * utils/api.js — API Helper
 *
 * All backend calls go through here.
 * It automatically attaches the JWT token to every request
 * so you don't have to do it manually in every component.
 *
 * Usage:
 *   import api from "../utils/api";
 *   const data = await api.get("/routes");
 *   const result = await api.post("/auth/login", { email, password });
 */

const BASE_URL = import.meta.env.VITE_API_URL + "/api";

/**
 * Makes an HTTP request to the backend.
 * Automatically adds the Authorization header if a token exists.
 */
async function request(method, endpoint, body = null) {
  // Get token from localStorage (saved on login)
  const token = localStorage.getItem("oga_token");

  const headers = { "Content-Type": "application/json" };

  // Attach token if we have one
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const config = { method, headers };

  // Attach request body for POST/PUT/PATCH requests
  if (body) {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, config);
  const data = await response.json();

  // If server returned an error, throw it so the caller can catch it
  if (!response.ok) {
    throw new Error(data.message || "Something went wrong");
  }

  return data;
}

// Shorthand methods — use these in your components
const api = {
  get:    (endpoint)        => request("GET",    endpoint),
  post:   (endpoint, body)  => request("POST",   endpoint, body),
  put:    (endpoint, body)  => request("PUT",    endpoint, body),
  patch:  (endpoint, body)  => request("PATCH",  endpoint, body),
  delete: (endpoint)        => request("DELETE", endpoint),
};

export default api;
