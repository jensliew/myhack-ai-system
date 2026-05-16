# Nexora

**Turn ecosystem chaos into intelligent connections.**

Nexora is an AI-powered ecosystem relationship intelligence platform that automates mentor-startup matching, verification workflows, and engagement tracking for innovation ecosystems.

---

## Main Goal

To create a scalable AI-powered ecosystem operating system that continuously learns from ecosystem interactions to improve mentorship quality, ecosystem scalability, and innovation outcomes.

---

## Objectives

- Automate mentor-startup relationship discovery using AI
- Build reusable ecosystem intelligence from behavioral data
- Reduce manual ecosystem coordination for programme administrators
- Improve mentorship quality through AI-powered compatibility scoring
- Track ecosystem engagement outcomes with real-time analytics
- Enable scalable ecosystem operations across programmes and regions
- Personalize ecosystem recommendations based on interaction history

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16 (App Router), TypeScript, Tailwind CSS v4, shadcn/ui |
| State Management | Zustand v5 |
| Authentication | Firebase Authentication (Email/Password) |
| Database | Cloud Firestore |
| File Storage | Firebase Storage |
| AI Engine | Google Gemini API (gemma-4-31b-it) |
| Testing | Vitest, React Testing Library, fast-check |
| Deployment | Vercel (planned) |

---

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Next.js App (Browser)                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐ │
│  │    UI    │  │  Zustand  │  │  Hooks   │  │Services│ │
│  │(shadcn)  │  │  Stores   │  │          │  │        │ │
│  └──────────┘  └──────────┘  └──────────┘  └────────┘ │
└───────────────────────┬─────────────────────────────────┘
                        │
          ┌─────────────┼─────────────┐
          │             │             │
          ▼             ▼             ▼
┌──────────────┐ ┌───────────┐ ┌──────────────┐
│   Firebase   │ │  Firebase │ │   Firebase   │
│     Auth     │ │ Firestore │ │   Storage    │
└──────────────┘ └───────────┘ └──────────────┘
                        │
                        ▼
          ┌──────────────────────────┐
          │  Next.js Route Handlers  │
          │   (AI Proxy - Server)    │
          └────────────┬─────────────┘
                       │
                       ▼
              ┌─────────────────┐
              │   Gemini API    │
              │ (gemma-4-31b-it)│
              └─────────────────┘
