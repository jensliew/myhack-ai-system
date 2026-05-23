# Nexora — AI-Powered Ecosystem Intelligence

> Connect startups with mentors through AI-powered relationship intelligence, verification, and engagement analytics.

Nexora is a full-stack platform that transforms how innovation ecosystems manage mentor-startup relationships. It uses **Google Gemini AI** to automate matching, verify applications, analyze meeting minutes, and track engagement — replacing manual coordination with intelligent, scalable workflows.

---

## Key Features

### AI-Powered Mentor Matching
- Tiered recommendations: Previous Collaborations → AI Suggested → Expressed Interest
- Compatibility scoring with AI-generated reasoning
- Human-in-the-loop: startups make the final decision

### AI Application Verification
- Automated profile analysis for startups and mentors
- Completeness assessment, industry classification, and improvement suggestions
- Admin reviews AI recommendation (approve / reject / needs review) before deciding

### Document Intelligence
- Upload meeting minutes and monthly reports
- Gemini extracts engagement scores, key topics, and action items
- Automatically updates relationship metrics and mentor engagement scores

### Mentor Discovery Marketplace
- Browse, search, and filter startups by industry, stage, and funding
- Express interest with one click — startups get notified
- Color-coded industry badges and stage indicators

### Relationship Lifecycle Tracking
- Three phases: Initial (Matching) → Processing (Active) → Final (Feedback)
- Engagement scoring, meeting count tracking, and progress visualization
- Milestone tracking and feedback collection

### Admin Analytics Dashboard
- Ecosystem-wide metrics: users, relationships, engagement
- AI verification workflow with pending application queue
- User management and relationship monitoring

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, TypeScript |
| Styling | Tailwind CSS 4, shadcn/ui, Lucide Icons |
| State | Zustand |
| Auth & DB | Firebase Auth, Firestore, Firebase Storage |
| AI | Google Gemini API (via Express backend) |
| Fonts | DM Sans (body), Space Grotesk (headings) |
| Testing | Vitest, Testing Library, fast-check |

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│                  Next.js Frontend                │
│         (React 19 + Tailwind + shadcn/ui)       │
├─────────────────────────────────────────────────┤
│  API Routes (/api/ai/*)  │  Firebase SDK        │
├──────────────────────────┼──────────────────────┤
│  Express AI Backend      │  Firestore           │
│  (Gemini API + Modules)  │  Firebase Storage    │
│  Port 3001               │  Firebase Auth       │
└──────────────────────────┴──────────────────────┘
```

**AI Backend Modules:**
- `matching.js` — Mentor-startup compatibility scoring
- `tiered-matching.js` — Multi-tier recommendation engine
- `meeting-minutes-analysis.js` — Engagement extraction from meetings
- `monthly-report-analysis.js` — Progress and health assessment
- `startup-verification.js` — Application profile analysis
- `mentor-verification.js` — Credential and expertise verification

---

## Getting Started

### Prerequisites
- Node.js 18+
- Firebase project with Auth, Firestore, and Storage enabled
- Google Gemini API key

### 1. Install dependencies

```bash
npm install
cd ai-backend && npm install
```

### 2. Configure environment

Copy `.env.local.example` to `.env.local` and fill in your Firebase config:

```bash
cp .env.local.example .env.local
```

For the AI backend, copy `ai-backend/.env` and add your Gemini API key:

```
GEMINI_API_KEY=your_key_here
```

### 3. Seed mock data (optional)

```bash
npx tsx scripts/seed-mock-data.ts
```

This creates 5 startup accounts and 5 mentor accounts with profiles. Password for all: `password123`

### 4. Run the development servers

```bash
# Terminal 1 — Next.js frontend
npm run dev

# Terminal 2 — AI backend
npm run dev:ai
```

- Frontend: [http://localhost:3000](http://localhost:3000)
- AI Backend: [http://localhost:3001](http://localhost:3001)

---

## User Roles

| Role | Email (seeded) | Features |
|------|---------------|----------|
| **Admin** | — | AI verification, analytics, user management, relationship monitoring |
| **Startup** | startup1@nexora.test | AI mentor recommendations, document uploads, mentor selection, progress tracking |
| **Mentor** | mentor1@nexora.test | AI matching, startup discovery, express interest, relationship management |

---

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/             # Login & Register
│   ├── (dashboard)/        # Role-based dashboards
│   │   ├── admin/          # Admin pages
│   │   ├── mentor/         # Mentor pages
│   │   └── startup/        # Startup pages
│   └── api/                # API routes (AI proxy)
├── components/             # Shared UI components
│   ├── cards/              # StartupCard, MentorCard
│   ├── charts/             # MetricCard, analytics
│   ├── layout/             # AppShell, Sidebar, Header
│   └── ui/                 # shadcn/ui primitives
├── hooks/                  # Custom React hooks
├── services/               # Business logic & API calls
├── firebase/               # Firebase config & collections
├── stores/                 # Zustand state stores
└── types/                  # TypeScript type definitions

ai-backend/
├── index.js                # Express server
├── modules/                # AI analysis modules
├── services/               # Data stores & utilities
└── data/                   # Collaboration history (JSON)
```

---

## Design System

- **Style**: Flat Design with Swiss Modernism influences
- **Colors**: Professional blue primary, with emerald, amber, rose, violet, and teal accents for semantic meaning
- **Typography**: Space Grotesk for headings (tech, modern), DM Sans for body (clean, readable)
- **Background**: Dot grid pattern with multi-color gradient orbs
- **Components**: Color-coded badges by industry/stage, colored metric cards, gradient AI banners
- **Accessibility**: WCAG AAA contrast, keyboard navigation, focus states, prefers-reduced-motion

---

## Screenshots

Screenshots are available in `/public/assets/ss/`.

---

## License

Private project — not for redistribution.
