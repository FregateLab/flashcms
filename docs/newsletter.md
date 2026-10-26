# Newsletter

flashcms collects newsletter sign-ups from the public footer, sends a
branded welcome email with a one-click unsubscribe link, and gives
admins a subscriber list with CSV export. Delivery of actual
newsletters (campaigns) is out of scope — export the CSV into your
campaign tool.

## What ships

| File | Role |
|---|---|
| `db/schema.ts` → `newsletterSubscribers` | Table `newsletter_subscribers` (migration `0007`). Site-scoped, unique `(site_id, email)`, per-row `unsubscribe_token` UUID. |
| `lib/newsletter.ts` | Server actions. Public: `subscribeToNewsletter`, `unsubscribeByToken`. Admin: `listSubscribers`, `subscriberCounts`, `adminUnsubscribe`, `adminResubscribe`. |
| `lib/email.ts` | `sendMail({ to, subject, html, text })` — SendPipe HTTP API (since 1.1.0; was nodemailer/SMTP in 1.0.9). No-ops with a warning when `SENDPIPE_KEY` isn't set, so subscribes still save. 10 s timeout. |
| `lib/emails/subscribe-welcome.ts` | Inline-styled HTML + plain-text welcome email. Logo comes from the site's footer brand image (`/admin/site-settings`); colours and copy are the `WELCOME_EMAIL_THEME` / `WELCOME_EMAIL_COPY` constants. |
| `components/NewsletterForm.tsx` | Client form: email + required acknowledgement checkbox, pending / success / already-subscribed / error states. |
| `app/(admin)/admin/(authed)/newsletter/` | `/admin/newsletter` (admins only — sidebar link, middleware and page all check the role) — Active / Unsubscribed / All tabs, email search, per-row unsubscribe/resubscribe, Export CSV. |
| `app/api/newsletter/export/route.ts` | `GET /api/newsletter/export` — admin-only CSV of active subscribers, `<site-slug>-newsletter-<date>.csv`. |
| `snippets/unsubscribe-page.tsx` | Drop-in `app/(frontend)/unsubscribe/[token]/page.tsx`. |
| `snippets/footer-newsletter.md` | The Footer.tsx change that mounts `NewsletterForm`. |

## Data model

```
newsletter_subscribers
  id                uuid pk
  site_id           uuid → sites.id (cascade)
  email             varchar(320)        unique per site (lower-cased on insert)
  status            'subscribed' | 'unsubscribed'
  ack_consent       boolean             true once the checkbox was ticked
  unsubscribe_token uuid unique         embedded in every email
  source            varchar(32)         'footer' by default
  subscribed_at     timestamp
  unsubscribed_at   timestamp null
```

Rows are never deleted on unsubscribe — status flips, so a later
re-subscribe keeps the same token and history.

## Flow

1. Visitor submits the footer form → `subscribeToNewsletter`.
2. New email → insert. Existing + unsubscribed → reactivate. Existing +
   subscribed → returns `{ ok: true, already: true }` (no second email).
3. Welcome email is sent via `sendMail`. A mail failure is logged and
   does **not** roll back the subscription. Links in the email use
   `SITE_URL`, else `https://<sites.domain>` — never the request's Host
   header, which a visitor controls (only in development is the Host
   header used as a last resort).
4. The email links to `/unsubscribe/<token>`, which calls
   `unsubscribeByToken` and renders a confirmation.

## Environment

```
SENDPIPE_KEY=            # SendPipe API key (X-SendPipe-Key)
EMAIL_FROM=news@example.org   # on a verified SendPipe domain
EMAIL_FROM_NAME=My Site
SITE_URL=https://example.org  # origin for links in emails
```

Leave `SENDPIPE_KEY` empty in development — sign-ups still save and the
server logs `[email] SENDPIPE_KEY not set — skipping mail …`. Set
`SITE_URL=http://localhost:3000` locally so unsubscribe links work.

To use a different provider (SES, Postmark, SMTP, …) keep the
`sendMail()` signature in `lib/email.ts` and replace its body.

### Upgrading from 1.0.9 (SMTP)

Replace `SMTP_HOST` / `SMTP_PORT` / `SMTP_SECURE` / `SMTP_USER` /
`SMTP_PASSWORD` with `SENDPIPE_KEY`, keep `EMAIL_FROM` /
`EMAIL_FROM_NAME`, add `SITE_URL`, and drop `nodemailer` /
`@types/nodemailer` from `package.json`.

## Per-site integration

1. Run `npm run db:migrate` (adds `newsletter_subscribers`).
2. Merge `snippets/package.json.merge.json` and `npm install` (no
   extra mail dependency since 1.1.0).
3. Wire the footer — see `snippets/footer-newsletter.md`.
4. Copy `snippets/unsubscribe-page.tsx` to
   `app/(frontend)/unsubscribe/[token]/page.tsx`.
5. Set `SENDPIPE_KEY`, `EMAIL_FROM`, `SITE_URL` on your host.
6. Visit `/admin/newsletter` (admins only) to see sign-ups.

## Customising the welcome email

Edit `WELCOME_EMAIL_THEME` (colours, logo inversion) and
`WELCOME_EMAIL_COPY` (heading, body, call-to-action label + path) at the
top of `lib/emails/subscribe-welcome.ts`. All CSS is inline because email
clients ignore `<style>` blocks and CSS variables. Relative brand-image
paths are resolved against the site origin; with no logo the band shows
the site name. All interpolated values are HTML-escaped.

`NewsletterForm` takes `consentLabel` (checkbox text) and `inputId`
props — pass your footer's consent copy, e.g.
`consentLabel="I agree to receive emails from Acme…"`.

## Known limitations

- No rate limiting or CAPTCHA on the public subscribe action — anyone
  can trigger one welcome email per address. Add a per-IP limit (see
  `docs/extending.md`) or a honeypot field if abuse appears.
- No double opt-in: the acknowledgement checkbox is recorded as
  `ack_consent`, but the address isn't confirmed by email.
- The CSV export guards against spreadsheet formula injection by
  prefixing cells that start with `= + - @` with a `'`.
