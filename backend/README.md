# TAB Backend (Take-A-Breath)

This is the Express + TypeScript + Prisma + Socket.io backend codebase for the TAB platform.

---

## Technical Stack
- **Web API**: Express.js
- **Database Access**: Prisma ORM (mapped to PostgreSQL)
- **Real-Time messaging**: Socket.io (Socket namespace client-handling)
- **Development**: TypeScript via `tsx` compiler-runner

---

## Folder Architecture

```
backend/
├── prisma/
│   └── schema.prisma         # Prisma Schema models (Profile, Bounty, Report, Chat)
├── src/
│   ├── app.ts                # Express application configuration
│   ├── index.ts              # Entrypoint server boots HTTP and Socket listeners
│   ├── config/
│   │   ├── database.ts       # Database client connection config
│   │   └── env.ts            # Environment parameters loader
│   ├── routes/               # API Router endpoints mapping (/auth, /bounties, /chats)
│   └── services/             # Socket connection handlers
└── .env.example              # Env template configurations
```

---

## Setup & Running Locally

### 1. Configure Environment
Copy `.env.example` to `.env` and fill in your connection details:
```bash
cp .env.example .env
```

### 2. Install Packages
Make sure Node.js is installed, then run:
```bash
npm install
```

### 3. Setup Database & Prisma Client
Ensure PostgreSQL is running and your `DATABASE_URL` is set in `.env`.
Generate the Prisma Client client-side files:
```bash
npm run prisma:generate
```

To initialize your database tables based on the schema, run Prisma migrations:
```bash
npx prisma db push
```
*(This maps Prisma structures directly to the database tables without setting up historical migrations, ideal for rapid initial SaaS prototypes)*

### 4. Run Development Server
Boot the live reloading development server:
```bash
npm run dev
```
The server will start on port `5000` by default. You can inspect the health check at `http://localhost:5000/api/status`.

### 5. Build for Production
To compile typescript source files into production-ready Javascript:
```bash
npm run build
npm run start
```
