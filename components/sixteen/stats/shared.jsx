'use client';
import * as SixteenNS from '@/components/sixteen';
import { CATEGORY_TO_DOMAIN, domainLabel } from '@/lib/cb/domains';

// Shared formatting + small presentational pieces for the stats / practice
// analysis screens. Kept here so Stats, Sessions and the Practice* screens
// don't each redefine the same labels and helpers.

export const SECTION_LABEL = { rw: 'Reading & Writing', math: 'Math' };
export const SECTION_SHORT = { rw: 'R&W', math: 'Math' };
export const MODE_LABEL = { drill: 'drill', 'mock-m1': 'Module 1', 'mock-full': 'Full section' };
export const MODE_VARIANT = { drill: 'neutral', 'mock-m1': 'brand', 'mock-full': 'success' };

// "Math · Algebra" for targeted drills; falls back to the section label.
export function sessionTitle(s) {
  const sec = SECTION_LABEL[s.section] ?? s.section;
  if (s.mode === 'drill') {
    const code = CATEGORY_TO_DOMAIN[s.config?.category];
    const cat = code ? domainLabel(s.section, code) : null;
    if (cat) return `${sec} · ${cat}`;
  }
  return sec;
}

export function relTime(iso) {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const s = Math.max(0, (Date.now() - then) / 1000);
  if (s < 60) return 'Just now';
  const m = s / 60;
  if (m < 60) return `${Math.floor(m)}m ago`;
  const h = m / 60;
  if (h < 24) return `${Math.floor(h)}h ago`;
  const d = h / 24;
  if (d < 7) return `${Math.floor(d)}d ago`;
  const w = d / 7;
  if (w < 5) return `${Math.floor(w)}w ago`;
  const mo = d / 30;
  if (mo < 12) return `${Math.floor(mo)}mo ago`;
  return `${Math.floor(d / 365)}y ago`;
}

export function shortAgo(iso) {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const s = Math.max(0, (Date.now() - then) / 1000);
  if (s < 90) return 'now';
  const m = s / 60;
  if (m < 60) return `${Math.floor(m)}m`;
  const h = m / 60;
  if (h < 24) return `${Math.floor(h)}h`;
  const d = h / 24;
  if (d < 7) return `${Math.floor(d)}d`;
  const w = d / 7;
  if (w < 5) return `${Math.floor(w)}w`;
  return `${Math.floor(d / 30)}mo`;
}

export function StatCardLite({ label, value, sublabel }) {
  return (
    <div style={{display:'flex', flexDirection:'column', gap: 4}}>
      <span style={{font:'var(--role-eyebrow)', textTransform:'uppercase', letterSpacing:'var(--tracking-caps)', color:'var(--text-tertiary)'}}>{label}</span>
      <span style={{font:'var(--role-title-md)', color:'var(--text-primary)', fontFamily:'var(--font-mono)', fontVariantNumeric:'tabular-nums', lineHeight: 1}}>{value}</span>
      {sublabel && <span style={{font:'var(--role-caption)', color:'var(--text-tertiary)'}}>{sublabel}</span>}
    </div>
  );
}

export function EmptyState({ title, hint, action }) {
  const { Card } = SixteenNS;
  return (
    <Card padding="xl" style={{textAlign:'center'}}>
      <div style={{font:'var(--role-title-sm)', color:'var(--text-primary)', marginBottom: 6}}>{title}</div>
      <div style={{font:'var(--role-body)', color:'var(--text-tertiary)'}}>{hint}</div>
      {action && <div style={{marginTop: 16, display:'flex', justifyContent:'center'}}>{action}</div>}
    </Card>
  );
}
