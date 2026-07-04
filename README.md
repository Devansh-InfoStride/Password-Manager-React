# Secure Password Manager (React + Node.js)

A secure, responsive, and modern Password Manager application built with a React frontend (Vite) and a Node.js/Express backend.

---

## 📂 Directory Structure

The project has been restructured to separate the **Frontend** and **Backend** code. This architecture makes local development, testing, and cloud deployment straightforward.

```
Password-Manager-React/
├── frontend/             # React application (Vite, TailwindCSS/Vanilla CSS)
│   ├── src/              # React components, styles, utilities, and assets
│   ├── package.json      # Frontend package details & scripts
│   └── vercel.json       # Frontend deployment configuration for Vercel
│
├── backend/              # Node.js + Express API server
│   ├── index.js          # Main application entry point
│   ├── utils/            # Helper modules (database connections, mail configurations)
│   ├── uploads/          # Temporary file/image upload directory
│   └── package.json      # Backend package details & scripts
│
├── Extension/            # Password Manager Browser Extension
├── Login/                # Custom Login modules or templates
└── README.md             # This instruction manual
```

---

## ⚡ Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) (v16+ recommended)
- [MongoDB](https://www.mongodb.com/) (Local database instance or MongoDB Atlas Connection String)

### 1. Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables. Create a `.env` file in the `backend/` directory using `.env.example` as a template:
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
   cd ../frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables. Create a `.env` file in the `frontend/` directory (refer to `.env.example`):
   ```env
   VITE_API_URL=http://localhost:5000/
   VITE_LOGIN_URL=http://localhost:5173/login
   ```
4. Start the frontend development server:
   ```bash
   npm run dev
   ```
   Open your browser to `http://localhost:5173`.

---

## 🚀 Deployment Instructions

### Frontend (e.g., Vercel)
The frontend contains a `vercel.json` file. 
To deploy using Vercel:
1. Install the Vercel CLI: `npm i -g vercel`
2. Run `vercel` in the `frontend` folder and follow the prompts.
3. Configure the `VITE_API_URL` environment variable in the Vercel dashboard to point to your deployed backend URL.

### Backend (e.g., Render, Railway, Heroku)
To deploy the Express server:
1. Select the `backend` folder as the root directory of your project on the deployment platform.
2. Set the build command to `npm install` and the start command to `node index.js`.
3. Add the required environment variables (e.g., `MONGO_URI`, `JWT_SECRET`, etc.) inside your deployment platform dashboard.