```

**Key architectural decisions:**
- Client-side Firebase SDK for all Firestore/Auth/Storage operations
- Next.js Route Handlers as server-side proxy for AI calls (protects API key)
- No Firebase Cloud Functions — all logic runs client-side or in Route Handlers
- Cookie-based session for route protection via Next.js proxy (middleware)
- Zustand stores for client-side state management

---

## Role-Based Features

### Startup

| Feature | Description |
|---------|-------------|
| Registration | Self-register with email/password, select startup role |
| Profile Management | Set startup name, industry, stage, funding, goals, description |
| AI Mentor Recommendations | Receive AI-generated mentor suggestions with compatibility scores and reasoning |
| Mentors Interested | View mentors who expressed interest in your startup |
| Accept/Reject Mentors | Accept or reject mentors from both AI suggestions and interested sections |
| Active Relationships | View and manage active mentorship relationships |
| Document Management | Upload meeting minutes, monthly reports with public/private visibility |

### Mentor

| Feature | Description |
|---------|-------------|
| Registration | Self-register with email/password, select mentor role |
| Profile Management | Set name, expertise, industry specialization, availability, bio |
| Startup Discovery | Browse, search, and filter startups by industry, stage, funding |
| Express Interest | Click "Interested" on startups with confirmation dialog |
| Active Relationships | View active mentorship engagements with startups |

### Admin

| Feature | Description |
|---------|-------------|
| Application Review | View pending applications with AI verification summaries |
| AI Verification | Run Gemini-powered analysis on startup/mentor profiles |
| Approve/Reject | Make final decisions on applications |
| Ecosystem Analytics | Dashboard with growth metrics, charts, and engagement data |
| User Management | View all users with role and status filtering |

---

## Features

### AI-Assisted Mentor-Startup Matching
- Hybrid matching: AI recommendations + organic mentor interest
- Gemini API generates compatibility scores (0-100%) with explainable reasoning
- Startup has final authority over mentor selection (human-in-the-loop)
- System learns from accepts/rejects to improve future recommendations

### AI Verification System
- Automated profile analysis for new applications
- AI extracts and evaluates: completeness, industry classification, legitimacy
- Generates recommendation: approve, reject, or pending review
- Admin reviews AI report and makes final decision

### Behavioral Learning
- Tracks all interactions: interested clicks, accepts, rejects, profile views
- Stores engagement history in Firestore for AI learning
- Recommendations improve over time based on historical patterns

### Document Management
- Upload meeting minutes, monthly reports, general documents
- Public/private visibility controls
- Firebase Storage with 10MB file size limit
- Accessible to relevant parties based on visibility settings

### Ecosystem Analytics (Admin)
- Real-time metrics: total startups, mentors, active mentorships, pending applications
- Growth charts, match rate visualization, engagement scores
- Industry and stage distribution breakdowns
- Recent activity feed

### Route Protection
- Cookie-based authentication via Next.js proxy
- Role-based access control (admin, startup, mentor)
- Unauthenticated users redirected to login
- Role mismatch redirected to correct dashboard

---

## Database Schema

**Firestore Collections:**

| Collection | Purpose |
|-----------|---------|
| `users` | User accounts with role, entityId, profileStatus |
| `startups` | Startup profiles (name, industry, stage, goals, etc.) |
| `mentors` | Mentor profiles (expertise, availability, success rate, etc.) |
| `mentor_interests` | Records of mentors expressing interest in startups |
| `relationships` | Active mentor-startup pairings |
| `documents` | File metadata with visibility controls |
| `feedback` | Mentorship feedback and ratings |
| `ai_recommendations` | AI-generated mentor suggestions with scores |
| `engagement_history` | All user interactions for behavioral learning |

---

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Login, Register pages
│   ├── (dashboard)/       # Protected dashboard pages
│   │   ├── admin/         # Admin pages
│   │   ├── startup/       # Startup pages
│   │   └── mentor/        # Mentor pages
│   └── api/ai/            # Route Handlers (AI proxy)
├── components/            # Reusable UI components
│   ├── layout/            # AppShell, Sidebar, Header
│   ├── cards/             # StartupCard, MentorCard
│   ├── charts/            # MetricCard, chart components
│   └── landing/           # Landing page components
├── services/              # Business logic
│   ├── firebase/          # Auth, Firestore, engagement services
│   ├── ai/                # Recommendations, verification clients
│   ├── matching/          # Interest, accept/reject services
│   └── documents/         # File upload/management
├── firebase/              # Firebase config and collection refs
├── ai/                    # AI config and prompt templates
├── hooks/                 # Custom React hooks
├── stores/                # Zustand stores
├── types/                 # TypeScript type definitions
└── lib/                   # Utilities, validators, formatters
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- Firebase project with Auth, Firestore, and Storage enabled
- Gemini API key from Google AI Studio

### Setup

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.local.example .env.local
# Fill in your Firebase and Gemini API credentials

# Seed mock data (optional)
npx tsx --env-file=.env.local scripts/seed-mock-data.ts

# Run development server
npm run dev
```

### Environment Variables

```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
GEMINI_API_KEY=
```

---

## Future Plan

### Phase 2 — Enhanced AI
- [ ] AI-powered engagement scoring based on uploaded meeting minutes
- [ ] Relationship health prediction using behavioral patterns
- [ ] Automated mentorship progress reports
- [ ] AI chatbot assistant for ecosystem queries

### Phase 3 — Scalability
- [ ] Multi-programme support (multiple ecosystems in one platform)
- [ ] Real-time messaging between mentors and startups
- [ ] Notification system (email + in-app)
- [ ] Relationship graph visualization

### Phase 4 — Intelligence
- [ ] Predictive analytics for mentorship outcomes
- [ ] Ecosystem intelligence reports (auto-generated)
- [ ] Mentor performance scoring and leaderboards
- [ ] Cross-ecosystem collaboration recommendations

### Phase 5 — Enterprise
- [ ] White-label deployment for ecosystem operators
- [ ] API access for third-party integrations
- [ ] Advanced admin controls and audit logs
- [ ] SSO and enterprise authentication

---

## License

MIT

---

Built with AI-powered development using Kiro.
