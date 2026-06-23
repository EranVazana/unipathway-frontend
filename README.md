# UniPathway — Frontend

A React.js frontend for UniPathway, a smart academic consultant platform that helps Israeli students make confident university decisions by comparing their Sekem scores against real admission thresholds.

Built as part of the Web Development Environments course at Ben-Gurion University of the Negev.

**Team:** Eran Vazana & Omri Hershkovich

---

## Prerequisites

- Node.js (v16 or higher)
- The UniPathway backend server running locally (Assignment 2)

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
| Login | `/login` | Email + password login with validation |
| Home | `/home` | Browse universities and departments, compare programs |
| Dashboard | `/dashboard` | Watchlist, academic scores, recommendations, infographics |
| Settings | `/settings` | Edit profile info and change password |
| Users | `/users` | Admin user management table |
| About | `/about` | Project overview and feature summary |

All pages except `/login` are protected and require authentication.

---

## Project Structure

```
src/
├── components/     # Reusable UI elements (Navbar, Footer, Card, DataTable, ...)
├── pages/          # Route views (Login, Home, Dashboard, Settings, ...)
├── services/       # API communication (one file per resource)
├── context/        # Auth context
├── hooks/          # useAcademicData shared data hook
├── styles/         # CSS design system and tokens
└── App.js          # Main entry point and routing
```

---

## Screenshots

Screenshots of the running application (Login, Dashboard, Table, Settings) are included in the `screenshots/` folder of the submitted zip.