# JumpyBrain

A focus and productivity app built for ADHD brains. Combines a Pomodoro timer, task management, habit tracking, mindfulness tools, and AI assistance into a single installable PWA.

---

## Features

- **Focus Timer** — Pomodoro-style timer with distraction tracking and session history
- **Tasks** — Todo list with AI-powered priority scoring
- **Calendar** — Full calendar view with deadline awareness
- **Dashboard** — Progress charts, habit streaks, and energy tracking
- **Mindfulness** — Guided meditations and body scan audio
- **Deadlines** — Countdown timers for upcoming deadlines with alerts
- **Connectors** — Sync with Gmail, Google Calendar, and Slack
- **AI Assistant** — Streaming AI recommendations via OpenAI
- **Push Notifications** — Web push for deadline reminders and task nudges
- **PWA** — Installable on desktop and mobile, works offline

---

## Project Structure

```
JumpyBrain/
├── frontend/          # React PWA (Vite + Tailwind)
├── backend/           # Express API + Socket.io (Node.js)
└── chrome-extension/  # Chrome extension (Vite + React)
```

---

## Tech Stack

### Frontend
| Library | Purpose |
|---|---|
| React 19 + Vite 7 | UI framework and build tool |
| React Router v7 | Client-side routing |
| Tailwind CSS | Styling |
| Zustand | Client state management |
| TanStack Query | Server state and caching |
| Framer Motion | Animations |
| FullCalendar | Calendar view |
| Recharts | Progress charts |
| Socket.io Client | Real-time updates |
| vite-plugin-pwa / Workbox | Service worker and offline support |

### Backend
| Library | Purpose |
|---|---|
| Express 5 | HTTP server |
| Socket.io | Real-time events |
| Mongoose | MongoDB ODM |
| node-cron | Scheduled jobs (deadline checker, sync) |
| web-push | Web push notifications (VAPID) |
| OpenAI SDK | AI recommendations |
| nodemailer | Email alerts |
| google-auth-library | Google OAuth |

---

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB Atlas (or local MongoDB)
- Redis (optional — used for queuing; Railway Redis works)

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Runs on `http://localhost:5173`. API calls proxy to `http://localhost:3001`.

### Backend

```bash
cd backend
cp .env.example .env
# Fill in all values in .env
npm install
npm run dev
```

Runs on `http://localhost:3001`.

### Chrome Extension

```bash
cd chrome-extension
npm install
npm run build
```

Load the `chrome-extension/dist` folder as an unpacked extension in `chrome://extensions`.

---

## Environment Variables

Copy `backend/.env.example` to `backend/.env` and fill in the following:

| Variable | Description |
|---|---|
| `PORT` | Backend port (default `3001`) |
| `FRONTEND_URL` | Deployed frontend URL (for CORS) |
| `MONGODB_URI` | MongoDB Atlas connection string |
| `REDIS_URL` | Redis connection URL |
| `JWT_SECRET` | Secret for access tokens |
| `JWT_REFRESH_SECRET` | Secret for refresh tokens |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `OPENAI_API_KEY` | OpenAI API key for AI features |
| `ML_SERVICE_URL` | URL of the ML priority microservice |

---

## PWA

JumpyBrain is a fully installable Progressive Web App.

### Installing
- **Desktop (Chrome/Edge):** Click the install icon in the address bar
- **Mobile (Android):** Tap "Add to Home Screen" from the browser menu
- **Mobile (iOS/Safari):** Tap Share → "Add to Home Screen"

### Offline Support
| What | Behaviour |
|---|---|
| App shell (JS, CSS, HTML) | Fully cached — works offline |
| Icons and images | Fully cached |
| Audio (meditations) | Cached on first play via CacheFirst |
| API requests | NetworkFirst — shows last cached data when offline |
| Real-time (Socket.io) | Requires network |

### Build Output
`npm run build` auto-generates:
- `dist/sw.js` — Workbox service worker (do not edit manually)
- `dist/workbox-*.js` — Workbox runtime
- `dist/manifest.webmanifest` — Web app manifest

The service worker is configured in `vite.config.ts` under the `VitePWA` plugin.

---

## Scripts

### Frontend
| Command | Description |
|---|---|
| `npm run dev` | Start dev server with HMR |
| `npm run build` | Production build + generate SW |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |

### Backend
| Command | Description |
|---|---|
| `npm run dev` | Start with `--watch` (auto-restart) |
| `npm start` | Start without watch |
| `npm test` | Run Google auth tests |

---

## Deployment

- **Frontend** — Deployed on Vercel (`frontend/vercel.json`)
- **Backend** — Deployed on Railway (`backend/railway.toml`, `backend/Dockerfile`)
