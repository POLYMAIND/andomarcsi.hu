import { after } from 'next/server';
import type { Profile } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/server';
import { forwardToPolyos } from '@/lib/waitlist';

// Új fiók továbbítása PolyOS-be – egyszer, az első bejelentkezett oldalbetöltéskor.
// Így minden belépési mód (jelszavas regisztráció, e-mailes link, bármelyik böngésző) le van fedve.
// A „polyos_synced_at is null” feltételes frissítés garantálja, hogy párhuzamos kéréseknél is csak egyszer menjen ki.
export function syncRegistrationIfNeeded(profile: Profile) {
  // undefined = a migráció még nem futott le (nincs oszlop) → ne próbálkozzunk minden kérésnél.
  if (profile.polyos_synced_at !== null || !profile.email || !process.env.POLYOS_WEBHOOK_URL) return;
  after(async () => {
    const { data } = await createAdminClient()
      .from('profiles')
      .update({ polyos_synced_at: new Date().toISOString() })
      .eq('id', profile.id)
      .is('polyos_synced_at', null)
      .select('id');
    if (!data?.length) return;
    await forwardToPolyos({
      event: 'user.registered',
      email: profile.email!,
      name: profile.full_name || null,
      registered_at: profile.created_at ?? new Date().toISOString(),
      source: 'andormarcsi.hu',
    });
  });
}
