/**
 * components/Button.jsx — Reusable Button
 * 
 * Instead of writing the same button styles over and over,
 * we create one Button component with different "variants".
 * 
 * Usage:
 *   <Button variant="primary" onClick={...}>Book Now</Button>
 *   <Button variant="outline" onClick={...}>Learn More</Button>
 *   <Button variant="ghost"   onClick={...}>Cancel</Button>
 * 
 * Props:
 *   - variant: "primary" | "outline" | "ghost" | "danger"
 *   - onClick: function to call when clicked
 *   - children: the text/content inside the button
 *   - className: extra Tailwind classes if needed
 *   - fullWidth: if true, button stretches to full width
 */

// Style lookup — each variant has its own Tailwind classes
const VARIANTS = {
  primary: "bg-green-700 text-white hover:bg-green-800 border border-green-700",
  outline: "bg-transparent text-green-700 border border-green-600 hover:bg-green-50",
  ghost:   "bg-transparent text-stone-600 border border-stone-300 hover:border-green-600 hover:text-green-700",
  danger:  "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100",
  dark:    "bg-stone-900 text-white border border-stone-900 hover:bg-stone-800",
};

export default function Button({
  variant = "primary",
  onClick,
  children,
  className = "",
  fullWidth = false,
}) {
  return (
    <button
      onClick={onClick}
      className={`
        inline-flex items-center justify-center gap-2
        rounded-lg px-5 py-2.5 text-sm font-semibold
        transition-all duration-200 cursor-pointer
        ${VARIANTS[variant]}
        ${fullWidth ? "w-full" : ""}
        ${className}
      `}
    >
      {children}
    </button>
  );
}
