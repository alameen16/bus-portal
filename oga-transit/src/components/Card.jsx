/**
 * components/Card.jsx — Reusable White Card Box
 * 
 * A simple white box with rounded corners and a border.
 * Used all over the app to group related content.
 * 
 * Props:
 *   - children: anything inside the card
 *   - className: extra Tailwind classes (e.g. for padding)
 *   - title: optional heading shown at the top of the card
 */

export default function Card({ children, className = "", title }) {
  return (
    <div className={`bg-white rounded-2xl border border-stone-200 shadow-sm ${className}`}>

      {/* If a title is provided, show it as a header */}
      {title && (
        <div className="px-5 py-4 border-b border-stone-100">
          <h3 className="font-bold text-stone-800 text-base">{title}</h3>
        </div>
      )}

      {/* Card content */}
      {children}
    </div>
  );
}
