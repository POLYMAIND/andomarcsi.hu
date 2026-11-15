// Tranzakciós e-mail (értesítések) a Resend API-n keresztül – külön csomag nélkül, sima fetch-csel.
// RESEND_API_KEY: a Resend API kulcs. EMAIL_FROM: feladó, pl. „Andor Marcsi <kozosseg@andormarcsi.hu>”
// (a domaint a Resendben hitelesíteni kell). Ha nincs beállítva, az értesítés csendben kimarad.
export const emailConfigured = () => !!(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);

const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

export async function sendEmail({ to, subject, text, html }: { to: string; subject: string; text: string; html?: string }) {
  if (!emailConfigured()) return;
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: process.env.EMAIL_FROM, to, subject, text, html }),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) console.error('E-mail küldési hiba', res.status, await res.text());
  } catch (err) {
    // Az értesítés nem kritikus: a bejegyzés/hozzászólás ettől még elmentődött.
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
