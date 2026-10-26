// Transactional email transport — nodemailer over SMTP, provider-
// agnostic (works with any SMTP relay: Postmark, SES, Mailgun, Resend,
// your own Postfix, …).
//
// Env:
//   SMTP_HOST        (required) SMTP server hostname.
//   SMTP_PORT        Defaults to 587. Use 465 for implicit TLS.
//   SMTP_SECURE      "true" forces implicit TLS (defaults to port === 465).
//   SMTP_USER        (required) SMTP username.
//   SMTP_PASSWORD    (required) SMTP password / API token.
//   EMAIL_FROM       Sender address. Defaults to SMTP_USER.
//   EMAIL_FROM_NAME  Optional friendly name; formatted as "Name <email>".
//
// When SMTP_HOST / SMTP_USER / SMTP_PASSWORD are missing, sendMail()
// logs a warning and returns { ok: false } instead of throwing, so the
// calling flow (e.g. a newsletter subscribe) still succeeds.
import nodemailer, { type Transporter } from 'nodemailer';

type MailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

let transporter: Transporter | null = null;

export function isEmailConfigured(): boolean {
  return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD);
}

function getTransporter(): Transporter {
  if (transporter) return transporter;
  const port = Number(process.env.SMTP_PORT || 587);
  const secure = process.env.SMTP_SECURE
    ? process.env.SMTP_SECURE === 'true'
    : port === 465;
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });
  return transporter;
}

function resolveFrom(): string | undefined {
  const addr = process.env.EMAIL_FROM || process.env.SMTP_USER;
  if (!addr) return undefined;
  const name = process.env.EMAIL_FROM_NAME?.trim();
  return name ? `${name} <${addr}>` : addr;
}

export async function sendMail({ to, subject, html, text }: MailInput): Promise<
  { ok: true } | { ok: false; error: string }
> {
  if (!isEmailConfigured()) {
    console.warn(
      `[email] SMTP not configured — skipping mail to ${to} ("${subject}"). ` +
        'Set SMTP_HOST, SMTP_USER and SMTP_PASSWORD to enable.',
    );
    return { ok: false, error: 'SMTP not configured' };
  }

  try {
    await getTransporter().sendMail({ from: resolveFrom(), to, subject, html, text });
    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[email] send failed to ${to}: ${msg}`);
    return { ok: false, error: msg };
  }
}
