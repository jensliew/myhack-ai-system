# Nexora

**Turn ecosystem chaos into intelligent connections.**

Nexora is an AI-powered ecosystem relationship intelligence platform that automates mentor-startup matching, verification workflows, and engagement tracking for innovation ecosystems.

---

## Demo & Screenshots

### Landing Page
![Landing Page](public/assets/ss/Screenshot%202026-05-17%20at%201.45.53%E2%80%AFAM.png)

### Registration
![Registration](public/assets/ss/Screenshot%202026-05-17%20at%201.46.00%E2%80%AFAM.png)

### Login
![Login](public/assets/ss/Screenshot%202026-05-17%20at%201.46.10%E2%80%AFAM.png)

### Startup Dashboard — AI Mentor Matching
![Startup Dashboard](public/assets/ss/Screenshot%202026-05-17%20at%201.47.29%E2%80%AFAM.png)

### Mentor Dashboard — Startup Discovery
![Mentor Dashboard](public/assets/ss/Screenshot%202026-05-17%20at%201.47.57%E2%80%AFAM.png)

### Mentor — Express Interest Confirmation
![Interest Confirmation](public/assets/ss/Screenshot%202026-05-17%20at%201.48.02%E2%80%AFAM.png)

### Startup — Mentors Interested Section
![Mentors Interested](public/assets/ss/Screenshot%202026-05-17%20at%201.48.09%E2%80%AFAM.png)

### Admin — AI Verification
![AI Verification](public/assets/ss/Screenshot%202026-05-17%20at%201.49.16%E2%80%AFAM.png)

### Admin — Analytics Dashboard
![Analytics](public/assets/ss/Screenshot%202026-05-17%20at%202.24.39%E2%80%AFAM.png)

### Profile Management
![Profile](public/assets/ss/Screenshot%202026-05-17%20at%202.30.33%E2%80%AFAM.png)

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
| AI Engine | Google Gemini API (gemma-4-31b-it) via dedicated Express backend |
| AI Backend | Express.js (rule-based matching + Gemini-powered explanations) |
| Testing | Vitest, React Testing Library, fast-check |
| Deployment | Vercel (frontend) + Railway/Render (AI backend) |

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│              Next.js App (Browser - Port 3000)                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐ │
│  │    UI    │  │  Zustand  │  │  Hooks   │  │  Services  │ │
│  │(shadcn)  │  │  Stores   │  │          │  │            │ │
│  └──────────┘  └──────────┘  └──────────┘  └────────────┘ │
└───────────────────────┬──────────────────────┬──────────────┘
                        │                      │
          ┌─────────────┼──────────┐           │
          │             │          │           │
          ▼             ▼          ▼           ▼
┌──────────────┐ ┌───────────┐ ┌────────┐ ┌──────────────────┐
│   Firebase   │ │  Firebase │ │Firebase│ │  Next.js Route   │
│     Auth     │ │ Firestore │ │Storage │ │    Handlers      │
└──────────────┘ └───────────┘ └────────┘ │  (AI Proxy)      │
                                           └────────┬─────────┘
                                                    │
                                                    ▼
                                    ┌──────────────────────────┐
                                    │   AI Backend (Port 3001) │
                                    │   Express.js Server      │
                                    │                          │
                                    │  • Tiered Matching       │
                                    │  • Verification          │
                                    │  • Document Analysis     │
                                    │  • Score Calculation     │
                                    │  • Gemini API Calls      │
                                    └──────────────────────────┘
