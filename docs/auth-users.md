# Auth + users

## Stack

- Auth.js v5 (beta)
- Drizzle adapter
- Credentials provider (email + password, bcrypt-hashed)
- JWT session strategy

## Files

| File | Role |
|---|---|
| `lib/auth.config.ts` | **Edge-safe** config. Middleware imports only this. No adapter, no bcrypt, no `@/db`. |
| `lib/auth.ts` | **Node-runtime** config. Full adapter + credentials provider. Imported by route handlers, server components. |
| `middleware.ts` | Runs the auth check on `/admin/*`. Uses `lib/auth.config.ts` only. |
| `app/api/auth/[...nextauth]/route.ts` | Handlers export from `lib/auth`. |

The split matters: bcryptjs uses Node's `crypto`, which the Edge
runtime can't provide. If you import `lib/auth.ts` from `middleware.ts`
directly, the dev server errors on startup.

## Roles

Two hard-coded roles:
- **admin** — full access, sees `Users` in the sidebar
- **editor** — content only

Role is stored on `users.role` and copied into the JWT via:

```tsx
// lib/auth.config.ts callbacks:
jwt({ token, user }) {
  if (user) token.role = user.role;
  return token;
},
session({ session, token }) {
  session.user.role = token.role;
  return session;
},
```

## Route guards

`lib/auth.config.ts::authorized`:

- Unauthenticated `/admin/*` → redirect `/admin/login`
- Signed-in on `/admin/login` → redirect `/admin`
- Signed-in but non-admin on `/admin/users` → redirect `/admin`

The role is read from the JWT — no DB call in middleware.

For finer-grained checks inside server actions:

```tsx
async function requireAdmin() {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session?.user) throw new Error('Not authenticated.');
  if (role !== 'admin') throw new Error('Admins only.');
  return session.user;
}
```

Used in `lib/users.ts` for role-restricted actions.

## Users

- **Admin creates users** via `/admin/users` → "New user" modal
  (`NewUserButton.tsx`).
- **Everyone edits their profile + password** at `/admin/account`.
- **Admin edits any user** at `/admin/users/[id]` — name, role, reset
  password, delete.
- **Self-delete blocked** at both the server action and the UI.
- **Self-downgrade admin → editor blocked**.

## Seeding the first admin

```bash
ADMIN_EMAIL=you@example.org \
ADMIN_PASSWORD='strong' \
ADMIN_NAME='First editor' \
npm run db:seed
```

`scripts/seed.ts` upserts a site row + the admin. Won't create
duplicates.

## Adding a new role

If you need e.g. a `reviewer` role:

1. Add to the enum in `lib/users.ts::roleSchema`.
2. Add a `<option>` in `NewUserButton.tsx` and `UserEditor.tsx`.
3. Update `authorized` in `lib/auth.config.ts` if the role needs a
   route guard.
4. Add `requireXyz()` helpers as needed.

## Auth in server actions

```tsx
import { auth } from '@/lib/auth';

export async function doThing() {
  const session = await auth();
  if (!session?.user) return { error: 'Not authenticated.' };
  // …
}
```

## Sessions

- Strategy: `jwt` (no session table needed for auth beyond the initial
  seed).
- Cookie lifetime: default (2 weeks).
- Change in `lib/auth.config.ts` if you want longer.

## Password reset flow

Not built. If you want editor-triggered password reset:

1. Add a `password_reset_tokens` table.
2. Add a `/api/auth/forgot` route that mints a token, emails a link.
3. Add a `/admin/reset/[token]` page that consumes the token and calls
   a variant of `changePassword`.

Skipped for now because admin-triggered "reset password" from
`/admin/users/[id]` covers the immediate need.
