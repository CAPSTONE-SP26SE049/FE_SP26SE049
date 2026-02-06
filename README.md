# 🇻🇳 SpeakVN Journey - Web Portal

> **Capstone Project [Mã Lớp]**
> The Educator Portal & Player Landing Page for the "SpeakVN Journey" ecosystem.

![Status](https://img.shields.io/badge/Status-Frontend%20Development-blue?style=flat-square)
![React](https://img.shields.io/badge/-ReactJS-61DAFB?logo=react&logoColor=black)
![Ant Design](https://img.shields.io/badge/-Ant%20Design-0170FE?logo=ant-design&logoColor=white)

## 📖 Overview

This repository hosts the **Frontend Application** for the SpeakVN project. It is designed to provide comprehensive management tools for educators and an entry point for players.

**Current Focus:**
* **Educator Portal:** A dashboard for teachers to design learning roadmaps and configure assessment logic.
* **Landing Page:** An introduction page with a "Placement Test" feature for new users.

---

## ✨ Key Features (Frontend)

### 🎓 Educator Portal (Dashboard)
* **Roadmap Manager:** A visual, drag-and-drop style interface (similar to roadmap.sh) allowing educators to design learning paths for North, Central, and South accents.
* **Assessment Matrix:** UI to configure "If-This-Then-That" rules for placing students into specific courses based on their pronunciation errors.
* **Analytics Visualization:** Interactive charts (Heatmaps, Progress Bars) to track student performance.
* **Content Management:** Forms to upload audio samples and set AI precision thresholds.

### 🎮 Player Web Interface
* **Landing Page:** Introduction to the game lore and features.
* **Web-based Placement Test:** Interface for recording voice and viewing potential learning paths (Simulation/Mock Data).

---

## 🛠️ Tech Stack

* **Framework:** ReactJS (Vite)
* **UI Library:** Ant Design 5.0
* **Charts:** Recharts / Ant Design Charts
* **Routing:** React Router DOM v6
* **State Management:** React Hooks / Context API
* **Data Simulation:** Custom Mock Services (simulating Backend APIs)

---

## 📂 Project Structure (Modular Architecture)

```bash
SpeakVN-Web-System/
├── 📁 frontend/
│   ├── src/
│   │   ├── assets/                # Images, icons, static assets
│   │   ├── components/            # Shared UI components
│   │   │   ├── common/            # Atomic components (Button, Input, ...)
│   │   │   └── layout/            # Layout components (MainLayout, AuthLayout, ...)
│   │   ├── core/                  # Core logic (auth, hooks, utils)
│   │   │   ├── auth/              # AuthGuard, auth helpers
│   │   │   ├── hooks/             # Global hooks
│   │   │   └── utils/             # Helper functions
│   │   ├── modules/               # Feature modules (role-based)
│   │   │   ├── public/            # Public access (Home, Login)
│   │   │   │   └── pages/
│   │   │   ├── learner/           # Role: Learner
│   │   │   │   └── pages/         # (Roadmap, Placement, ...)
│   │   │   ├── educator/          # Role: Educator (Educator Portal)
│   │   │   │   ├── components/    # Educator-specific UI (e.g. layout)
│   │   │   │   ├── dashboard/     # Dashboard-related views (optional)
│   │   │   │   ├── management/    # Management features (roadmap, matrix, ...)
│   │   │   │   └── pages/         # Main pages (Dashboard, Matrix, Analytics, Settings)
│   │   │   └── admin/             # Role: Admin
│   │   │       └── pages/         # Admin dashboard, management screens
│   │   ├── router/                # Central routing configuration
│   │   │   └── AppRouter.tsx      # All route definitions
│   │   ├── services/              # Mock services & API facades
│   │   │   ├── mockAuthService.ts # Mock authentication + role-based session
│   │   │   └── mockData.js        # Mock curriculum & placement data
│   │   ├── App.tsx                # App root, uses AppRouter
│   │   └── main.tsx               # Vite/React entry point
│   ├── package.json
│   └── vite.config.ts
└── README.md
