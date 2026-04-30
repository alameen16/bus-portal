/**
 * data/index.js — App Data
 * 
 * All the "fake" data used in the app lives here.
 * In a real app, this would come from an API (like a server).
 * Keeping it here makes it easy to find and update.
 */

// 🚌 Bus routes shown on the home page destination cards
export const DESTINATIONS = [
  {
    id: 1,
    from: "Lagos",
    to: "Abuja",
    tag: "Most Popular",
    price: "₦8,500",
    subtitle: "Hourly departures · Executive coaches",
    image: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&q=80",
    large: true, // This card spans more columns
  },
  {
    id: 2,
    from: "Lagos",
    to: "Ibadan",
    tag: null,
    price: "₦3,200",
    subtitle: "Night Liner Available",
    image: "https://images.unsplash.com/photo-1569154941061-e231b4725ef1?w=400&q=80",
    large: false,
  },
  {
    id: 3,
    from: "Abuja",
    to: "Kano",
    tag: null,
    price: "₦6,800",
    subtitle: "Express · 4 hrs",
    image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80",
    large: false,
  },
];

// ⏰ Departure schedules shown on the booking page
export const SCHEDULES = [
  { id: 1, departure: "06:30", arrival: "12:45", duration: "6h 15m", price: "₦8,500" },
  { id: 2, departure: "10:00", arrival: "16:20", duration: "6h 20m", price: "₦7,200" },
  { id: 3, departure: "15:30", arrival: "21:45", duration: "6h 15m", price: "₦9,000" },
];

// 🚍 Fleet data shown in the admin operations table
export const FLEET = [
  {
    id: "RT-001",
    corridor: "Lagos → Abuja",
    departure: "06:30 AM",
    bus: "OGA-4421",
    capacity: 81,
    status: "on-time",
  },
  {
    id: "RT-002",
    corridor: "Lagos → Ibadan",
    departure: "08:00 AM",
    bus: "OGA-3300",
    capacity: 95,
    status: "delayed",
  },
  {
    id: "RT-003",
    corridor: "Abuja → Kano",
    departure: "09:15 AM",
    bus: "OGA-1812",
    capacity: 68,
    status: "on-time",
  },
];

// 💡 Feature cards shown on the home page
export const FEATURES = [
  {
    icon: "../icon.svg",
    isImage: true,
    title: "Real-time Tracking",
    description: "Know exactly where your bus is with live GPS updates.",
  },
  {
    icon: "../seat.svg",
    isImage: true,
    title: "Premium Comfort",
    description: "Ergonomic seating with extra legroom and high-speed Wi-Fi.",
  },
  {
    icon: "../pay.svg",
    isImage: true,
    title: "Secure Payments",
    description: "Pay safely with card, transfer, or USSD — always encrypted.",
  },
  {
    icon: "../customer.svg",
    isImage: true,
    title: "24/7 Concierge",
    description: "Direct support line for all your travel needs and inquiries.",
  },
];

// 🪑 Seat layout for the seat selector (20 seats)
// booked: true means someone already reserved this seat
export const SEATS = Array.from({ length: 20 }, (_, i) => ({
  id: i + 1,
  booked: [3, 7, 11, 14, 17].includes(i + 1), // these seats are taken
}));
