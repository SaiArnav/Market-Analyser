import fs from 'fs';
import path from 'path';
import type { Company, ExecutiveReport, Score, Signal, TimelineEvent } from './store';

export type PersistedStore = {
  companies: Company[];
  signals: Signal[];
  scores: Score[];
  timelineEvents: TimelineEvent[];
  reports: ExecutiveReport[];
  watchlist: string[];
};

const DATA_DIR = path.join(process.cwd(), '.data');
const STORE_FILE = path.join(DATA_DIR, 'store.json');

const empty: PersistedStore = {
  companies: [],
  signals: [],
  scores: [],
  timelineEvents: [],
  reports: [],
  watchlist: [],
};

export function loadStore(): PersistedStore {
  try {
    if (!fs.existsSync(STORE_FILE)) return { ...empty };
    const raw = fs.readFileSync(STORE_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<PersistedStore>;
    return {
      companies: parsed.companies ?? [],
      signals: parsed.signals ?? [],
      scores: parsed.scores ?? [],
      timelineEvents: parsed.timelineEvents ?? [],
      reports: parsed.reports ?? [],
      watchlist: parsed.watchlist ?? [],
    };
  } catch {
    return { ...empty };
  }
}

export function saveStore(data: PersistedStore): void {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(STORE_FILE, JSON.stringify(data, null, 2), 'utf-8');
}
