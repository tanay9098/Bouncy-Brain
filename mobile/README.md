# Bouncy Brain — Mobile (React Native + Expo)

ADHD-friendly productivity app built with React Native and Expo. Shares the same backend as the web app.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React Native 0.74 + Expo SDK 51 |
| Navigation | React Navigation 6 (Native Stack + Bottom Tabs) |
| State | Zustand (local) + TanStack React Query (server) |
| HTTP | Axios (with JWT auto-attach + auto-refresh) |
| Auth Storage | `expo-secure-store` |
| Charts | `react-native-chart-kit` |
| Calendar | `react-native-calendars` |
| Timer Graphics | `react-native-svg` |
| Audio | `expo-av` |
| UI Effects | `expo-linear-gradient`, `expo-haptics` |

## Screens

| Screen | Description |
|--------|-------------|
| **Login / Signup** | Email + password auth, JWT stored securely |
| **Home** | Energy check-in (1–5), "What Next?" AI recommendation, daily stats |
| **Tasks** | Task CRUD, Brain Dump parser (AI), AI auto-chunk, filter by status |
| **Focus** | Pomodoro circular timer, presets, focus topic, session logging |
| **Stats** | Weekly/monthly bar charts (tasks + focus mins), streak counter |
| **Calendar** | Tasks plotted on calendar by due date |
| **Deadlines** | Upcoming & overdue tasks sorted by urgency |
| **Mindfulness** | 5 guided sessions (breathing, body scan, ADHD reset, sleep, gratitude) |

## Setup

### 1. Install dependencies

```bash
cd mobile
npm install
```

### 2. Configure API URL

Create a `.env` file (or set in `app.json` extras):

```
EXPO_PUBLIC_API_URL=http://YOUR_BACKEND_IP:4000/api
```

> On Android emulator use `10.0.2.2` instead of `localhost`.
> On a physical device, use your computer's LAN IP address.

### 3. Start the app

```bash
# Start Expo dev server
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator / device
npm run android
```

## Project Structure

```
mobile/
├── App.tsx                    # Root component (providers + navigator)
├── app.json                   # Expo config
├── babel.config.js
├── tsconfig.json
└── src/
    ├── navigation/
    │   └── AppNavigator.tsx   # Auth stack + main bottom tabs
    ├── screens/
    │   ├── auth/
    │   │   ├── LoginScreen.tsx
    │   │   └── SignupScreen.tsx
    │   ├── HomeScreen.tsx
    │   ├── TasksScreen.tsx
    │   ├── FocusScreen.tsx
    │   ├── StatsScreen.tsx
    │   ├── MoreScreen.tsx     # Menu for Calendar/Deadlines/Mindfulness
    │   ├── CalendarScreen.tsx
    │   ├── DeadlinesScreen.tsx
    │   └── MindfulnessScreen.tsx
    ├── contexts/
    │   ├── UserContext.tsx    # Auth state + JWT management
    │   └── EnergyContext.tsx  # Energy level (1–5)
    ├── stores/
    │   └── timerStore.ts      # Zustand store for Pomodoro timer
    ├── services/
    │   └── api.ts             # Axios client + all API functions
    └── theme/
        └── colors.ts          # Design tokens (colors, spacing, typography)
```

## Backend

The mobile app connects to the same Express/MongoDB backend as the web app. No backend changes are required — all existing API endpoints work out of the box.

Default backend URL: `http://localhost:4000/api`
