# TaskSphere: Secure Task Management System

TaskSphere is a full-stack, secure task management application built as a showcase project. It features user authentication with short-lived Access Tokens, secure HTTP-only Refresh Token rotation, and Role-Based Access Control (RBAC).

---

## 🚀 Tech Stack

### Backend
* **Node.js & Express.js**: Fast, unopinionated, minimalist web framework.
* **PostgreSQL**: Robust, scalable relational database.
* **Prisma ORM**: Modern database client for schema management, migrations, and index definitions.
* **JWT & Bcrypt**: Password hashing and stateless authentication tokens.
* **Express-Validator**: Middleware sanitization and parameter parsing.
* **Swagger (swagger-ui-express)**: Automated OpenAPI REST specification documentation.
* **Morgan**: Logger output configured for development/production.
* **Helmet & Express Rate Limit**: Basic API security hardening.

### Frontend
* **React.js & Vite**: Fast React compilation and hot-reloading.
* **React Router**: Single-page-app routing.
* **Axios**: Promised-based HTTP client featuring interceptor-driven token refreshes.
* **Context API**: Global state container for user sessions.
* **Custom Vanilla CSS**: Sleek Dark theme featuring Glassmorphic layers, grids, and transitions.

---

## 🔒 Security Design Decisions

1. **Short-lived Access Tokens (15m)**: Stored in frontend state/localStorage for authorization headers.
2. **HTTP-only Refresh Tokens (7d)**: Stored in an encrypted, HTTP-only cookie with `sameSite: 'lax'` (local dev) to protect against XSS extraction.
3. **Database Token Hashing**: Refresh tokens are hashed using SHA-256 before inserting them into the database to prevent plain-text leakages in case of DB breaches.
4. **Token Rotation & Reuse Detection**: Every refresh token usage deletes the old token and issues a new one. If an expired or reused refresh token is presented, the API triggers a safety wipe of all active user tokens.
5. **Input Sanitization**: Password fields are explicitly filtered out from all Prisma return models before sending response payloads.

---

## 📂 Project Structure

```
task-management-sys/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma      # DB Model and Indexes (ownerId, status, priority)
│   ├── src/
│   │   ├── config/            # Prisma client & Swagger configs
│   │   ├── controllers/       # Auth, Tasks, and Admin Controllers
│   │   ├── middleware/        # JWT auth, RBAC authorize(), and error handler
│   │   ├── routes/            # Express route routes
│   │   ├── services/          # Core Business logic layer
│   │   ├── utils/             # AppError helper
│   │   ├── validators/        # Express-Validator rulesets
│   │   └── app.js             # Express middlewares mounting
│   ├── .env                   # Environment configurations
│   ├── package.json
│   └── server.js              # Server bootstrapper
│
├── frontend/
│   ├── src/
│   │   ├── components/        # ProtectedRoute, Navbar, TaskCard, TaskForm modal, Loader
│   │   ├── context/           # AuthContext provider
│   │   ├── pages/             # Login, Register, Dashboard, AdminDashboard
│   │   ├── services/          # Axios instance with interceptor refresh handler
│   │   ├── index.css          # Custom Space-Navy Glassmorphic design stylesheet
│   │   └── App.jsx            # React route router
│   ├── package.json
│   └── vite.config.js         # Proxy redirection configuration
│
├── README.md                  # Setup guidelines
└── SCALABILITY.md             # Scalability architecture report
```

---

## ⚙️ Setup and Installation

### 1. Prerequisites
Ensure you have the following installed on your machine:
* [Node.js](https://nodejs.org/) (v18+ recommended)
* [PostgreSQL](https://www.postgresql.org/) (running locally on port 5432)

---

### 2. Backend Setup
1. Open a terminal and navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `backend/` directory and populate it:
   ```properties
   PORT=5000
   NODE_ENV=development
   DATABASE_URL="postgresql://postgres:password@localhost:5432/task_management_db"
   JWT_SECRET="supersecretjwtkey12345_dev_only"
   JWT_REFRESH_SECRET="supersecretjwtrefreshkey98765_dev_only"
   JWT_EXPIRES_IN=15m
   JWT_REFRESH_EXPIRES_IN=7d
   FRONTEND_URL="http://localhost:5173"
   ```
   *(Adjust username/password/ports in DATABASE_URL if different from standard postgres/password config)*
4. Run Prisma database sync and client generation:
   ```bash
   npx prisma db push
   ```
5. Start the backend development server:
   ```bash
   npm run dev
   ```
   *The server will boot on http://localhost:5000*

---

### 3. Frontend Setup
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite React development server:
   ```bash
   npm run dev
   ```
   *The client will boot on http://localhost:5173*

---

## 📖 API Documentation & Swagger

When the backend is running, the interactive Swagger documentation page is available at:
👉 **[http://localhost:5000/api-docs](http://localhost:5000/api-docs)**

You can use the swagger panel to test endpoints. Use the `/auth/login` response token to authorize operations via the **Authorize (lock)** button by prefixing: `Bearer <your_token>`.

---

## 🔐 Sample Credentials & Roles Guide

To test the role-based dashboard, you can register accounts right from the frontend:

1. **First User Auto-Admin**: To simplify setup, registering the **very first account** in the system automatically elevates it to `ADMIN` privilege.
2. **Standard User**: Subsequent sign-ups default to `USER` unless specified via the role select box on the Register page.
3. **Behavioral RBAC Tests**:
   * **`USER` Account**: Log in and visit the dashboard. You can create, edit, search, filter, and delete *only your own tasks*. Accessing `/admin` routes will redirect you back.
   * **`ADMIN` Account**: Log in. You can manage your tasks, and click on **Admin Panel** in the Navbar to audit all database tasks across all users, delete any task, see the user list directory, and purge users.
