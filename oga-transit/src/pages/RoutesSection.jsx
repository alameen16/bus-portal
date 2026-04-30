/* ─────────────────────────────────────────────
   2. ROUTES SECTION
   Asymmetric dark grid — large card left,
   two stacked cards right (matches design)
───────────────────────────────────────────── */
function RoutesSection({ setCurrentPage }) {
  return (
    // Dark background section matching the design
    <section className="bg-stone-950 px-6 py-16">
      <div className="max-w-7xl mx-auto">

        {/* Section header */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-green-400 text-xs font-bold uppercase tracking-widest mb-2">
              Curated Destinations
            </p>
            <h2 className="text-white font-black text-4xl leading-tight">
              Experience high-velocity exploration.
            </h2>
          </div>

          {/* View all routes — navigates to AllRoutesPage */}
          <button
            onClick={() => setCurrentPage("AllRoutes")}
            className="text-green-400 text-sm font-semibold hover:text-green-300 transition-colors whitespace-nowrap flex items-center gap-1"
          >
            View all routes →
          </button>
        </div>

        {/* ── Asymmetric Grid ──
            On desktop: left card takes 2 columns (tall),
            right side has 2 stacked cards in 1 column.
            On mobile: all cards stack vertically.
        */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* LEFT — Large featured card (first destination) */}
          <DestinationCard
            dest={DESTINATIONS[0]}
            onClick={() => setCurrentPage("Bookings")}
            large
          />

          {/* RIGHT — Two stacked smaller cards */}
          <div className="flex flex-col gap-4">
            <DestinationCard
              dest={DESTINATIONS[1]}
              onClick={() => setCurrentPage("Bookings")}
            />
            <DestinationCard
              dest={DESTINATIONS[2]}
              onClick={() => setCurrentPage("Bookings")}
            />
          </div>

        </div>
      </div>
    </section>
  );
}


/* ─────────────────────────────────────────────
   DESTINATION CARD
   Matches the design: image fills card,
   dark gradient overlay, text bottom-left,
   price bottom-right, tag pill above title
───────────────────────────────────────────── */
function DestinationCard({ dest, onClick, large = false }) {
  return (
    <div
      onClick={onClick}
      className={`
        relative rounded-2xl overflow-hidden cursor-pointer group
        ${large ? "h-96 md:h-full min-h-80" : "h-64"}
      `}
    >
      {/* Background image — zooms in on hover */}
      <img
        src={dest.image}
        alt={`${dest.from} to ${dest.to}`}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
      />

      {/* Dark overlay — stronger at the bottom for text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/10" />

      {/* Subtle blue tint overlay matching the design's cool tone */}
      <div className="absolute inset-0 bg-blue-950/20" />

      {/* Card content — pinned to the bottom */}
      <div className="absolute bottom-0 left-0 right-0 p-5 flex items-end justify-between gap-4">

        {/* LEFT: tag + title + subtitle */}
        <div>
          {/* Tag pill (e.g. "Top Rated Route") */}
          {dest.tag && (
            <span className="bg-green-400/90 text-green-950 text-xs font-bold px-3 py-1 rounded-full mb-3 inline-block tracking-wide">
              {dest.tag.toUpperCase()}
            </span>
          )}

          {/* Route name */}
          <h3 className={`text-white font-black leading-tight mb-1 ${large ? "text-3xl" : "text-xl"}`}>
            {dest.from} — {dest.to}
          </h3>

          {/* Subtitle */}
          <p className="text-white/60 text-sm">{dest.subtitle}</p>
        </div>

        {/* RIGHT: price */}
        <div className="text-right flex-shrink-0">
          {large && (
            <p className="text-white/50 text-xs uppercase tracking-widest mb-0.5">From</p>
          )}
          <p className="text-green-400 font-black text-2xl">{dest.price}</p>
        </div>

      </div>
    </div>
  );
}
