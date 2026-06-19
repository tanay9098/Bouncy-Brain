# Bouncy Brain

A full-stack productivity application designed for people with ADHD/ADD. Bouncy Brain helps neurodivergent users manage tasks, run focus sessions, build habits, and get AI-powered guidance — all through interfaces optimized for how their brains actually work.


---

## What It Does

- **Task management** with AI-powered prioritization and brain dump parsing (paste messy thoughts, get structured tasks)
- **Pomodoro-style focus timer** with session tracking and distraction logging
- **"What Next?" AI recommendations** to reduce decision fatigue
- **Habit tracking** with streaks and daily check-ins
- **Energy level check-ins** so the app adapts to how you feel
- **Mindfulness & breathing exercises** for when focus breaks down
- **Real-time push notifications** for deadlines and reminders
- **Analytics dashboards** (weekly/monthly productivity stats)
- **Chrome extension** for quick task capture without leaving the browser

---

## Project Structure

```
Bouncy-Brain/
├── backend/              # Express.js REST API + Socket.IO server
├── frontend/             # React web app (Vite + Tailwind)
├── chrome-extension/     # Chrome browser extension (React + Vite)
├── mobile/               # React Native app (Expo)
├── ml-service/           # Python ML microservice (FastAPI + scikit-learn)
├── LICENSE
└── README.md
```

### `backend/`

The central API server. All clients (web, mobile, extension) connect here.

```
backend/
├── server.js             # Entry point — Express + Socket.IO setup
├── routes/               # API route handlers (tasks, auth, sessions, habits, etc.)
├── models/               # Mongoose schemas (User, Task, Session, Habit, Subscription, DistractionEvent)
├── services/             # Business logic (aiService.js — OpenAI integration)
├── jobs/                 # Cron jobs (deadlineChecker.js — runs every 5 minutes)
├── utils/                # Helpers (webpush.js, sendEmail.js)
├── ml/                   # Local ML model (priorityModel.js)
├── tests/                # Test suite
├── .env.example          # Environment variable template
├── Dockerfile            # Multi-stage Docker build
├── railway.toml          # Railway deployment config
└── vercel.json           # Vercel serverless deployment config
```

### `frontend/`

The main web application.

```
frontend/
├── src/
│   ├── App.jsx           # Root component
│   ├── main.jsx          # Vite entry point
│   ├── components/       # Reusable UI components
│   ├── contexts/         # React Context state
│   ├── hooks/            # Custom React hooks
│   ├── providers/        # Context providers
│   ├── services/         # Axios API client
│   ├── stores/           # Zustand state management
│   ├── themes/           # Design tokens
│   └── utils/            # Utility functions
├── public/
│   ├── audio/            # Sound assets
│   └── sounds/
├── vite.config.ts        # Vite bundler config
├── tailwind.config.js    # Tailwind CSS config
└── vercel.json           # Vercel SPA deployment config
```

### `chrome-extension/`

A browser extension for quick task capture and focus timer access.

```
chrome-extension/
├── src/
│   ├── App.jsx           # Popup UI root
│   ├── background/       # Service worker scripts
│   ├── components/       # Extension UI components
│   └── utils/            # Extension-specific utilities
├── public/icons/         # Extension icons (16/48/128px)
├── scripts/              # Icon generation build scripts
└── vite.config.ts        # Vite config for Chrome extension output
```

### `mobile/`

Cross-platform mobile app built with Expo.

```
mobile/
├── App.tsx               # Root component (providers + navigation setup)
├── app.json              # Expo config (permissions, build settings)
└── src/
    ├── navigation/       # React Navigation (stack + bottom tabs)
    ├── screens/
    │   ├── auth/         # Login / Signup screens
    │   ├── HomeScreen.tsx
    │   ├── TasksScreen.tsx
    │   ├── FocusScreen.tsx
    │   ├── StatsScreen.tsx
    │   ├── CalendarScreen.tsx
    │   ├── DeadlinesScreen.tsx
    │   └── MindfulnessScreen.tsx
    ├── contexts/         # Auth and Energy contexts
    ├── stores/           # Zustand (timer state)
    ├── services/         # Axios API client
    └── theme/            # Design tokens
```

### `ml-service/`

A lightweight Python microservice for AI-powered task prioritization.

```
ml-service/
├── main.py               # FastAPI application
├── requirements.txt      # Python dependencies
└── Dockerfile            # Python containerization
```

---

## Tech Stack

