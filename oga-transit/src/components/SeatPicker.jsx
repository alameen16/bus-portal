/**
 * components/SeatPicker.jsx — Realistic Bus Seat Layout
 *
 * Renders an actual bus floor-plan based on the bus's seat capacity.
 * Supports: 14, 18, 24, 33, 45, 54-seater buses (and anything in between).
 *
 * Layout logic:
 *   - Buses use a 2+2 aisle layout (2 seats | aisle | 2 seats)
 *   - 14-seaters use a 2+1 layout (minibus)
 *   - Last row can be a full-width bench (e.g. 5 seats across)
 *   - Driver cabin shown at the front
 *
 * Props:
 *   - capacity     : total seat count from the bus object (e.g. 24)
 *   - takenSeats   : array of seat numbers already booked (e.g. [3, 7, 12])
 *   - selectedSeats: array of currently selected seat numbers (e.g. [3, 7]) ← was selectedSeat (single)
 *   - onSelectSeat : callback(seatNumber) when a seat is clicked
 *   - maxSeats     : max seats user can select at once (default 3)        ← new
 */

export default function SeatPicker({
  capacity      = 24,
  takenSeats    = [],
  selectedSeats = [],   // ← changed from selectedSeat (single value) to array
  onSelectSeat,
  maxSeats      = 1,    // ← new prop
}) {
  const layout = buildLayout(capacity);
  const atMax  = selectedSeats.length >= maxSeats; // ← new: track when cap is hit

  return (
    <div className="select-none">

      {/* Legend */}
      <div className="flex gap-5 mb-5 flex-wrap items-center">
        <LegendItem color="bg-stone-100 border border-stone-300" label="Available" />
        <LegendItem color="bg-stone-300"                          label="Booked" />
        <LegendItem color="bg-green-600"                          label="Your Seat" />
        {/* ← new: only shows when cap is reached */}
        {atMax && (
          <span className="text-xs font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
            Max {maxSeats} seats reached
          </span>
        )}
      </div>

      {/* Bus shell */}
      <div className="inline-block bg-stone-50 border-2 border-stone-300 rounded-3xl p-4 shadow-inner min-w-[220px]">

        {/* Driver cab */}
        <div className="flex items-center justify-between mb-4 px-2">
          <div className="text-xs text-stone-400 font-semibold uppercase tracking-widest">Front</div>
          <div className="bg-stone-200 rounded-xl px-3 py-1.5 text-xs font-bold text-stone-500 flex items-center gap-1.5">
            🧑‍✈️ Driver
          </div>
        </div>

        {/* Door indicator */}
        <div className="flex justify-end mb-3 pr-1">
          <div className="text-[10px] text-green-600 font-bold border border-green-300 rounded px-1.5 py-0.5 bg-green-50">
            🚪 Door
          </div>
        </div>

        {/* Seat rows */}
        <div className="flex flex-col gap-2">
          {layout.rows.map((row, rowIdx) => (
            <SeatRow
              key={rowIdx}
              row={row}
              layout={layout}
              takenSeats={takenSeats}
              selectedSeats={selectedSeats} // ← changed from selectedSeat
              onSelectSeat={onSelectSeat}
              atMax={atMax}                 // ← new
            />
          ))}
        </div>

        {/* Rear label */}
        <div className="mt-4 text-center text-xs text-stone-400 font-semibold uppercase tracking-widest">
          Rear
        </div>
      </div>

      {/* Selection info — ← updated for multi-seat */}
      <div className="mt-4 text-sm text-stone-500">
        {selectedSeats.length > 0 ? (
          <span>
            Selected:{" "}
            {selectedSeats.map(s => (
              <span key={s} className="inline-block bg-green-100 border border-green-300 text-green-700 font-bold text-xs px-2 py-0.5 rounded-md mr-1">
                #{s}
              </span>
            ))}
            <span className="text-stone-400 text-xs ml-1">· click a seat again to deselect</span>
          </span>
        ) : (
          <span className="text-stone-400">Click an available seat to select it</span>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────
   SEAT ROW — renders one row of seats
───────────────────────────────────*/
function SeatRow({ row, layout, takenSeats, selectedSeats, onSelectSeat, atMax }) {
  // Back bench row (spans full width)
  if (row.isBackBench) {
    return (
      <div className="flex gap-1.5 justify-center mt-1">
        {row.seats.map(seatNum => (
          <Seat
            key={seatNum}
            seatNum={seatNum}
            taken={takenSeats.includes(seatNum)}
            selected={selectedSeats.includes(seatNum)}               // ← was: selectedSeat === seatNum
            dimmed={atMax && !selectedSeats.includes(seatNum) && !takenSeats.includes(seatNum)} // ← new
            onSelect={onSelectSeat}
          />
        ))}
      </div>
    );
  }

  // Standard row: left seats | aisle gap | right seats
  const { leftSeats, rightSeats } = row;

  return (
    <div className="flex items-center gap-1">
      {/* Left side */}
      <div className="flex gap-1">
        {leftSeats.map(seatNum => (
          <Seat
            key={seatNum}
            seatNum={seatNum}
            taken={takenSeats.includes(seatNum)}
            selected={selectedSeats.includes(seatNum)}               // ← was: selectedSeat === seatNum
            dimmed={atMax && !selectedSeats.includes(seatNum) && !takenSeats.includes(seatNum)} // ← new
            onSelect={onSelectSeat}
          />
        ))}
      </div>

      {/* Aisle */}
      <div className="w-5 flex-shrink-0" />

      {/* Right side */}
      <div className="flex gap-1">
        {rightSeats.map(seatNum => (
          <Seat
            key={seatNum}
            seatNum={seatNum}
            taken={takenSeats.includes(seatNum)}
            selected={selectedSeats.includes(seatNum)}               // ← was: selectedSeat === seatNum
            dimmed={atMax && !selectedSeats.includes(seatNum) && !takenSeats.includes(seatNum)} // ← new
            onSelect={onSelectSeat}
          />
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────
   SEAT — individual seat button
───────────────────────────────────*/
function Seat({ seatNum, taken, selected, dimmed, onSelect }) { // ← added dimmed prop
  return (
    <button
      onClick={() => !taken && !dimmed && onSelect(seatNum)} // ← dimmed seats also blocked
      disabled={taken}
      title={taken ? `Seat ${seatNum} — Booked` : `Seat ${seatNum}`}
      className={`
        w-9 h-9 rounded-t-lg rounded-b-sm text-[11px] font-bold
        transition-all duration-150 border-b-2
        ${taken
          ? "bg-stone-200 text-stone-400 border-stone-300 cursor-not-allowed"
          : selected
            ? "bg-green-600 text-white border-green-800 shadow-md scale-110 ring-2 ring-green-300"
            : dimmed                                                  // ← new state
              ? "bg-stone-100 text-stone-300 border-stone-200 cursor-not-allowed"
              : "bg-white text-stone-600 border-stone-300 hover:bg-green-50 hover:border-green-400 hover:text-green-700 cursor-pointer shadow-sm"
        }
      `}
    >
      {seatNum}
    </button>
  );
}

function LegendItem({ color, label }) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-stone-500">
      <div className={`w-5 h-5 rounded-t-md rounded-b-sm border-b-2 border-stone-400 ${color}`} />
      {label}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   buildLayout(capacity) — unchanged from your original
─────────────────────────────────────────────────────────────*/
function buildLayout(capacity) {
  const isMinibus = capacity <= 14;

  const seatsPerRow = isMinibus ? 3 : 4;
  const leftPerRow  = isMinibus ? 2 : 2;
  const rightPerRow = isMinibus ? 1 : 2;

  let mainSeats = capacity;
  let backBench = [];

  const remainder = capacity % seatsPerRow;
  if (!isMinibus && remainder !== 0) {
    mainSeats = capacity - remainder;
    backBench = Array.from({ length: remainder }, (_, i) => mainSeats + i + 1);
  }
  if (!isMinibus && remainder === 0 && capacity >= 30) {
    mainSeats = capacity - 4;
    backBench = [capacity - 3, capacity - 2, capacity - 1, capacity];
  }

  const rows = [];
  let seatNum = 1;

  while (seatNum <= mainSeats) {
    const leftSeats  = [];
    const rightSeats = [];

    for (let i = 0; i < leftPerRow  && seatNum <= mainSeats; i++) leftSeats.push(seatNum++);
    for (let i = 0; i < rightPerRow && seatNum <= mainSeats; i++) rightSeats.push(seatNum++);

    rows.push({ leftSeats, rightSeats, isBackBench: false });
  }

  if (backBench.length > 0) {
    rows.push({ seats: backBench, isBackBench: true });
  }

  return { rows, isMinibus };
}