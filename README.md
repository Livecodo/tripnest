# 🧳 TripNest

> **Collaborative travel media vault** — share, relive, and organise trip memories together in real-time.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Visit%20Site-cyan?style=for-the-badge&logo=vercel)](https://em6ahb8c.insforge.site/#/auth)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=for-the-badge&logo=vite)](https://vitejs.dev)

---

## 🌍 Live Preview

**👉 [https://em6ahb8c.insforge.site](https://em6ahb8c.insforge.site)**

No installation required — anyone can open the link and sign up for free.

---

## ✨ Features

- **📁 Trip Vaults** — Create a shared vault for each trip; invite friends and family via a unique link
- **📸 Media Uploads** — Upload photos and videos directly to Cloudflare R2 (fast, global CDN)
- **🤝 Collaborators** — Invite others to contribute their own media to a shared vault
- **🔍 Lightbox Viewer** — Full-screen media viewer with smooth animations and navigation
- **🤖 AI Highlights** — AI-powered trip summary and media tagging using OpenRouter
- **🔐 Authentication** — Sign up / log in powered by Insforge Auth
- **📱 Responsive** — Works on desktop and mobile

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite |
| Styling | Tailwind CSS, Framer Motion |
| Backend / Auth / DB | [Insforge](https://insforge.com) |
| Media Storage | Cloudflare R2 |
| AI | OpenRouter API |
| State Management | Zustand |
| Routing | React Router v6 (Hash Router) |
| Icons | Lucide React |

---

## 🚀 Getting Started (Local Development)

### Prerequisites

- Node.js 18+
- A free [Insforge](https://insforge.com) account
- A [Cloudflare](https://cloudflare.com) account with an R2 bucket
- An [OpenRouter](https://openrouter.ai) API key (for AI features)

### 1. Clone the repo

```bash
git clone https://github.com/Livecodo/tripnest.git
cd tripnest
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

```bash
cp .env.example .env
```

Then fill in your values in `.env`:

```env
# Insforge (Backend + Auth)
VITE_INSFORGE_BASE_URL=https://your-project-id.us-east.insforge.app
VITE_INSFORGE_ANON_KEY=your-insforge-anon-key

# Cloudflare R2 (Media Storage)
VITE_R2_PUBLIC_URL=https://pub-XXXXXXXXXXXXXX.r2.dev
R2_ACCOUNT_ID=your-cloudflare-account-id
R2_ACCESS_KEY_ID=your-r2-access-key-id
R2_SECRET_ACCESS_KEY=your-r2-secret-access-key
R2_BUCKET_NAME=your-bucket-name

# AI Helper
OPENROUTER_API_KEY=your-openrouter-api-key
```

### 4. Start the dev server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## 📁 Project Structure

```
src/
├── pages/
│   ├── LandingPage.tsx      # Public landing / marketing page
│   ├── AuthPages.tsx        # Sign up & log in
│   ├── Dashboard.tsx        # User's trip vault overview
│   └── TripDetails.tsx      # Individual trip vault with media
├── components/
│   ├── UploadZone.tsx       # Drag-and-drop media uploader
│   ├── Lightbox.tsx         # Full-screen media viewer
│   ├── CreateTripModal.tsx  # New trip creation dialog
│   └── CollaboratorsModal.tsx # Manage collaborators
├── store/
│   └── useStore.ts          # Zustand global state
├── lib/
│   └── r2.ts                # Cloudflare R2 client
└── App.tsx                  # Routes & layout
```

---

## 🔗 Invite Links

TripNest supports shareable invite links. When someone visits:

```
https://em6ahb8c.insforge.site/#/join/<invite-code>
```

They are automatically added as a collaborator to the trip after signing in.

---

## ⚠️ Prototype Status

> **This project is a working prototype.** It demonstrates the core concept and is live for preview, but is **not yet production-ready**. The sections below outline what would need to be addressed before a real-world deployment.

---

## 🗺️ Production Roadmap

### 🔐 Security & Authentication
- [ ] **Email verification** — users can currently sign up without verifying their email address
- [ ] **Password strength enforcement** — no minimum complexity rules on registration
- [ ] **Rate limiting on auth endpoints** — brute-force protection for sign-in/sign-up
- [ ] **Session expiry & refresh token rotation** — long-lived sessions are a security risk
- [ ] **Row-Level Security (RLS) audit** — ensure database policies prevent cross-vault data leaks
- [ ] **Invite code expiry** — invite codes (`Math.random()` 6-char strings) never expire and have no revocation mechanism

### 📁 Storage & Uploads
- [ ] **Per-user storage quota** — no limit on how many files a user can upload; could exhaust R2 budget
- [ ] **Server-side file type validation** — only client-side MIME checks exist; the edge function should re-validate before issuing signed URLs
- [ ] **Video thumbnail generation** — videos have no thumbnail (`thumbnail_url: null`); a serverless worker (e.g. Cloudflare Worker + ffmpeg) should auto-generate one
- [ ] **Image dimensions accuracy** — width/height are hardcoded to `800×600` and `1920×1080` fallbacks instead of reading actual image metadata
- [ ] **Orphaned file cleanup** — if the DB insert fails after R2 upload succeeds, the file stays in R2 forever with no reference; needs a reconciliation job
- [ ] **R2 CORS policy review** — presigned PUT URLs are open; should be scoped to specific origins in production

### 🏗️ Architecture & Code Quality
- [ ] **`any` types** — `useStore.ts` uses `/* eslint-disable @typescript-eslint/no-explicit-any */` throughout; all `any` should be replaced with proper types
- [ ] **Invite code collision** — `Math.random().toString(36).substring(2, 8)` has no uniqueness guarantee at scale; use UUID or check-before-insert
- [ ] **Notification persistence** — notifications are stored in `localStorage` only; lost on new devices / private browsing; needs a `notifications` DB table
- [ ] **Ping interval leak** — `_tripnestPingInterval` is stored on `window`; multiple vault navigations could leak intervals if cleanup isn't called correctly
- [ ] **OpenRouter API key in client** — the AI key is stored in `localStorage` and sent from the browser; should be proxied through a server-side edge function
- [ ] **Error boundaries** — no React `ErrorBoundary` components; a single component crash takes down the whole page
- [ ] **Loading skeletons** — most data fetches show no loading state; users see blank screens during slow connections

### 🧪 Testing
- [ ] **Unit tests** — no test suite exists (`jest`, `vitest`, or similar)
- [ ] **Integration tests** — no end-to-end tests (e.g. Playwright or Cypress)
- [ ] **CI pipeline** — no GitHub Actions workflow for lint, type-check, or tests on pull requests

### 📈 Scalability & Observability
- [ ] **Logging & monitoring** — errors are only `console.error`; no Sentry, Datadog, or similar
- [ ] **Pagination** — all media is fetched in a single query (`.select('*')`); large vaults will be slow and expensive
- [ ] **Search & filtering** — no ability to search or filter media within a vault
- [ ] **Analytics** — no usage tracking to understand feature adoption

### 🌍 Compliance & UX
- [ ] **GDPR / data deletion** — no account deletion flow; no data export
- [ ] **Accessibility (a11y)** — keyboard navigation and ARIA labels not fully implemented
- [ ] **Offline support / PWA** — app fails silently on network loss; no service worker
- [ ] **Mobile app** — Capacitor is installed as a dependency but not configured or built

---

## ✅ What's Already Production-Quality

Despite being a prototype, several things are well-implemented:

- **Client-side image compression** — WebP conversion + thumbnail generation before upload ✅
- **Concurrent upload queue** — max 3 parallel uploads with retry support ✅
- **Real-time collaboration** — WebSocket presence, upload/delete/reaction events ✅
- **Role-based vault membership** — `owner / admin / contributor / viewer` roles defined ✅
- **Cascading deletes** — deleting a trip cleans up R2 storage and DB records ✅
- **Signed upload URLs** — files go directly to R2 via presigned PUT, not through the server ✅

---

## 📄 License

MIT — feel free to fork and build on top of TripNest.

---

<p align="center">Built with ❤️ using React, Insforge & Cloudflare R2</p>
