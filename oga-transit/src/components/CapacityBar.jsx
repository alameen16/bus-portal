/**
 * components/CapacityBar.jsx — Bus Capacity Progress Bar
 * 
 * Shows how full a bus is as a colored bar.
 * Color changes from green → orange → red as it fills up.
 * 
 * Props:
 *   - percent: number from 0–100 (how full the bus is)
 */

export default function CapacityBar({ percent }) {
  // Choose bar color based on how full the bus is
  let barColor = "bg-emerald-500";       // green  = plenty of space
  if (percent > 80) barColor = "bg-amber-500";  // orange = getting full
  if (percent > 92) barColor = "bg-red-500";    // red    = almost full

  return (
    <div>
      {/* Label showing the percentage */}
      <p className="text-xs text-stone-500 mb-1">{percent}% Capacity</p>

      {/* Gray track */}
      <div className="h-1.5 bg-stone-200 rounded-full overflow-hidden w-24">
        {/* Colored fill — width is set dynamically via inline style */}
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
