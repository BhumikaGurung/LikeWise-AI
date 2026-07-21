<div align="center">

<img src="assets/logo.png" alt="LearnWise AI Logo" width="180"/>

# LearnWise AI

### 🚀 AI-Powered Learning Platform for Modern Students

Transform the way you study with AI-assisted learning. Upload PDFs, generate quizzes, create flashcards, build study plans, and learn smarter through an interactive AI-powered workspace.

<br>

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-Latest-646CFF?logo=vite)](https://vitejs.dev/)
[![Express](https://img.shields.io/badge/Express-5-black?logo=express)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-336791?logo=postgresql)](https://postgresql.org/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle-ORM-green)](https://orm.drizzle.team/)
[![Clerk](https://img.shields.io/badge/Auth-Clerk-purple)](https://clerk.com/)
[![Google Gemini](https://img.shields.io/badge/AI-Google%20Gemini-orange)](https://ai.google.dev/)

### 🌐 Live Demo

**https://likewise-ai.onrender.com/**

</div>


---

# 📖 Overview

LearnWise AI is an intelligent learning platform designed to help students study more efficiently using Artificial Intelligence.

Instead of simply reading notes, students can interact with AI, upload PDFs, generate quizzes, create flashcards, organize study plans, and monitor their learning progress from a single modern dashboard.

The project follows a **contract-first architecture**, ensuring frontend and backend remain synchronized through a shared OpenAPI specification.

---

# ✨ Features

| Feature | Status |
|----------|--------|
| 🤖 AI Tutor | 🚧 UI Ready |
| 📄 PDF Learning | ✅ CRUD Ready |
| 📝 AI Notes | 🚧 Planned |
| 🎯 Quiz Generator | ✅ CRUD Ready |
| 🎴 Flashcards | ✅ CRUD Ready |
| 📅 Study Planner | ✅ CRUD Ready |
| 📊 Progress Dashboard | ✅ Connected to Database |
| 🔐 Authentication | ✅ Clerk |
| 👤 User Profiles | ✅ |
| 📈 Activity Feed | ✅ |

---

# 🛠 Tech Stack

## Frontend

- React 19
- TypeScript
- Vite
- Tailwind CSS v4
- Wouter
- Framer Motion
- TanStack React Query
- Radix UI
- Lucide React
- Recharts

---

## Backend

- Node.js
- Express 5
- TypeScript
- PostgreSQL
- Drizzle ORM
- Zod
- Orval
- PDF Parse

---

## Authentication

- Clerk Authentication
- Cookie-based Authentication
- Automatic User Provisioning

---

## AI (Current / Planned)

Current Foundation

- AI Tutor Interface
- PDF Learning Interface
- Quiz Interface
- Flashcards Interface

Planned

- Google Gemini / OpenAI
- Streaming AI Chat
- RAG Pipeline
- AI Quiz Generation
- AI Flashcards
- AI Study Planner

---

# 🏗 Architecture

```text
                        OpenAPI Specification
                               │
                               ▼
                     API Code Generation
                               │
          ┌────────────────────┴────────────────────┐
          │                                         │
          ▼                                         ▼
   React Frontend                         Express Backend
          │                                         │
          └──────────────► PostgreSQL ◄─────────────┘
                               │
                               ▼
                         Drizzle ORM
```

---

# 📁 Project Structure

```text
LearnWise-AI/

├── artifacts/
│   ├── api-server/
│   ├── learnwise-ai/
│   └── mockup-sandbox/
│
├── lib/
│   ├── api-client-react/
│   ├── api-spec/
│   ├── api-zod/
│   └── db/
│
├── scripts/
├── attached_assets/
└── .agents/
```

---

# 🚀 Getting Started

## Clone Repository

```bash
git clone https://github.com/<username>/LearnWise-AI.git
cd LearnWise-AI
```

---

## Install Dependencies

```bash
pnpm install
```

---

## Start Backend

```bash
PORT=8080 pnpm --filter @workspace/api-server run dev
```

---

## Start Frontend

```bash
PORT=5173 BASE_PATH=/ pnpm --filter @workspace/learnwise-ai run dev
```

---

# ⚙ Environment Variables

Create a `.env` file.

```env
DATABASE_URL=

CLERK_SECRET_KEY=

CLERK_PUBLISHABLE_KEY=

VITE_CLERK_PUBLISHABLE_KEY=
```

> During development, if Clerk keys are not configured, the backend automatically enables a development authentication bypass.

---

# 🔄 Development Workflow

Generate API Client

```bash
pnpm --filter @workspace/api-spec run codegen
```

Type Check

```bash
pnpm run typecheck
```

Build Project

```bash
pnpm run build
```

Push Database Schema

```bash
pnpm --filter @workspace/db run push
```

---

# 🧠 Architecture Principles

- Contract-first API Development
- Shared OpenAPI Specification
- Automatic API Client Generation
- Shared Zod Validation
- Database-first Development
- Modular Monorepo using pnpm Workspaces

---

# 📌 Current Development Status

### Completed

- Authentication
- Dashboard
- Flashcards CRUD
- Quiz CRUD
- Study Planner CRUD
- PDF CRUD
- Activity Feed
- Progress Dashboard

### In Progress

- AI Tutor Integration
- PDF Processing
- RAG Pipeline

### Planned

- AI Notes
- AI Flashcards
- AI Study Plans
- Streaming Chat
- Spaced Repetition
- OCR Support

---

# 📸 Screenshots

Add screenshots here:

- Landing Page
- Dashboard
- AI Tutor
- Quiz Generator
- Flashcards
- PDF Learning
- Study Planner

---

# 🤝 Contributing

Contributions are welcome.

1. Fork the repository

2. Create your feature branch

```bash
git checkout -b feature/new-feature
```

3. Commit your changes

```bash
git commit -m "Add new feature"
```

4. Push your branch

```bash
git push origin feature/new-feature
```

5. Open a Pull Request

---

# 📜 License

Licensed under the **MIT License**.

---

# 👨‍💻 Built With

- ❤️ React
- ⚡ Vite
- 🟦 TypeScript
- 🗄 PostgreSQL
- 🌿 Drizzle ORM
- 🔐 Clerk
- 🤖 Google Gemini (planned integration)

---

<div align="center">

### ⭐ If you found this project useful, consider giving it a star!

**Made with ❤️ for students and lifelong learners.**

</div>