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
| `lib/email.ts` | `sendMail({ to, subject, html, text })` — nodemailer over SMTP. No-ops with a warning when SMTP isn't configured, so subscribes still save. |
| `lib/emails/subscribe-welcome.ts` | Inline-styled HTML + plain-text welcome email. Logo comes from the site's footer brand image (`/admin/site-settings`). |
| `components/NewsletterForm.tsx` | Client form: email + required acknowledgement checkbox, pending / success / already-subscribed / error states. |
| `app/(admin)/admin/(authed)/newsletter/` | `/admin/newsletter` — Active / Unsubscribed / All tabs, email search, per-row unsubscribe/resubscribe, Export CSV. |
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
   does **not** roll back the subscription.
4. The email links to `/unsubscribe/<token>`, which calls
   `unsubscribeByToken` and renders a confirmation.

## Environment

```
SMTP_HOST=smtp.example.com
SMTP_PORT=587            # 465 = implicit TLS
SMTP_SECURE=             # "true" to force TLS; defaults to port === 465
SMTP_USER=
SMTP_PASSWORD=
EMAIL_FROM=news@example.org
EMAIL_FROM_NAME=My Site
```

Leave the SMTP vars empty in development — sign-ups still save and the
server logs `[email] SMTP not configured — skipping mail …`.

## Per-site integration

1. Run `npm run db:migrate` (adds `newsletter_subscribers`).
2. Merge the new deps from `snippets/package.json.merge.json`
   (`nodemailer`, `@types/nodemailer`) and `npm install`.
3. Wire the footer — see `snippets/footer-newsletter.md`.
4. Copy `snippets/unsubscribe-page.tsx` to
   `app/(frontend)/unsubscribe/[token]/page.tsx`.
5. Set the SMTP env vars on your host.
6. Visit `/admin/newsletter` (admins only) to see sign-ups.

## Customising the welcome email

Edit `lib/emails/subscribe-welcome.ts`. All CSS is inline because email
clients ignore `<style>` blocks and CSS variables. The logo URL must be
absolute — relative brand-image paths are resolved against the request
origin automatically.
