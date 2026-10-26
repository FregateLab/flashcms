# Wiring the newsletter form into your Footer

flashcms ships `components/NewsletterForm.tsx` (client component) which
posts to the `subscribeToNewsletter` server action in
`lib/newsletter.ts`. Your public Footer lives in your own project, so
the hookup is a two-line change there.

## 1. Import the form

```tsx
// components/Footer.tsx (your project)
import NewsletterForm from '@/components/NewsletterForm';
```

## 2. Replace the old `<form action="#">` with it

```tsx
<NewsletterForm
  placeholder={footer.newsletter.placeholder}
  submitLabel={footer.newsletter.submitLabel}
  className="footer__newsletter"   // optional: wrapper class
  rowClassName="footer__field"     // optional: input + button row class
/>
```

`className` / `rowClassName` let you keep your existing footer CSS; if
you omit `rowClassName` it defaults to `footer__signup-form`.

The form renders an email input, a submit button and a **required
acknowledgement checkbox** (`name="ack"`). The server action rejects
submissions without it, so keep the checkbox if you restyle.

## 3. Add the unsubscribe page

Copy `snippets/unsubscribe-page.tsx` to
`app/(frontend)/unsubscribe/[token]/page.tsx`. Every welcome email
links there.

See `docs/newsletter.md` for env vars and the admin side.
