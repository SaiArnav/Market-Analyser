# MarketAutopsy AI

> AI-powered market intelligence platform for evidence-led company monitoring.

MarketAutopsy runs on-demand deep research on companies using public signals across **news, hiring, patents, customer sentiment, leadership changes, funding activity, product launches, and strategic market signals**. It combines real-time data collection with GPT-5.6 and Codex analysis to produce explainable risk scores and actionable intelligence.

Built with **Next.js 14 (App Router)**, **Prisma**, **PostgreSQL**, **Tailwind CSS**, **Framer Motion**, **Three.js**, and **Recharts**.

---

## Features

### Landing Page
- Immersive dark-themed hero with WebGL neural-network shader background
- Three.js 3D brain wireframe with orbiting particle system
- Animated workflow cards (signal sourcing, causal inference, risk modeling)
- Core Engines bento grid showcasing AI capabilities
- Trust section, CTA section, and responsive dark footer

### Authentication
- Email/password signup and login with bcrypt hashing
- Cookie-based sessions with httpOnly + sameSite protection
- Per-user data isolation (each user sees only their companies)
- Account page with session management

### Dashboard / Watchlist
- Glass-panel metric cards (total signals, risk score, opportunities, sources)
- Company watchlist grid with risk score indicators and signal counts
- Industry heatmap table with signal breakdowns
- Quick-action buttons (view workspace, run research, add company)

### Company Workspace
- Intelligence workspace with company overview and risk score gauge
- Explainable score breakdown with color-coded bars (hiring, sentiment, patents, news, funding, etc.)
- AI Executive Summary with evidence-based reasoning
- Risk trend line chart (powered by Recharts)
- AI predictions with confidence scoring and linked evidence
- Strategic opportunities with impact labeling
- Empty state with "Start with evidence." onboarding and three explainer cards
- Signals tab with type filtering, detection dates, and source links
- Timeline tab with chronological event tracking and impact-weighted dots
- Strategy report card with AI-generated recommendations

### Opportunity Explorer
- Category filter toggles (hiring, news, patent, sentiment, leadership, funding, product)
- Opportunity cards with signal description, AI rationale, evidence sources
- Direct links to evidence URLs

### Add Company
- Form with company details (name, industry, website, founded year, housing board tokens)
- Animated visualization panel showing AI reasoning agents
- Real-time connection lines and pulsing agent status cards

### Automated Monitoring
- Daily cron job (8 AM UTC) via Vercel Cron to refresh all company scores
- Configurable notification threshold for score changes
- Slack webhook and email (Resend) alert integrations

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 14 (App Router) |
| **Styling** | Tailwind CSS, CSS variables, inline styles |
| **Animation** | Framer Motion, CSS keyframes |
| **3D / Visuals** | Three.js, WebGL (RawShaderMaterial), Recharts |
| **Icons** | Lucide React |
| **Fonts** | Geist, Inter, Manrope, DM Mono |
| **Backend** | Next.js API routes (App Router) |
| **Database** | PostgreSQL (Neon) via Prisma ORM |
| **Auth** | bcryptjs, httpOnly cookies |
| **AI** | OpenAI GPT-5.6 / Codex for analysis, scoring, and report generation |

---

## Quick Start

