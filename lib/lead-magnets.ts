import { createHmac, timingSafeEqual } from 'node:crypto';

// Ingyenes letölthető anyagok (lead magnetek). A PDF NEM a public mappában van, hanem a private/-ban:
// csak az kapja meg, aki megadta az e-mail-címét (aláírt süti), vagy be van lépve.
export const LEAD_MAGNETS: Record<string, { file: string; filename: string; landing: string }> = {
  'claude-dashboard-motion': {
    file: 'private/segedlet/claude-dashboard-motion.pdf',
    filename: 'Claude_Dashboard_Motion_ingyenes_segedlet.pdf',
    landing: '/ingyenes/claude-dashboard-motion',
  },
};

export const leadCookieName = (slug: string) => `lm_${slug}`;

function secret() {
  return process.env.LEAD_MAGNET_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || 'dev-only';
}

export function signLead(slug: string) {
  return createHmac('sha256', secret()).update(`lead-magnet:${slug}`).digest('hex');
}

export function verifyLead(slug: string, value: string | undefined) {
  if (!value) return false;
  const a = Buffer.from(value);
  const b = Buffer.from(signLead(slug));
  return a.length === b.length && timingSafeEqual(a, b);
}

export const downloadPath = (slug: string) => `/api/segedlet/${slug}`;

// Ingyenes anyag (0 Ft-os csomag) a kurzusoldalon: e-mail-cím után fiók nélkül is olvasható és letölthető.
// A süti kurzusonként külön, aláírva (a slug csak kisbetű, szám és kötőjel).
export const courseLeadKey = (slug: string) => `course:${slug}`;
export const courseLeadCookie = (slug: string) => `lm_k_${slug}`;
