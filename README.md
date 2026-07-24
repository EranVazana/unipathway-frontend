# UniPathway — Frontend

A React.js frontend for UniPathway, a smart academic consultant platform that helps Israeli students make confident university decisions by comparing their Sekem scores against real admission thresholds.

Built as part of the Web Development Environments course at Ben-Gurion University of the Negev.

**Team:** Eran Vazana & Omri Hershkovich

---

## Prerequisites

- Node.js (v16 or higher)
- The UniPathway backend server running locally on port 3000 (Assignment 2)

---

## Installation

```bash
npm install
```

---

## Running the App

```bash
npm start
```

The app will open at [http://localhost:5173](http://localhost:5173).

---

## API Base URL

The frontend connects to the backend REST API at:

```
http://localhost:3000
```

Make sure the backend server from Assignment 2 is running on port 3000 before using the app.

---

## Pages & Features

| Page | Route | Description |
|------|-------|-------------|
| Login | `/login` | Email + password login with validation and error feedback |
| Home | `/home` | Browse universities and departments, compare programs |
| Dashboard | `/dashboard` | Watchlist, academic scores, recommendations, infographics |
| Settings | `/settings` | Edit profile info, change password, toggle dark mode |
| Users | `/users` | Admin-only user management table |
| About | `/about` | Project overview and feature summary |

All pages except `/login` are protected and redirect unauthenticated users to `/login`.

---

## Required Components

### 1. Login Page (`src/pages/Login.jsx`)
Email and password inputs with field validation, loading state, error message display, and automatic redirect to `/home` on success. Connects to `POST /api/auth/login`.

### 2. Navbar & Layout (`src/components/Navbar.jsx`)
Appears on all authenticated pages. Shows the app name/logo, navigation links, the logged-in user's name, and a logout button. Fetches current user via `GET /api/users/me`. Logout clears auth state and redirects to `/login`.

### 3. Footer (`src/components/Footer.jsx`)
Persistent footer on all pages. Displays the project name, team name, and current year.

### 4. Settings Page (`src/pages/Settings.jsx`)
Loads current user settings via `GET /api/settings`. Allows editing at least 3 fields (username, email, theme/dark mode). Submits changes via `PUT /api/settings`. Shows loading, success, and error states with validation.

### 5. Dashboard / Home (`src/pages/Dashboard.jsx`, `src/pages/Home.jsx`)
Fetches data from the backend on mount, displays loading and empty states. Dashboard shows the user's watchlist, Sekem score summary, and personalized recommendations. Home shows university/department browsing.

### 6. Reusable Card Component (`src/components/Card.jsx`)
A generic card that receives data via props and renders consistently. Used in at least 3 distinct contexts: university cards on the Home page, department cards in search results, and recommendation cards on the Dashboard.

### 7. Data Table (`src/components/DataTable.jsx`)
A reusable table component that maps over an array of backend data and renders it row-by-row. Used in the Users admin page (`/users`) and the Dashboard comparison view.

---

## Backend API Endpoints Used

| Method | Endpoint | Used By |
|--------|----------|---------|
| POST | `/api/auth/login` | Login page |
| GET | `/api/users/me` | Navbar (logged-in user info) |
| GET | `/api/users` | Users admin page (admin only) |
| GET | `/api/settings` | Settings page (load current settings) |
| PUT | `/api/settings` | Settings page (save changes) |
| GET | `/api/universities` | Home page |
| GET | `/api/departments` | Home page, Dashboard |
| GET | `/api/admission-thresholds` | Dashboard (Sekem comparison) |
| GET | `/api/watchlist` | Dashboard (user's watchlist) |
| POST | `/api/watchlist` | Dashboard (add to watchlist) |
| PUT | `/api/watchlist/:id` | Dashboard (update watchlist entry) |
| DELETE | `/api/watchlist/:id` | Dashboard (remove from watchlist) |
| GET | `/api/academic-scores` | Dashboard (user's Sekem scores) |

---

## Project Structure

```
src/
├── components/     # Reusable UI elements (Navbar, Footer, Card, DataTable, ...)
├── pages/          # Route views (Login, Home, Dashboard, Settings, Users, About)
├── services/       # API communication (one file per resource)
├── context/        # Auth context (user state, login/logout actions)
├── hooks/          # useAcademicData — shared data hook for Dashboard and Home
├── styles/         # CSS design system (variables, dark mode, global tokens)
└── App.js          # Main entry point, routing, and protected route setup
```

---

## Screenshots

Screenshots of the running application (Login, Dashboard, Table, Settings) are included in the `screenshots/` folder of the submitted zip.