```

**Key architectural decisions:**
- Client-side Firebase SDK for all Firestore/Auth/Storage operations
- Dedicated Express AI backend for matching logic and Gemini API calls
- Next.js Route Handlers as proxy between frontend and AI backend
- Cookie-based session for route protection via Next.js proxy
- Tiered recommendation system: previous collaborations → AI suggested → interested mentors
- Rule-based scoring with optional Gemini-powered explanations

---

## Role-Based Features

### Startup

| Feature | Description |
|---------|-------------|
| Registration | Self-register with email/password, select startup role |
| Profile Management | Set startup name, industry, stage, funding, goals, description |
| AI Mentor Recommendations | Tiered recommendations: past collaborations, AI-suggested, interested mentors |
| Mentors Interested | View mentors who expressed interest in your startup |
| Accept/Reject Mentors | Accept or reject mentors from any section |
| Active Relationships | View and manage active mentorship relationships with engagement scores |
| Document Management | Upload meeting minutes, monthly reports with public/private visibility |
| Project Progress | Track mentorship lifecycle phases (Initial → Processing → Feedback) |

### Mentor

| Feature | Description |
|---------|-------------|
| Registration | Self-register with email/password, select mentor role |
| Profile Management | Set name, expertise, industry specialization, availability, bio |
| Startup Discovery | Browse, search, and filter startups by industry, stage, funding |
| AI Startup Matching | Tiered startup recommendations based on expertise alignment |
| Express Interest | Click "Interested" on startups with confirmation dialog explaining the flow |
| Active Relationships | View active mentorship engagements with startups |

### Admin

| Feature | Description |
|---------|-------------|
| Application Review | View pending applications with AI verification summaries |
| AI Verification | Gemini-powered profile analysis with approve/reject/pending recommendations |
| Approve/Reject | Make final decisions on applications with recorded timestamps |
| Ecosystem Analytics | Dashboard with growth charts, match rates, engagement metrics |
| User Management | View all users with role and status filtering |
| Industry & Stage Breakdown | Visual distribution of ecosystem composition |

---

## Core Features

### AI-Assisted Tiered Matching
- **Previous Collaborations**: Mentors/startups with past successful relationships shown first
- **AI Suggested**: Rule-based compatibility scoring with optional Gemini explanations
- **Interested**: Organic interest expressions from the other party
- Startup has final authority over mentor selection (human-in-the-loop)
- System learns from accepts/rejects to improve future recommendations

### AI Verification System
- Automated profile analysis using Gemini API
- Evaluates: completeness, industry classification, legitimacy, experience depth
- Generates structured recommendation: approve, reject, or pending review
- Admin reviews AI report and makes final decision
- Separate verification logic for startups vs mentors

### Behavioral Learning & Engagement
- Tracks all interactions: interested clicks, accepts, rejects, profile views
- Stores engagement history in Firestore for AI learning
- Engagement scores calculated from meeting frequency and document uploads
- Project progress tracking through mentorship lifecycle phases

### Document Management & AI Analysis
- Upload meeting minutes and monthly reports
- AI-powered document analysis (meeting summaries, progress extraction)
- Public/private visibility controls
- Firebase Storage with 10MB file size limit

### Ecosystem Analytics (Admin)
- Real-time metrics: total startups, mentors, active mentorships, pending applications
- Monthly registration charts (startups vs mentors)
- Mentorship outcome progress bars (match acceptance, interest rate, engagement)
- Industry and stage distribution breakdowns
- Recent activity feed

### Route Protection & Authentication
- Cookie-based authentication via Next.js proxy
- Role-based access control (admin, startup, mentor)
- Role badge in sidebar for clear role identification
- Profile completion guideline banner for new users

---

## Database Schema

**Firestore Collections:**

| Collection | Purpose |
|-----------|---------|
| `users` | User accounts with role, entityId, profileStatus |
| `startups` | Startup profiles (name, industry, stage, goals, etc.) |
| `mentors` | Mentor profiles (expertise, availability, success rate, etc.) |
| `mentor_interests` | Records of mentors expressing interest in startups |
| `relationships` | Active mentor-startup pairings with engagement scores |
| `documents` | File metadata with visibility controls |
| `feedback` | Mentorship feedback and ratings |
| `ai_recommendations` | AI-generated mentor suggestions with scores and reasoning |
| `engagement_history` | All user interactions for behavioral learning |

---

## Project Structure

```
├── src/                        # Next.js frontend application
│   ├── app/                    # App Router pages
│   │   ├── (auth)/            # Login, Register
│   │   ├── (dashboard)/       # Protected dashboards (admin/startup/mentor)
│   │   └── api/ai/            # Route Handlers (AI proxy to backend)
│   ├── components/            # UI components
│   │   ├── cards/             # StartupCard, MentorCard
│   │   ├── charts/            # MetricCard, analytics
│   │   ├── landing/           # FeatureCarousel, HeroMockup, HeroAnalytics
│   │   └── layout/            # AppShell, Sidebar, Header
│   ├── services/              # Business logic
│   │   ├── ai/                # Recommendation & verification clients
│   │   ├── firebase/          # Auth, Firestore, engagement services
│   │   ├── matching/          # Interest, accept/reject services
│   │   └── documents/         # File upload/management
│   ├── firebase/              # Firebase config and typed collection refs
│   ├── ai/                    # AI config and prompt templates
│   ├── hooks/                 # Custom React hooks
│   ├── stores/                # Zustand stores (auth, UI, matching)
│   ├── types/                 # TypeScript type definitions
│   ├── lib/                   # Utilities, validators, AI backend client
│   ├── providers/             # Auth context provider
│   └── proxy.ts               # Route protection (Next.js 16 middleware)
│
├── ai-backend/                 # Express.js AI service (Port 3001)
│   ├── modules/               # AI logic modules
│   │   ├── tiered-matching.js         # Tiered recommendation engine
│   │   ├── matching.js                # Core matching algorithms
│   │   ├── match-explanation.js       # AI reasoning generation
│   │   ├── startup-verification.js    # Startup profile verification
│   │   ├── mentor-verification.js     # Mentor profile verification
│   │   ├── verification-reasoning.js  # Verification explanation logic
│   │   ├── documents.js               # Document processing
│   │   ├── meeting-minutes-analysis.js # Meeting minutes AI analysis
│   │   └── monthly-report-analysis.js  # Monthly report AI analysis
│   ├── services/              # Data stores and utilities
│   ├── data/                  # Sample profiles for development
│   └── index.js               # Express server entry point
│
├── scripts/                    # Utility scripts
│   └── seed-mock-data.ts      # Seed Firestore with test data
│
├── firestore.rules            # Firestore security rules
├── firestore.indexes.json     # Firestore composite indexes
└── public/assets/             # Static assets and screenshots
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- Firebase project with Auth, Firestore, and Storage enabled
- Gemini API key from Google AI Studio

### Setup

```bash
# Install frontend dependencies
npm install

# Install AI backend dependencies
cd ai-backend && npm install && cd ..

# Copy environment variables
cp .env.local.example .env.local
# Fill in your Firebase and Gemini API credentials

# Create AI backend env
echo "GEMINI_API_KEY=your_key_here" > ai-backend/.env

# Seed mock data (optional)
npx tsx --env-file=.env.local scripts/seed-mock-data.ts

# Start AI backend (Terminal 1)
cd ai-backend && npm start

# Start Next.js dev server (Terminal 2)
npm run dev
```

### Environment Variables

```env
# .env.local (Next.js)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
GEMINI_API_KEY=
USE_AI_BACKEND=true

# ai-backend/.env
GEMINI_API_KEY=
PORT=3001
```

### Mock Accounts (after seeding)

**Password for all: `password123`**

| Email | Role | Name |
|-------|------|------|
| startup1@nexora.test | Startup | FinPay Solutions |
| startup2@nexora.test | Startup | EduVerse |
| startup3@nexora.test | Startup | GreenLogix |
| mentor1@nexora.test | Mentor | Sarah Chen |
| mentor2@nexora.test | Mentor | David Park |
| mentor3@nexora.test | Mentor | Lisa Wong |

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
