# Secure Password Manager (React + Node.js)

A secure, responsive, and modern Password Manager application built with a React frontend (Vite) and a Node.js/Express backend.

---

## 📂 Directory Structure

The project is organized into 5 top-level folders, each with a single, clear purpose:

```
Password-Manager-React/
├── Frontend/             # React application (Vite) - login, signup, and the PassGuard vault UI
│   ├── src/
│   │   ├── Components/
│   │   │   ├── auth/     # Login.jsx, Signup.jsx (routed at /login, /signup)
│   │   │   └── features/ # Dashboard, generator, strength checker, vault, profile
│   │   ├── styles/, utils/, context/, assets/
│   │   ├── package.json
│   │   └── vercel.json
│
├── Backend/              # Node.js + Express API server (auth, passwords, sharing, profile)
│   ├── index.js
│   ├── utils/
│   └── package.json
│
├── Web-Extension/        # Password Manager Browser Extension
├── Landing-Page/         # Marketing / landing page
└── Rest/                 # Everything else not belonging to the 4 folders above
    ├── check_raw_data.js
    ├── skills-lock.json
    ├── .agents/
    └── .impeccable/
```

Login and signup used to live in a separate `Login/` app deployed on its own domain, handing off a token via a URL query param. They've been merged into `Frontend/` as routes (`/login`, `/signup`) inside the same single-page app, guarded by a `RequireAuth` wrapper so only an authenticated session can reach the vault routes.

---

## ⚡ Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) (v16+ recommended)
- [MongoDB](https://www.mongodb.com/) (Local database instance or MongoDB Atlas Connection String)

### 1. Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd Backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables. Create a `.env` file in the `Backend/` directory using `.env.example` as a template:
   ```env
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   # Email settings (e.g. NodeMailer / Mailtrap)
   EMAIL_USER=your_email
   EMAIL_PASS=your_email_password
   ```
4. Start the backend server:
   ```bash
   npm start
   ```
   The backend server will run on `http://localhost:5000` (or your configured `PORT`).

---

### 2. Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd ../Frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables. Create a `.env` file in the `Frontend/` directory (refer to `.env.example`):
   ```env
   VITE_API_URL=http://localhost:5000/
   ```
4. Start the frontend development server:
   ```bash
   npm run dev
   ```
   Open your browser to `http://localhost:5173`. If you don't have a token yet, you'll be redirected to `/login`, with a link through to `/signup`.

---

## 🚀 Deployment Instructions

### Frontend (e.g., Vercel)
The `Frontend/` folder contains a `vercel.json` file (SPA rewrite to `index.html`, needed so `/login`, `/signup`, etc. work on refresh).
To deploy using Vercel:
1. Install the Vercel CLI: `npm i -g vercel`
2. Run `vercel` in the `Frontend` folder and follow the prompts.
3. Configure the `VITE_API_URL` environment variable in the Vercel dashboard to point to your deployed backend URL.

This replaces the previous two-Vercel-project setup (one for the vault app, one for Login) — there is now a single deployment for `Frontend/`.

### Backend (e.g., Render, Railway, Heroku)
To deploy the Express server:
1. Select the `Backend` folder as the root directory of your project on the deployment platform.
2. Set the build command to `npm install` and the start command to `node index.js`.
3. Add the required environment variables (e.g., `MONGO_URI`, `JWT_SECRET`, etc.) inside your deployment platform dashboard.