### Backend
| | |
|---|---|
| Runtime | Node.js 20 |
| Framework | Express.js 5 |
| Database | MongoDB (Mongoose) |
| Real-time | Socket.IO 4 |
| Auth | JWT, Google OAuth, bcryptjs |
| Security | Helmet, CORS, rate limiting |
| Email | Nodemailer |
| Push notifications | web-push |
| Scheduling | node-cron |
| AI | OpenAI API |

### Frontend
| | |
|---|---|
| Framework | React 19 |
| Bundler | Vite 7 |
| Routing | React Router 7 |
| State | Zustand, TanStack Query |
| Styling | Tailwind CSS, Framer Motion |
| Charts | Recharts |
| Calendar | FullCalendar |
| Real-time | Socket.IO Client |
| Audio | Howler.js |

### Chrome Extension
| | |
|---|---|
| Framework | React 19 |
| Bundler | Vite 7 |
| Real-time | Socket.IO Client |

### Mobile
| | |
|---|---|
| Framework | React Native 0.81 + Expo SDK 54 |
| Navigation | React Navigation 6 |
| State | Zustand, TanStack Query |
| Auth storage | expo-secure-store |
| Notifications | expo-notifications |
| Charts | react-native-chart-kit |
| Audio | expo-av |

### ML Service
| | |
|---|---|
| Framework | FastAPI |
| Server | Uvicorn |
| ML | scikit-learn |
| Validation | Pydantic v2 |

---

## Running Locally

### Prerequisites

- Node.js 20+
- Python 3.11+ (only if running the ML service)
- MongoDB (local instance or [MongoDB Atlas](https://www.mongodb.com/atlas))
- Redis (optional — used for caching and queues)

---

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env   # Fill in the values below
npm run dev            # Starts on http://localhost:4000
```

**Required `.env` values:**

```env
PORT=4000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/bouncybrain
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
FRONTEND_URL=http://localhost:5173
```

**Optional `.env` values:**

```env
GOOGLE_CLIENT_ID=your-google-oauth-client-id
OPENAI_API_KEY=sk-...               # Enables AI features
REDIS_URL=redis://localhost:6379    # Enables caching/queue
ML_SERVICE_URL=http://localhost:5001 # Enables ML prioritization
```

Available scripts:
- `npm run dev` — watch mode with auto-reload
- `npm start` — production server
- `npm test` — run test suite

---

### 2. Frontend

```bash
cd frontend
npm install
npm run dev    # Starts on http://localhost:5173
```

Available scripts:
- `npm run dev` — Vite dev server with HMR
- `npm run build` — production build (output: `dist/`)
- `npm run preview` — serve the production build locally
- `npm run lint` — ESLint

---

### 3. Chrome Extension

```bash
cd chrome-extension
npm install
npm run build
```

Then load the extension in Chrome:
1. Go to `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked** and select the `chrome-extension/` folder

For development with watch mode:
```bash
npm run dev
```

---

### 4. Mobile

```bash
cd mobile
npm install
npm start      # Opens Expo dev server
```

Then press:
- `i` — iOS simulator
- `a` — Android emulator
- `w` — web browser

**Important:** Update the API URL so the app can reach your local backend.

Create `mobile/.env`:
```env
EXPO_PUBLIC_API_URL=http://<YOUR_LAN_IP>:4000/api
```

- On Android emulator use `10.0.2.2` instead of `localhost`
- On a physical device use your computer's LAN IP (e.g. `192.168.1.x`)

---

### 5. ML Service (optional)

Only needed if you want AI-powered task prioritization.

```bash
cd ml-service
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 5001
```

Or run with Docker:

```bash
docker build -t bouncy-brain-ml .
docker run -p 5001:5001 bouncy-brain-ml
```

Set `ML_SERVICE_URL=http://localhost:5001` in `backend/.env` to connect.

---

### Running Everything Together

Start these in separate terminals:

| Terminal | Command | URL |
|---|---|---|
| 1 | `cd backend && npm run dev` | http://localhost:4000 |
| 2 | `cd frontend && npm run dev` | http://localhost:5173 |
| 3 | `cd ml-service && uvicorn main:app --port 5001` | http://localhost:5001 |
| 4 | `cd mobile && npm start` | Expo dev server |

---

## Deployment

### Backend
- **Railway** (recommended): uses `backend/railway.toml`. Health check endpoint at `/health`.
- **Vercel**: uses `backend/vercel.json` (note: cron jobs are disabled in serverless environments).
- **Docker**: `docker build -t bouncy-brain-api . && docker run -p 4000:4000 --env-file .env bouncy-brain-api`

### Frontend
- **Vercel** (recommended): auto-deploys on push. Uses `frontend/vercel.json` with SPA rewrite rules.

### ML Service
- **Railway / Docker**: uses `ml-service/Dockerfile`. Exposes port 5001.
