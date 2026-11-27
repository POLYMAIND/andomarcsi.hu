'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { contactsFromCsv, sanitizeSourceName } from '@/lib/contacts';

const BACK = '/admin/kapcsolatok';
const MAX_BYTES = 5 * 1024 * 1024;

// Egy külső lista (pl. a Polysuli régi feliratkozói) egyszeri betöltése CSV-ből.
// A PolyOS-be NEM továbbítjuk: ezek a címek jellemzően onnan exportálva érkeznek, ott már megvannak.
// Ugyanaz a cím ugyanabból a forrásból csak egyszer kerül be (a meglévőt nem írjuk felül).
export async function importExternalCsv(formData: FormData) {
  const { supabase } = await requireAdmin();
  const source = sanitizeSourceName(formData.get('source'));
  const list = String(formData.get('list') ?? '').trim().slice(0, 120) || null;
  const file = formData.get('file');
  if (!source) redirect(`${BACK}?import=forras#import`);
  if (!(file instanceof File) || file.size === 0) redirect(`${BACK}?import=fajl#import`);
  if (file.size > MAX_BYTES) redirect(`${BACK}?import=meret#import`);

  const { rows, invalid } = contactsFromCsv(await file.text());
  if (!rows.length) redirect(`${BACK}?import=ures&hibas=${invalid}#import`);

  let added = 0;
  for (let i = 0; i < rows.length; i += 500) {
    const chunk = rows.slice(i, i + 500).map((r) => ({ source, list, email: r.email, name: r.name, consent_at: null }));
    const { data, error } = await supabase
      .from('external_contacts')
      .upsert(chunk, { onConflict: 'source,email', ignoreDuplicates: true })
      .select('id');
    if (error) {
      console.error('[kapcsolatok import]', error);
      redirect(`${BACK}?import=hiba&uj=${added}#import`);
    }
    added += data?.length ?? 0;
  }
  revalidatePath(BACK);
  redirect(`${BACK}?import=ok&uj=${added}&megvolt=${rows.length - added}&hibas=${invalid}&forras=external:${source}#import`);
}
