export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '');

// Havi előfizetés: minden (előfizetésbe tartozó) kurzushoz hozzáférés.
export const SUBSCRIPTION = {
  enabled: process.env.NEXT_PUBLIC_SUBSCRIPTION_ENABLED !== 'false',
  priceHuf: Number(process.env.NEXT_PUBLIC_SUBSCRIPTION_PRICE_HUF ?? 20000),
  name: 'andormarcsi.hu Tudástár – havi előfizetés',
  weeklyNew: 2,
};
