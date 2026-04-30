# 🚌 Oga Transit

Nigeria's premium bus booking app — built with React + Vite + Tailwind CSS.

---

## 📁 Project Structure

```
oga-transit/
│
├── index.html                  ← HTML shell (React mounts here)
├── package.json                ← Project dependencies & scripts
├── vite.config.js              ← Vite build tool config
├── tailwind.config.js          ← Tailwind CSS config
├── postcss.config.js           ← PostCSS config (required by Tailwind)
│
└── src/
    ├── main.jsx                ← App entry point (renders <App />)
    ├── index.css               ← Tailwind CSS imports
    ├── App.jsx                 ← Root component (page switcher)
    │
    ├── data/
    │   └── index.js            ← All app data (routes, seats, fleet, etc.)
    │
    ├── components/             ← Reusable building blocks
    │   ├── Navbar.jsx          ← Top navigation bar
    │   ├── Button.jsx          ← Reusable button with variants
    │   ├── Card.jsx            ← White card container
    │   ├── StatusBadge.jsx     ← On Time / Delayed badge
    │   ├── SeatPicker.jsx      ← Interactive seat grid
    │   └── CapacityBar.jsx     ← Bus capacity progress bar
    │
    └── pages/                  ← Full page views
        ├── HomePage.jsx        ← Landing page (hero, routes, features, CTA)
        ├── BookingsPage.jsx    ← Booking flow (schedule, seats, payment)
        ├── AdminPage.jsx       ← Operations dashboard
        └── SupportPage.jsx     ← FAQ + contact form
```

---

## 🚀 Getting Started

### 1. Install dependencies
```bash
npm install
```

### 2. Start the development server
```bash
npm run dev
```

Then open your browser at: **http://localhost:5173**

---

## 🛠️ Build for Production

```bash
npm run build
```

This creates an optimized `/dist` folder you can deploy anywhere.

---

## 🎨 Tech Stack

| Tool        | Purpose                          |
|-------------|----------------------------------|
| React 18    | UI components & interactivity    |
| Vite        | Fast dev server & bundler        |
| Tailwind CSS| Utility-first styling            |

---

## 💡 VS Code Tip

If you see warnings on the `@tailwind` lines in `index.css`, install:

**Tailwind CSS IntelliSense** by Bradlc (from the Extensions panel)

This removes the warnings AND gives you autocomplete for Tailwind classes.
