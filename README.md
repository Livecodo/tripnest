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

## 📄 License

MIT — feel free to fork and build on top of TripNest.

---

<p align="center">Built with ❤️ using React, Insforge & Cloudflare R2</p>
