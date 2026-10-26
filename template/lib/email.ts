// Transactional email transport, backed by SendPipe's HTTP API
// (https://sendpipe.org/docs/messages). Replaced the nodemailer/SMTP
// transport in flashcms 1.1.0. Callers still use sendMail() with the
// same {to, subject, html, text} shape — only the wire-level provider
// changed. To use another provider, keep the sendMail() signature and
// swap the fetch() below.
//
// When SENDPIPE_KEY is missing, sendMail() logs a warning and returns
// { ok: false } instead of throwing, so callers (newsletter subscribe)
// still succeed.
//
// Env:
//   SENDPIPE_KEY     (required) API key, sent as X-SendPipe-Key.
//   EMAIL_FROM       Sender address on a verified SendPipe domain.
//                    Falls back to the SendPipe project default.
//   EMAIL_FROM_NAME  Optional friendly name; formatted as "Name <email>".

type MailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

const SENDPIPE_ENDPOINT = 'https://sendpipe.org/v1/messages/channel';

export function isEmailConfigured(): boolean {
  return !!process.env.SENDPIPE_KEY;
}

function resolveFrom(): string | undefined {
  const addr = process.env.EMAIL_FROM;
  if (!addr) return undefined;
  const name = process.env.EMAIL_FROM_NAME?.trim();
  return name ? `${name} <${addr}>` : addr;
}

export async function sendMail({ to, subject, html, text }: MailInput): Promise<
  { ok: true } | { ok: false; error: string }
> {
  const apiKey = process.env.SENDPIPE_KEY;
  if (!apiKey) {
    console.warn(
      `[email] SENDPIPE_KEY not set — skipping mail to ${to} ("${subject}"). ` +
        'Set SENDPIPE_KEY to enable.',
    );
    return { ok: false, error: 'SendPipe not configured' };
  }

  try {
    const res = await fetch(SENDPIPE_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-SendPipe-Key': apiKey,
      },
      // The subscribe action awaits this call — don't let a slow
      // provider hang the visitor's form submission.
      signal: AbortSignal.timeout(10_000),
      body: JSON.stringify({
        channel: 'email',
        from: resolveFrom(),
        to: [to],
        subject,
        html,
        text,
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      const msg = `SendPipe HTTP ${res.status}${detail ? `: ${detail}` : ''}`;
      console.error(`[email] send failed to ${to}: ${msg}`);
      return { ok: false, error: msg };
    }

    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[email] send failed to ${to}: ${msg}`);
    return { ok: false, error: msg };
  }
}
