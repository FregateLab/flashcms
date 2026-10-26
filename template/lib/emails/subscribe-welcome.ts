// Branded welcome email sent after a footer subscription. All CSS is
// inline because email clients don't reliably support <style> or CSS
// variables.
//
// The `siteOrigin` and `siteName` args come from the site row / SITE_URL
// at the call site (lib/newsletter.ts) and the logo from the footer
// brand image in /admin/site-settings, so the same template ships to
// every site without edits.
//
// EXTENSION POINT: change WELCOME_EMAIL_THEME (colours) and
// WELCOME_EMAIL_COPY (body text + call-to-action) per site. Everything
// else is structural.

type Args = {
  siteOrigin: string;
  siteName: string;
  /** Absolute URL — inline images need absolute paths. Empty = no logo. */
  logoUrl: string;
  unsubscribeToken: string;
};

export const WELCOME_EMAIL_THEME = {
  primary: '#111827', // brand band + button background
  accent: '#1F2937', // heading + footer link colour
  ink: '#0F172A',
  inkMuted: '#4A5568',
  bg: '#F5F6FA',
  border: '#E4E7EE',
  /** Set true when the logo is dark-on-transparent and should render white on the band. */
  invertLogo: true,
};

export const WELCOME_EMAIL_COPY = {
  heading: 'Thanks for subscribing.',
  intro:
    "You're now on our newsletter list. You'll hear from us when there's real news to share.",
  followUp: 'In the meantime, feel free to explore the latest from our team.',
  ctaLabel: 'Visit the site',
  /** Path on the site the button links to, e.g. '/blog'. */
  ctaPath: '/',
};

function esc(v: string): string {
  return v
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function subscribeWelcomeEmail({
  siteOrigin,
  siteName,
  logoUrl,
  unsubscribeToken,
}: Args): { subject: string; html: string; text: string } {
  const t = WELCOME_EMAIL_THEME;
  const c = WELCOME_EMAIL_COPY;
  const unsubscribeUrl = `${siteOrigin}/unsubscribe/${encodeURIComponent(unsubscribeToken)}`;
  const ctaUrl = `${siteOrigin}${c.ctaPath.startsWith('/') ? '' : '/'}${c.ctaPath}`;
  let host = siteOrigin;
  try {
    host = new URL(siteOrigin).host;
  } catch {
    /* keep the raw origin */
  }

  const subject = `Welcome to the ${siteName} newsletter`;
  const name = esc(siteName);

  const brand = logoUrl
    ? `<img src="${esc(logoUrl)}" alt="${name}" height="36" style="display:block;height:36px;width:auto;${t.invertLogo ? 'filter:brightness(0) invert(1);' : ''}" />`
    : `<span style="font-size:20px;font-weight:700;color:#ffffff;">${name}</span>`;

  const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${esc(subject)}</title>
  </head>
  <body style="margin:0;padding:0;background:${t.bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${t.ink};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${t.bg};padding:32px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 16px -8px rgba(15,23,42,0.10);">
            <!-- Brand band -->
            <tr>
              <td style="background:${t.primary};padding:24px 32px;">
                ${brand}
              </td>
            </tr>
            <!-- Body -->
            <tr>
              <td style="padding:32px;">
                <h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;color:${t.accent};font-weight:700;">
                  ${esc(c.heading)}
                </h1>
                <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:${t.ink};">
                  ${esc(c.intro)}
                </p>
                <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:${t.ink};">
                  ${esc(c.followUp)}
                </p>
                <p style="margin:0 0 8px;">
                  <a href="${esc(ctaUrl)}" style="display:inline-block;background:${t.primary};color:#ffffff;text-decoration:none;font-weight:600;padding:12px 22px;border-radius:8px;">
                    ${esc(c.ctaLabel)}
                  </a>
                </p>
              </td>
            </tr>
            <!-- Footer -->
            <tr>
              <td style="padding:20px 32px 28px;border-top:1px solid ${t.border};background:#FBFBFD;">
                <p style="margin:0 0 8px;font-size:12px;line-height:1.5;color:${t.inkMuted};">
                  You received this email because you subscribed to ${name} at
                  <a href="${esc(siteOrigin)}" style="color:${t.accent};text-decoration:none;">${esc(host)}</a>.
                </p>
                <p style="margin:0;font-size:12px;line-height:1.5;color:${t.inkMuted};">
                  Not interested anymore?
                  <a href="${esc(unsubscribeUrl)}" style="color:${t.accent};text-decoration:underline;">Unsubscribe with one click</a>.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const text = `${c.heading} — ${siteName}

${c.intro}

${c.ctaLabel}: ${ctaUrl}

Not interested anymore? Unsubscribe with one click:
${unsubscribeUrl}
`;

  return { subject, html, text };
}
