'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin, requireUser } from '@/lib/auth';
import { COMPANY } from '@/lib/company';
import { SITE_URL } from '@/lib/config';
import { notificationEmail, sendEmail } from '@/lib/email';

const str = (f: FormData, k: string) => String(f.get(k) ?? '').trim();
const uuid = (s: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

// Tanuló: vélemény beküldése vagy módosítása egy kurzushoz (kurzusonként egy).
export async function submitTestimonial(formData: FormData) {
  const courseId = str(formData, 'course_id');
  const slug = str(formData, 'slug').replace(/[^a-z0-9-]/g, '');
  const back = (q: string) => redirect(`/kurzusok/${slug}?velemeny=${q}#velemeny`);
  if (!uuid(courseId) || !slug) redirect('/dashboard');
  const { supabase, user } = await requireUser(`/kurzusok/${slug}`);

  const rating = parseInt(str(formData, 'rating'), 10);
  const body = str(formData, 'body').slice(0, 2000);
  const displayName = str(formData, 'display_name').slice(0, 80);
  const business = str(formData, 'business').slice(0, 120);
  if (!(rating >= 1 && rating <= 5)) back('csillag');
  if (body.length < 10) back('rovid');
  if (!displayName) back('nev');
  if (formData.get('consent') !== 'on') back('hozzajarulas');

  const { error } = await supabase.from('testimonials').upsert(
    { user_id: user.id, course_id: courseId, rating, body, display_name: displayName, business, consent_at: new Date().toISOString() },
    { onConflict: 'user_id,course_id' },
  );
  if (error) back('hiba');

  // Értesítés neked (ha be van állítva az e-mail-küldés)
  const { data: course } = await supabase.from('courses').select('title').eq('id', courseId).maybeSingle();
  const { text, html } = notificationEmail({
    heading: `Új vélemény: ${'★'.repeat(rating)}${'☆'.repeat(5 - rating)}`,
    lines: [`${displayName}${business ? `, ${business}` : ''} – ${course?.title ?? ''}`, `„${body}”`],
    cta: 'Megnézem',
    url: `${SITE_URL}/admin/velemenyek`,
    settingsUrl: `${SITE_URL}/admin/velemenyek`,
  });
  await sendEmail({ to: COMPANY.email, subject: `Új vélemény (${rating}★): ${course?.title ?? ''}`, text, html });

  revalidatePath('/admin/velemenyek');
  back('ok');
}

// Admin: állapot (jóváhagyva / elrejtve / új) és törlés.
export async function setTestimonialStatus(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = str(formData, 'id');
  const status = str(formData, 'status');
  if (uuid(id) && ['new', 'approved', 'hidden'].includes(status)) await supabase.from('testimonials').update({ status }).eq('id', id);
  revalidatePath('/admin/velemenyek');
  redirect(`/admin/velemenyek?${str(formData, 'qs')}`);
}

export async function deleteTestimonial(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = str(formData, 'id');
  if (uuid(id)) await supabase.from('testimonials').delete().eq('id', id);
  revalidatePath('/admin/velemenyek');
  redirect(`/admin/velemenyek?${str(formData, 'qs')}`);
}
