// Branded welcome email sent after a footer subscription. Uses SFH's
// red primary + navy accent. All CSS is inline because email clients
// don't reliably support <style> or CSS variables.
//
// The `siteOrigin` and `siteName` args come from `getCurrentSite()` +
// request origin at the call site — we don't hard-code them so this
// same template ships to sfhnigeria.org / sfhiph.org / revohealthhmo.com
// as we roll the newsletter feature out to the other three sites.

type Args = {
  siteOrigin: string;
  siteName: string;
  logoUrl: string; // absolute URL — inline images need absolute paths
  unsubscribeToken: string;
};

const SFH_RED = '#E31B22';
const SFH_NAVY = '#1C2674';
const INK = '#0F172A';
const INK_MUTED = '#4A5568';
const BG = '#F5F6FA';
const BORDER = '#E4E7EE';

export function subscribeWelcomeEmail({
  siteOrigin,
  siteName,
  logoUrl,
  unsubscribeToken,
}: Args): { subject: string; html: string; text: string } {
  const unsubscribeUrl = `${siteOrigin}/unsubscribe/${unsubscribeToken}`;

  const subject = `Welcome to the ${siteName} newsletter`;

  // eslint-disable-next-line — long HTML literal, formatting matters
  const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${subject}</title>
  </head>
  <body style="margin:0;padding:0;background:${BG};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${INK};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${BG};padding:32px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 16px -8px rgba(15,23,42,0.10);">
            <!-- Brand band -->
            <tr>
              <td style="background:${SFH_RED};padding:24px 32px;">
                <img src="${logoUrl}" alt="${siteName}" height="36" style="display:block;height:36px;width:auto;filter:brightness(0) invert(1);" />
              </td>
            </tr>
            <!-- Body -->
            <tr>
              <td style="padding:32px;">
                <h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;color:${SFH_NAVY};font-weight:700;">
                  Thanks for subscribing.
                </h1>
                <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:${INK};">
                  You're now on the ${siteName} newsletter list. You'll
                  hear from us when there's real news to share —
                  programme updates, publications, and stories from the
                  countries we work in.
                </p>
                <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:${INK};">
                  In the meantime, feel free to explore the latest from
                  our team.
                </p>
                <p style="margin:0 0 8px;">
                  <a href="${siteOrigin}/press" style="display:inline-block;background:${SFH_RED};color:#ffffff;text-decoration:none;font-weight:600;padding:12px 22px;border-radius:8px;">
                    Read our latest press
                  </a>
                </p>
              </td>
            </tr>
            <!-- Footer -->
            <tr>
              <td style="padding:20px 32px 28px;border-top:1px solid ${BORDER};background:#FBFBFD;">
                <p style="margin:0 0 8px;font-size:12px;line-height:1.5;color:${INK_MUTED};">
                  You received this email because you subscribed at
                  <a href="${siteOrigin}" style="color:${SFH_NAVY};text-decoration:none;">${new URL(siteOrigin).host}</a>.
                </p>
                <p style="margin:0;font-size:12px;line-height:1.5;color:${INK_MUTED};">
                  Not interested anymore?
                  <a href="${unsubscribeUrl}" style="color:${SFH_NAVY};text-decoration:underline;">Unsubscribe with one click</a>.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const text = `Thanks for subscribing to the ${siteName} newsletter.

You'll hear from us when there's real news to share — programme
updates, publications, and stories from the countries we work in.

Latest press: ${siteOrigin}/press

Not interested anymore? Unsubscribe with one click:
${unsubscribeUrl}
`;

  return { subject, html, text };
}
