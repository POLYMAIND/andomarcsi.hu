// Saját domain esetén NEXT_PUBLIC_SITE_URL; enélkül Vercelen a projekt éles címe.
const vercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || (vercelUrl ? `https://${vercelUrl}` : 'http://localhost:3000')).replace(/\/$/, '');

// Havi előfizetés: minden (előfizetésbe tartozó) kurzushoz hozzáférés.
export const SUBSCRIPTION = {
  // Kikapcsolva, amíg nincs elég videó (cél: 20). Bekapcsolás: NEXT_PUBLIC_SUBSCRIPTION_ENABLED=true
  enabled: process.env.NEXT_PUBLIC_SUBSCRIPTION_ENABLED === 'true',
  priceHuf: Number(process.env.NEXT_PUBLIC_SUBSCRIPTION_PRICE_HUF ?? 14990),
  name: 'andormarcsi.hu Tudástár – havi előfizetés',
  weeklyNew: 2,
};
