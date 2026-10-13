// Billingo API v3 – automatikus számla minden sikeres Stripe fizetés után.
// Beállítás (Vercel): BILLINGO_API_KEY (Billingo → Beállítások → API), opcionálisan BILLINGO_BLOCK_ID (számlatömb).
// Alanyi adómentes (AAM) számla, bankkártyás (online) fizetés, „fizetve” állapotban, e-számlaként, e-mailben kiküldve.
import type Stripe from 'stripe';
import { createAdminClient } from '@/lib/supabase/server';

const BASE = 'https://api.billingo.hu/v3';

export const billingoConfigured = () => !!process.env.BILLINGO_API_KEY;

async function api<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'X-API-KEY': process.env.BILLINGO_API_KEY!, 'Content-Type': 'application/json', Accept: 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(15000),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Billingo ${method} ${path} → ${res.status}: ${text.slice(0, 500)}`);
  return (text ? JSON.parse(text) : {}) as T;
}

let blockId: number | null = null;
async function invoiceBlockId(): Promise<number> {
  if (process.env.BILLINGO_BLOCK_ID) return Number(process.env.BILLINGO_BLOCK_ID);
  if (blockId) return blockId;
  const list = await api<{ data: { id: number; type: string }[] }>('GET', '/document-blocks?per_page=100');
  const block = list.data.find((b) => b.type === 'invoice');
  if (!block) throw new Error('Nincs számlatömb a Billingóban (Beállítások → Számlatömbök).');
  blockId = block.id;
  return blockId;
}

export type BillingCustomer = {
  name: string;
  email: string;
  country: string; // ISO kód, pl. HU
  postCode: string;
  city: string;
  address: string;
  taxNumber: string | null;
};

// Stripe Checkout / Stripe Invoice vevőadatai → Billingo partner
export function customerFromStripe(d: {
  name?: string | null;
  email?: string | null;
  address?: Stripe.Address | null;
  tax_ids?: { type: string; value: string | null }[] | null;
}): BillingCustomer {
  const a = d.address;
  return {
    name: d.name?.trim() || d.email || 'Magánszemély',
    email: d.email ?? '',
    country: a?.country || 'HU',
    postCode: a?.postal_code || '',
    city: a?.city || '',
    address: [a?.line1, a?.line2].filter(Boolean).join(', '),
    taxNumber: d.tax_ids?.find((t) => t.value)?.value ?? null,
  };
}

function partnerBody(c: BillingCustomer) {
  const foreign = c.country !== 'HU';
  return {
    name: c.name,
    address: { country_code: c.country, post_code: c.postCode, city: c.city, address: c.address },
    emails: c.email ? [c.email] : [],
    taxcode: c.taxNumber ?? '',
    tax_type: foreign ? 'FOREIGN' : c.taxNumber ? 'HAS_TAX_NUMBER' : 'NO_TAX_NUMBER',
  };
}

// Vevőnként egy Billingo partner (a profilban tároljuk), minden számlánál frissítve a legutóbbi számlázási adatokkal.
async function upsertPartner(userId: string | null, c: BillingCustomer): Promise<number> {
  const admin = createAdminClient();
  const body = partnerBody(c);
  if (userId) {
    const { data } = await admin.from('profiles').select('billingo_partner_id').eq('id', userId).maybeSingle();
    if (data?.billingo_partner_id) {
      try {
        await api('PUT', `/partners/${data.billingo_partner_id}`, body);
        return data.billingo_partner_id;
      } catch {
        // pl. a partnert törölték a Billingóban → újat hozunk létre
      }
    }
  }
  const partner = await api<{ id: number }>('POST', '/partners', body);
  if (userId) await admin.from('profiles').update({ billingo_partner_id: partner.id }).eq('id', userId);
  return partner.id;
}

const budapestToday = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Budapest' }); // YYYY-MM-DD

export type InvoiceRequest = {
  stripeRef: string;
  kind: 'checkout' | 'subscription';
  userId: string | null;
  customer: BillingCustomer;
  amountHuf: number; // bruttó, a ténylegesen kifizetett összeg
  description: string; // a számla tételének neve
};

// Idempotens: ugyanarra a Stripe fizetésre csak egyszer állít ki számlát (a „pending” sor beszúrása a zár).
// Hibánál nem dob – a fizetés/hozzáférés ettől még rendben van; a hiba az adminban látszik és újrapróbálható.
export async function issueInvoice(req: InvoiceRequest, { retry = false } = {}): Promise<void> {
  if (!billingoConfigured() || req.amountHuf <= 0) return;
  const admin = createAdminClient();
  const row = {
    stripe_ref: req.stripeRef,
    kind: req.kind,
    user_id: req.userId,
    email: req.customer.email,
    amount_huf: req.amountHuf,
    description: req.description,
  };
  if (retry) {
    const { data } = await admin.from('invoices').update({ status: 'pending', error: null, updated_at: new Date().toISOString() })
      .eq('stripe_ref', req.stripeRef).in('status', ['failed', 'pending']).select('id');
    if (!data?.length) return;
  } else {
    const { data } = await admin.from('invoices').upsert(row, { onConflict: 'stripe_ref', ignoreDuplicates: true }).select('id');
    if (!data?.length) return; // már kiállítva / folyamatban
  }

  try {
    const partnerId = await upsertPartner(req.userId, req.customer);
    const today = budapestToday();
    const doc = await api<{ id: number; invoice_number?: string }>('POST', '/documents', {
      partner_id: partnerId,
      block_id: await invoiceBlockId(),
      type: 'invoice',
      fulfillment_date: today,
      due_date: today,
      payment_method: 'online_bankcard',
      language: 'hu',
      currency: 'HUF',
      electronic: true,
      paid: true,
      items: [{ name: req.description, unit_price: req.amountHuf, unit_price_type: 'gross', quantity: 1, unit: 'db', vat: 'AAM' }],
      comment: `Online bankkártyás fizetés (Stripe) – ${req.stripeRef}`,
    });
    await admin.from('invoices').update({
      status: 'issued', billingo_document_id: doc.id, invoice_number: doc.invoice_number ?? null, error: null, updated_at: new Date().toISOString(),
    }).eq('stripe_ref', req.stripeRef);
    if (req.customer.email) {
      try {
        await api('POST', `/documents/${doc.id}/send`, { emails: [req.customer.email] });
      } catch (e) {
        await admin.from('invoices').update({ error: `A számla elkészült, de az e-mail küldés nem sikerült: ${(e as Error).message}` }).eq('stripe_ref', req.stripeRef);
      }
    }
  } catch (e) {
    console.error('Billingo számla hiba', e);
    await admin.from('invoices').update({ status: 'failed', error: (e as Error).message.slice(0, 1000), updated_at: new Date().toISOString() })
      .eq('stripe_ref', req.stripeRef);
  }
}

// Checkout session (kurzus / csomag vásárlás) → számla
export async function invoiceForCheckout(session: Stripe.Checkout.Session, opts?: { retry?: boolean }) {
  if (session.mode !== 'payment') return; // előfizetésnél az invoice.paid esemény számláz
  const courseId = session.metadata?.course_id;
  const admin = createAdminClient();
  const { data: course } = courseId ? await admin.from('courses').select('title').eq('id', courseId).maybeSingle() : { data: null };
  const d = session.customer_details;
  await issueInvoice({
    stripeRef: session.id,
    kind: 'checkout',
    userId: session.metadata?.user_id ?? session.client_reference_id ?? null,
    customer: customerFromStripe({ name: d?.business_name || d?.name, email: d?.email ?? session.customer_email, address: d?.address, tax_ids: d?.tax_ids }),
    amountHuf: Math.round((session.amount_total ?? 0) / 100),
    description: `${course?.title ?? 'Online videókurzus'} – online videókurzus (digitális tartalom)`,
  }, opts);
}

// Előfizetés havi díja (Stripe invoice.paid) → számla
export async function invoiceForSubscription(inv: Stripe.Invoice, opts?: { retry?: boolean }) {
  if (!inv.id || !(inv.amount_paid > 0)) return;
  const admin = createAdminClient();
  const customerId = typeof inv.customer === 'string' ? inv.customer : inv.customer?.id;
  const { data: profile } = customerId ? await admin.from('profiles').select('id').eq('stripe_customer_id', customerId).maybeSingle() : { data: null };
  const line = inv.lines?.data?.[0];
  const period = line?.period
    ? ` (${new Date(line.period.start * 1000).toLocaleDateString('hu-HU', { timeZone: 'Europe/Budapest' })} – ${new Date(line.period.end * 1000).toLocaleDateString('hu-HU', { timeZone: 'Europe/Budapest' })})`
    : '';
  await issueInvoice({
    stripeRef: inv.id,
    kind: 'subscription',
    userId: profile?.id ?? null,
    customer: customerFromStripe({ name: inv.customer_name, email: inv.customer_email, address: inv.customer_address, tax_ids: inv.customer_tax_ids }),
    amountHuf: Math.round(inv.amount_paid / 100),
    description: `Tudástár-tagság – havi előfizetés${period}`,
  }, opts);
}
