// Tranzakciós e-mail (értesítések) – Brevo (ajánlott) vagy Resend API-n keresztül, külön csomag nélkül, sima fetch-csel.
// BREVO_API_KEY: a Brevo API kulcs (SMTP & API → API Keys). Ha nincs, RESEND_API_KEY-jel a Resend megy.
// EMAIL_FROM: feladó, pl. „Andor Marcsi <kozosseg@andormarcsi.hu>” (a domaint a szolgáltatónál hitelesíteni kell).
// Ha nincs beállítva, az értesítés csendben kimarad – a bejegyzés/hozzászólás ettől még elmentődik.
export const emailConfigured = () => !!((process.env.BREVO_API_KEY || process.env.RESEND_API_KEY) && process.env.EMAIL_FROM);

const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

// „Andor Marcsi <kozosseg@andormarcsi.hu>” → { name, email }
export function parseFrom(from: string): { name: string; email: string } {
  const m = /^\s*"?([^"<]*?)"?\s*<([^>]+)>\s*$/.exec(from);
  return m ? { name: m[1].trim() || 'Andor Marcsi', email: m[2].trim() } : { name: 'Andor Marcsi', email: from.trim() };
}

type Mail = { subject: string; text: string; html?: string };

async function brevo(to: string[], mail: Mail) {
  const sender = parseFrom(process.env.EMAIL_FROM!);
  // Egy kérésben több címzett, de mindenki külön levelet kap (messageVersions) – senki nem látja a többiek címét.
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': process.env.BREVO_API_KEY!, 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      sender,
      subject: mail.subject,
      textContent: mail.text,
      htmlContent: mail.html ?? `<pre style="font-family:inherit;white-space:pre-wrap">${escapeHtml(mail.text)}</pre>`,
      ...(to.length === 1 ? { to: [{ email: to[0] }] } : { messageVersions: to.map((email) => ({ to: [{ email }] })) }),
    }),
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) console.error('E-mail küldési hiba (Brevo)', res.status, await res.text());
}

async function resend(to: string, mail: Mail) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: process.env.EMAIL_FROM, to, subject: mail.subject, text: mail.text, html: mail.html }),
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) console.error('E-mail küldési hiba (Resend)', res.status, await res.text());
}

export async function sendEmail({ to, ...mail }: Mail & { to: string }) {
  if (!emailConfigured()) return;
  try {
    if (process.env.BREVO_API_KEY) await brevo([to], mail);
    else await resend(to, mail);
  } catch (err) {
    console.error('E-mail küldési hiba', err);
  }
}

// Ugyanaz a levél sok címzettnek (pl. bejelentés): Brevónál 500-asával, Resendnél egyenként.
export async function sendBulkEmail(to: string[], mail: Mail) {
  if (!emailConfigured() || !to.length) return;
  try {
    if (process.env.BREVO_API_KEY) {
      for (let i = 0; i < to.length; i += 500) await brevo(to.slice(i, i + 500), mail);
    } else {
      for (const t of to) await resend(t, mail);
    }
  } catch (err) {
    console.error('E-mail küldési hiba', err);
  }
}

// Egyszerű, márkázott értesítő levél: cím, pár bekezdés, egy gomb és a leiratkozás linkje.
export function notificationEmail({ heading, lines, cta, url, settingsUrl }: { heading: string; lines: string[]; cta: string; url: string; settingsUrl: string }) {
  const text = [heading, '', ...lines, '', `${cta}: ${url}`, '', `Értesítések kikapcsolása: ${settingsUrl}`].join('\n');
  const html = `<!doctype html><html><body style="margin:0;background:#f4f2ee;font-family:Helvetica,Arial,sans-serif;color:#141216">
<div style="max-width:560px;margin:0 auto;padding:32px 20px">
<div style="font-weight:700;font-size:18px;margin-bottom:20px">andormarcsi<span style="color:#7a3fd6">.</span></div>
<div style="background:#fff;border-radius:20px;padding:28px">
<h1 style="font-size:20px;margin:0 0 14px">${escapeHtml(heading)}</h1>
${lines.map((l) => `<p style="font-size:15px;line-height:1.55;margin:0 0 12px;white-space:pre-wrap">${escapeHtml(l)}</p>`).join('')}
<p style="margin:22px 0 0"><a href="${url}" style="display:inline-block;background:#141216;color:#fff;text-decoration:none;font-weight:700;padding:12px 22px;border-radius:999px">${escapeHtml(cta)}</a></p>
</div>
<p style="font-size:12px;color:#6b6570;margin:18px 4px 0">Azért kaptad ezt a levelet, mert tag vagy az andormarcsi.hu közösségében. <a href="${settingsUrl}" style="color:#6b6570">Értesítések kikapcsolása</a></p>
</div></body></html>`;
  return { text, html };
}
