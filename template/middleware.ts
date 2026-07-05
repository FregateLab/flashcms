import NextAuth from 'next-auth';
import { authConfig } from '@/lib/auth.config';

// Middleware runs on the Edge Runtime, so it can only use the
// Edge-safe subset of the Auth.js config (no adapter, no bcrypt).
export const { auth: middleware } = NextAuth(authConfig);

export default middleware((_req) => {
  // The `authorized` callback in authConfig handles the actual
  // redirect logic; middleware just needs to run auth so the
  // authorized() hook fires.
  return undefined;
});

export const config = {
  matcher: ['/admin/:path*'],
};
