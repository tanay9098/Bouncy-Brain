# JumpyBrain — ADHD Productivity Companion

JumpyBrain is a productivity application built specifically for people with ADHD/ADD. It combines smart task management, focus tools, mindfulness exercises, and AI-powered recommendations to help you stay on track — without overwhelming you.

---

## Table of Contents

- [What Is JumpyBrain?](#what-is-jumpybrain)
- [Features](#features)
- [How to Use (No-Code Guide)](#how-to-use-no-code-guide)
- [Project Structure](#project-structure)
- [Tech Stack](#tech-stack)
- [Getting Started (Developer Guide)](#getting-started-developer-guide)
  - [Prerequisites](#prerequisites)
  - [Environment Variables](#environment-variables)
  - [Running the Backend](#running-the-backend)
  - [Running the Frontend](#running-the-frontend)
  - [Loading the Chrome Extension](#loading-the-chrome-extension)
- [API Overview](#api-overview)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

---

## What Is JumpyBrain?

JumpyBrain is your personal ADHD buddy — a web app (plus Chrome extension) that adapts to your current energy level and helps you figure out *what to do next*, without the decision paralysis that comes with ADHD.

It is not just another to-do list. JumpyBrain actively:

- Suggests the best task to work on based on your energy and priorities
- Blocks distracting thoughts with a Brain Dump feature
- Tracks your focus sessions and builds streaks
- Sends deadline reminders before you forget
- Connects with Gmail, Slack, and Google Calendar to surface what needs your attention

---

## Features

| Feature | What it does |
|---|---|
| **Today View** | A daily overview — your current task, deadlines, and energy level at a glance |
| **Task Manager** | Create, prioritize, and complete tasks with due dates and priority scores |
| **Focus Timer** | Pomodoro-style timer that tracks your focus sessions |
| **Deadline Tracker** | Countdown timers for upcoming deadlines with push notifications |
| **Calendar** | Visual schedule pulled from your tasks and Google Calendar |
| **Progress Dashboard** | Weekly and monthly charts showing tasks completed and time focused |
| **Mindfulness** | Guided breathing and body-scan audio exercises |
| **AI Recommendations** | OpenAI-powered suggestions for which task to tackle next |
| **Energy Control** | Rate your current energy (1–5) to get appropriately scoped task suggestions |
| **Connectors** | Connect Gmail, Slack, and Google Calendar to sync tasks automatically |
| **Chrome Extension** | Quick-add tasks, start timers, and get your next task without switching tabs |
| **Dark / Light Theme** | Full dark and light mode support |
| **Push Notifications** | Browser push alerts for deadlines and reminders |

---

## How to Use (No-Code Guide)

> This section is for non-technical users who just want to understand what JumpyBrain does and how to get started using a deployed version.

### Step 1 — Sign up or Log in

Open the app URL in your browser. Click **Sign in with Google** or create an account with your email. JumpyBrain uses secure JWT authentication — your password is never stored in plain text.

### Step 2 — Set your energy level

On the left sidebar (or the bottom sheet on mobile), you will see an **Energy level** slider rated 1–5:

- 1 — Exhausted
- 2 — Low
- 3 — Okay
- 4 — Good
- 5 — Peak

Setting this helps JumpyBrain recommend tasks that match how you feel right now.

### Step 3 — Add your tasks

Go to the **Tasks** page. Add a task with a title, optional due date, and priority. The AI will help rank them.

### Step 4 — Let JumpyBrain pick what's next

On the **Today** page, tap **What's Next?** to get an AI recommendation for the single best task to start based on your energy, priorities, and deadlines.

### Step 5 — Use the Focus Timer

Go to **Focus Timer** and start a Pomodoro session for your chosen task. JumpyBrain logs your session time automatically.

### Step 6 — Connect your tools (optional)

Go to **Connectors** and link Gmail, Slack, or Google Calendar. JumpyBrain will sync relevant items into your task list automatically every 30 minutes.

### Step 7 — Check your Progress

The **Progress** page shows bar and line charts of your weekly and monthly performance — tasks completed, focus minutes, and your current streak.

### Chrome Extension

Install the extension in Chrome and pin it to your toolbar. From any website you can:

- See your next recommended task
- Quick-add a new task
- Start or stop a focus timer
- Do a Brain Dump (capture thoughts without leaving the page)

---

## Project Structure

```
JumpyBrain/
├── backend/              # Node.js / Express API server
│   ├── jobs/             # Cron jobs (deadline checker, integration sync)
│   ├── ml/               # Priority scoring model
│   ├── models/           # Mongoose data models
│   ├── routes/           # REST API route handlers
│   ├── services/         # Gmail, Slack, Google Calendar integrations
│   ├── utils/            # Email sender, web push helpers
│   ├── server.js         # Entry point
│   └── .env.example      # Environment variable template
│
├── frontend/             # React + Vite web application
│   ├── public/           # Static assets, audio files, service worker
│   └── src/
│       ├── components/   # All UI pages and widgets
│       ├── contexts/     # React contexts (user session, energy level)
│       ├── hooks/        # Custom React hooks
│       └── services/     # Axios API client
│
└── chrome-extension/     # React-based Chrome extension
    └── src/
        ├── components/   # Extension popup panels
        └── utils/        # API client, socket, local storage helpers
```

---

## Tech Stack

### Frontend
- **React 19** with React Router v7
- **Vite** — fast dev server and bundler
- **Recharts** — weekly/monthly analytics charts
- **Socket.io client** — real-time task and session updates

### Backend
- **Node.js + Express 5**
- **MongoDB + Mongoose** — primary data store
- **Socket.io** — real-time bidirectional events
- **OpenAI API** — AI task recommendations and streaming chat
- **Google OAuth + Google Auth Library** — sign-in and calendar/gmail scopes
- **Nodemailer** — transactional email
- **Web Push** — browser push notifications
- **Helmet + express-rate-limit** — security hardening
- **node-cron** — scheduled jobs (deadline checks every 5 min, integration sync every 30 min)

### Chrome Extension
- **React + Vite** — same stack as frontend, compiled to a Chrome MV3 extension

### Infrastructure
- **Frontend** → Vercel
- **Backend** → Render
- **ML Service** → Render
- **Database** → MongoDB Atlas (free tier compatible)

---

## Getting Started (Developer Guide)

### Prerequisites

- **Node.js** v18 or later
- **npm** v9 or later
- A **MongoDB Atlas** account (or a local MongoDB instance)
- A **Google Cloud** project with OAuth 2.0 credentials (for Google sign-in and integrations)
- An **OpenAI API key** (for AI recommendations)

### Environment Variables

Copy the example file and fill in the values:

```bash
cp backend/.env.example backend/.env
```

| Variable | Description |
|---|---|
| `PORT` | Port the backend listens on (default `4000`) |
| `NODE_ENV` | `development` or `production` |
| `FRONTEND_URL` | Comma-separated list of allowed frontend origins |
| `MONGODB_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Secret used to sign access tokens |
| `JWT_REFRESH_SECRET` | Secret used to sign refresh tokens |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `OPENAI_API_KEY` | OpenAI API key |
| `ML_SERVICE_URL` | URL of the ML priority microservice (optional) |

### Running the Backend

```bash
cd backend
npm install
npm run dev        # starts with --watch for hot reload
```

The server starts on `http://localhost:4000`. Health check: `GET /health`.

### Running the Frontend

```bash
cd frontend
npm install
npm run dev        # starts Vite dev server
```

The app opens at `http://localhost:5173`.

### Loading the Chrome Extension

```bash
cd chrome-extension
npm install
npm run build      # outputs to dist/
```

Then in Chrome:

1. Open `chrome://extensions`
2. Enable **Developer mode** (top right toggle)
3. Click **Load unpacked**
4. Select the `chrome-extension/dist` folder

The extension icon appears in your toolbar.

### Running Tests

```bash
cd backend
npm test
```

---

## API Overview

All routes are prefixed with `/api`.

| Route | Purpose |
|---|---|
| `POST /api/auth/register` | Register a new user |
| `POST /api/auth/login` | Email/password login |
| `POST /api/auth/google` | Google OAuth login |
| `GET /api/tasks` | List all tasks for the authenticated user |
| `POST /api/tasks` | Create a task |
| `GET /api/tasks/what-next` | AI recommendation for the next task |
| `GET /api/sessions` | List focus sessions |
| `POST /api/sessions` | Start / end a focus session |
| `GET /api/stats/daily` | Today's task and session summary |
| `GET /api/stats/weekly` | Last 7 days of activity |
| `GET /api/stats/monthly` | Last 30 days of activity |
| `GET /api/habits` | List habits |
| `POST /api/habits` | Create a habit |
| `GET /api/recommendations/mindfulness` | Mindfulness suggestion by energy level |
| `POST /api/integrations/connect` | Connect Gmail / Slack / Google Calendar |
| `POST /api/push/subscribe` | Register for browser push notifications |
| `GET /api/priority` | Priority score for tasks (ML model) |
| `POST /api/ai/stream` | Streaming AI chat response |

Authentication uses **Bearer JWT** tokens. Pass `Authorization: Bearer <token>` on every protected request.

---

## Deployment

### Backend (Render)

1. Create a new Render Web Service and connect this repository.
2. Set the **Root Directory** to `backend`.
3. Set **Runtime** to Docker — Render will use the existing `backend/Dockerfile`.
4. Set all environment variables from `.env.example` in the Render Environment tab.
5. Set `MONGODB_URI` to your MongoDB Atlas connection string.

### ML Service (Render)

1. Create a second Render Web Service in the same Render project as the backend.
2. Set the **Root Directory** to `ml-service/` (or whichever directory contains the ML server).
3. Set **Runtime** to Docker or Node depending on the ML service setup.
4. Copy the public URL of this service and add it as `ML_SERVICE_URL` in the backend service's Environment tab.

### Frontend (Vercel)

1. Import the repository into Vercel.
2. Set the **Root Directory** to `frontend`.
3. Set `VITE_API_URL` (or equivalent env var) to your Render backend URL.
4. Vercel will build and deploy automatically on every push to `main`.

---

## Contributing

1. Fork the repository and create a feature branch.
2. Make your changes and ensure `npm test` passes.
3. Open a pull request with a clear description of what you changed and why.

Please keep pull requests focused — one feature or fix per PR makes review much faster.

---

## License

This project is licensed under the terms in the [LICENSE](./LICENSE) file.
