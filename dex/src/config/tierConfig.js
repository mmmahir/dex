// ─────────────────────────────────────────────────────────────
//  TIER CONFIG  —  add / remove tiers here ONLY
//  To add a new tier:
//    1. Create your JSON file, e.g. src/data/t6.json
//    2. Add an entry to TIERS below
//    3. Done — Home, Dex, and Collection will pick it up automatically
// ─────────────────────────────────────────────────────────────

import data1 from '../data/t1.json';
import data2 from '../data/t2.json';
import data3 from '../data/t3.json';
import data4 from '../data/t4.json';
import data5 from '../data/t5.json';

export const TIERS = [
  //  tier  label          bg color    border      spawn weight   data
  { tier: 1, label: 'LEGENDARY', bg: '#ca8f0f', border: '#a0700a', weight: 0.03, data: data1 },
  { tier: 2, label: 'EPIC',      bg: '#9b59b6', border: '#7d3c98', weight: 0.15, data: data2 },
  { tier: 3, label: 'RARE',      bg: '#2980b9', border: '#1a5276', weight: 0.20, data: data3 },
  { tier: 4, label: 'UNCOMMON',  bg: '#27ae60', border: '#1e8449', weight: 0.12, data: data4 },
  { tier: 5, label: 'COMMON',    bg: '#7f8c8d', border: '#616a6b', weight: 0.50, data: data5 },
];

// Flat array of every card across all tiers
export const ALL_CARDS = TIERS.flatMap(t => t.data);

// Quick lookup maps derived from TIERS
export const TIER_COLORS = Object.fromEntries(
  TIERS.map(t => [t.tier, { bg: t.bg, border: t.border, label: t.label }])
);

// Sources array formatted for the weighted random picker in Home.js
export const SPAWN_SOURCES = TIERS.map((t, i) => ({
  items: t.data,
  weight: t.weight,
  keyPrefix: `d${t.tier}`,
}));