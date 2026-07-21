# MarketAutopsy AI

> AI-powered market intelligence platform for evidence-led company monitoring.

MarketAutopsy runs on-demand deep research on companies using public signals across **news, hiring, patents, customer sentiment, leadership changes, funding activity, product launches, and strategic market signals**. It combines real-time data collection with GPT-5.6, Codex analysis to produce explainable risk scores and actionable intelligence.

Built with **Next.js 14 (App Router)**, **Tailwind CSS**, **Framer Motion**, **Three.js**, and **Recharts**.

---

## Features

### Landing Page
- Immersive dark-themed hero with WebGL neural-network shader background
- Three.js 3D brain wireframe with orbiting particle system
- Animated workflow cards (signal sourcing, causal inference, risk modeling)
- Core Engines bento grid showcasing AI capabilities
- Trust section, CTA section, and responsive dark footer

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
| **Database** | In-memory (file-backed JSON on disk) |
| **AI** | OpenAI GPT-5.6 for analysis, scoring, and report generation |

---

## Quick Start

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

Create a `.env.local` file in the project root:

| Variable | Required | Description |
|---|---|---|
| `OPENAI_API_KEY` | Yes | OpenAI API key for AI analysis and scoring |
| `NEWSAPI_KEY` | No | NewsAPI key for news signal collection |

---

## Project Structure

```
├── app/
│   ├── add/
│   │   └── page.tsx          # Add company form with animated visualization
│   ├── api/
│   │   ├── companies/
│   │   │   ├── [id]/
│   │   │   │   ├── analyze/route.ts   # Run AI research on a company
│   │   │   │   ├── history/route.ts   # Score history
│   │   │   │   ├── report/route.ts    # Generate strategy report
│   │   │   │   └── route.ts           # CRUD for a company
│   │   │   └── route.ts               # List/create companies
│   │   └── health/route.ts            # Health check endpoint
│   ├── company/
│   │   └── [id]/
│   │       └── page.tsx      # Company workspace (overview, signals, timeline)
│   ├── dashboard/
│   │   └── page.tsx          # Watchlist dashboard with heatmap
│   ├── opportunities/
│   │   └── page.tsx          # Opportunity explorer with filters
│   ├── globals.css           # Tailwind directives, custom classes, CSS variables
│   ├── layout.tsx            # Root layout (stripped of global nav/footer for dark pages)
│   └── page.tsx              # Landing page
├── components/
│   ├── landing/
│   │   ├── hero.tsx          # Full landing page (hero, workflow, engines, footer)
│   │   ├── ShaderBackground.tsx  # WebGL neural-network fragment shader
│   │   └── BrainAnimation.tsx    # Three.js brain visualization
│   └── ui/
│       ├── AnimatedLogo.tsx  # Animated SVG logo component
│       └── DarkTopNav.tsx    # Shared dark pill-shaped navbar
├── lib/
│   ├── ai.ts                # OpenAI integration for analysis
│   ├── collectors.ts         # Signal data collectors (GDELT, Greenhouse, etc.)
│   ├── persistence.ts        # Database persistence layer
│   ├── store.ts              # In-memory data store
│   └── store.test.ts         # Store unit tests
├── public/
│   └── images/
│       └── marketautopsy-logo.png
├── types.d.ts                 # Module declarations for untyped dependencies
├── vercel.json                # Vercel deployment config
├── tailwind.config.ts         # Custom dark palette and design tokens
├── next.config.mjs
├── postcss.config.mjs
└── package.json
```

---

## Data Sources

| Source | Type | Status |
|---|---|---|
| **GDELT** | Global news events | ✅ Automatic |
| **Greenhouse** | Job postings (via board token) | ✅ On token provided |
| **Lever** | Job postings (via company slug) | ✅ On slug provided |
| **PatentsView** | Patent filings | ✅ Automatic |
| **Reddit OAuth** | Sentiment analysis | 🔒 Credential-gated |
| **NewsAPI** | News articles | 🔒 API key required |
| **Product Hunt** | Product launches | 🔒 Credential-gated |

---

## License

Private / Internal use.
