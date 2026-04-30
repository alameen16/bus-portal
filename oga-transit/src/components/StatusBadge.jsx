/**
 * components/StatusBadge.jsx — Colored Status Label
 * 
 * A small pill/badge that shows a status like "On Time" or "Delayed".
 * The color changes based on the status value.
 * 
 * Props:
 *   - status: "on-time" | "delayed" | "full"
 */

// Map each status to a Tailwind color combination
const STATUS_STYLES = {
  "on-time": {
    dot: "bg-emerald-500",
    pill: "bg-emerald-50 text-emerald-700",
    label: "On Time",
  },
  delayed: {
    dot: "bg-amber-500",
    pill: "bg-amber-50 text-amber-700",
    label: "Delayed",
  },
  full: {
    dot: "bg-red-500",
    pill: "bg-red-50 text-red-600",
    label: "Full",
  },
};

export default function StatusBadge({ status }) {
  // Look up the style for this status, fallback to on-time
  const style = STATUS_STYLES[status] || STATUS_STYLES["on-time"];

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${style.pill}`}>
      {/* Colored dot */}
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
      {style.label}
    </span>
  );
}
