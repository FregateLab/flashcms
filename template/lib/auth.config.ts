import type { NextAuthConfig } from 'next-auth';

// Edge-safe subset of the Auth.js config: no adapter, no credential
// callback (which needs bcrypt = Node crypto). Middleware imports only
// this file so it stays Edge-compatible.
export const authConfig: NextAuthConfig = {
  session: { strategy: 'jwt' },
  pages: { signIn: '/admin/login' },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const isAdmin = pathname.startsWith('/admin');
      const isLogin = pathname === '/admin/login';
      const isUsers = pathname.startsWith('/admin/users');
      const signedIn = !!auth;
      const role = (auth?.user as { role?: string } | undefined)?.role;

      if (isAdmin && !isLogin && !signedIn) {
        const url = new URL('/admin/login', request.nextUrl.origin);
        url.searchParams.set('callbackUrl', pathname);
        return Response.redirect(url);
      }
      if (isLogin && signedIn) {
        return Response.redirect(new URL('/admin', request.nextUrl.origin));
      }
      // Route-level role guard: /admin/users is admins only.
      if (isUsers && signedIn && role !== 'admin') {
        return Response.redirect(new URL('/admin', request.nextUrl.origin));
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as { role?: string }).role = token.role as string | undefined;
      }
      return session;
    },
  },
};
