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

// Ingyenes anyag (0 Ft-os csomag) letölthető PDF-je a private/ mappából: csak e-mail-cím után (kurzus-süti) vagy belépve.
// A course_downloads.url ilyenkor a courseFilePath(slug).
export const COURSE_FILES: Record<string, { file: string; filename: string }> = {
  'ingyenes-skill-utmutato': { file: 'private/segedlet/skill-utmutato.pdf', filename: 'Skill-utmutato_PolySuli.pdf' },
  'ingyenes-videos-design-skill': { file: 'private/segedlet/sajat-videos-design-skill.pdf', filename: 'Sajat-videos-design-skill_PolySuli.pdf' },
};
export const courseFilePath = (slug: string) => `/api/anyag/${slug}`;