```bash
# Install dependencies
npm install

# Set up database
cp .env.example .env.local
# Edit .env.local with your PostgreSQL connection string

# Push schema to database
npx prisma db push

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

Create a `.env.local` file in the project root:

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string (e.g. Neon, Supabase, Railway) |
| `OPENAI_API_KEY` | Yes | OpenAI API key for AI analysis and scoring |
| `CRON_SECRET` | Recommended | Secret to protect the cron endpoint from unauthorized access |
| `NEWSAPI_KEY` | No | NewsAPI key for news signal collection |
| `SLACK_WEBHOOK_URL` | No | Slack webhook URL for alert notifications |
| `RESEND_API_KEY` | No | Resend API key for email alert notifications |
| `NOTIFICATION_EMAIL` | No | Recipient email for alert notifications |

---

## Project Structure

```
├── app/
│   ├── add/
│   │   └── page.tsx              # Add company form with animated visualization
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login/route.ts    # Login endpoint
│   │   │   ├── logout/route.ts   # Logout endpoint
│   │   │   ├── me/route.ts       # Current user endpoint
│   │   │   └── signup/route.ts   # Signup endpoint
│   │   ├── companies/
│   │   │   ├── [id]/
│   │   │   │   ├── analyze/route.ts  # Run AI research on a company
│   │   │   │   ├── history/route.ts  # Score history
│   │   │   │   ├── report/route.ts   # Generate strategy report
│   │   │   │   └── route.ts          # Get/delete a company
│   │   │   └── route.ts              # List/create companies
│   │   ├── cron/
│   │   │   └── check/route.ts    # Vercel Cron daily refresh
│   │   └── health/route.ts       # Health check endpoint
│   ├── company/
│   │   └── [id]/
│   │       └── page.tsx          # Company workspace (overview, signals, timeline)
│   ├── dashboard/
│   │   └── page.tsx              # Watchlist dashboard with heatmap
│   ├── login/
│   │   └── page.tsx              # Login page
│   ├── signup/
│   │   └── page.tsx              # Signup page
│   ├── account/
│   │   └── page.tsx              # Account page
│   ├── opportunities/
│   │   └── page.tsx              # Opportunity explorer with filters
│   ├── globals.css               # Tailwind directives, custom classes, CSS variables
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Landing page
├── components/
│   ├── landing/
│   │   ├── hero.tsx              # Full landing page (hero, workflow, engines, footer)
│   │   ├── ShaderBackground.tsx  # WebGL neural-network fragment shader
│   │   └── BrainAnimation.tsx    # Three.js brain visualization
│   └── ui/
│       ├── AnimatedLogo.tsx      # Animated SVG logo component
│       └── DarkTopNav.tsx        # Shared dark pill-shaped navbar
├── lib/
│   ├── ai.ts                     # OpenAI integration for analysis
│   ├── collectors.ts             # Signal data collectors (GDELT, Greenhouse, etc.)
│   ├── db.ts                     # Prisma CRUD wrapper and auth helpers
│   ├── store.ts                  # In-memory data store and scoring engine
│   └── store.test.ts             # Store unit tests
├── prisma/
│   └── schema.prisma             # Database schema (PostgreSQL)
├── public/
│   └── images/
│       └── marketautopsy-logo.png
├── types.d.ts                    # Module declarations
├── vercel.json                   # Vercel deployment config with cron
├── tailwind.config.ts            # Custom dark palette and design tokens
├── next.config.mjs
├── postcss.config.mjs
└── package.json
```

---

## Data Sources

| Source | Type | Status |
|---|---|---|
| **GDELT** | Global news events | Automatic |
| **Greenhouse** | Job postings (via board token) | On token provided |
| **Lever** | Job postings (via company slug) | On slug provided |
| **PatentsView** | Patent filings | Automatic |
| **Reddit OAuth** | Sentiment analysis | Credential-gated |
| **NewsAPI** | News articles | API key required |
| **Product Hunt** | Product launches | Credential-gated |

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/signup` | Create account |
| `POST` | `/api/auth/login` | Login |
| `POST` | `/api/auth/logout` | Logout |
| `GET` | `/api/auth/me` | Current user |
| `GET` | `/api/companies` | List user's companies |
| `POST` | `/api/companies` | Add a company |
| `GET` | `/api/companies/[id]` | Get company details |
| `DELETE` | `/api/companies/[id]` | Delete a company |
| `POST` | `/api/companies/[id]/analyze` | Run AI research |
| `GET` | `/api/companies/[id]/history` | Score history |
| `POST` | `/api/companies/[id]/report` | Generate strategy report |
| `GET` | `/api/cron/check` | Daily refresh (Vercel Cron) |
| `GET` | `/api/health` | Health check |

---

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import repository in Vercel
3. Add `DATABASE_URL` environment variable (Neon, Supabase, or Railway PostgreSQL)
4. Add `OPENAI_API_KEY` environment variable
5. Deploy — `prisma db push` runs automatically during build

### Database

Any PostgreSQL-compatible database works:
- **Neon** (free tier) — recommended for getting started
- **Supabase** — free tier with PostgreSQL
- **Railway** — easy setup
- **Vercel Postgres** — integrated with Vercel

---

## License

Private / Internal use.
