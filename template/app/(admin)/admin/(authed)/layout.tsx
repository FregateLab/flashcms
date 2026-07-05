import Link from 'next/link';
import { auth, signOut } from '@/lib/auth';

// Chrome shared by every authenticated admin page. /admin/login lives
// outside this route group so it has no sidebar.
export default async function AuthedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const user = session?.user;
  const role = (user as { role?: string } | undefined)?.role;
  const isAdmin = role === 'admin';
  const initial = (user?.name || user?.email || 'S').charAt(0).toUpperCase();

  return (
    <div className="admin-shell-wrap">
      <aside className="admin-sidebar" aria-label="Primary navigation">
        <Link href="/admin" className="admin-brand">
          <span className="admin-brand__mark" aria-hidden="true">S</span>
          <span>
            <span className="admin-brand__title">SFH CMS</span>
            <span className="admin-brand__sub">Society for Family Health</span>
          </span>
        </Link>

        <nav className="admin-nav" aria-label="Admin">
          <span className="admin-nav__section">Overview</span>
          <Link href="/admin">Dashboard</Link>

          <span className="admin-nav__section">Content</span>
          <Link href="/admin/pages">Pages</Link>
          <Link href="/admin/posts">Posts</Link>
          <Link href="/admin/media">Media</Link>

          <span className="admin-nav__section">Site</span>
          <Link href="/admin/site-settings">Header & Footer</Link>

          {isAdmin && (
            <>
              <span className="admin-nav__section">Team</span>
              <Link href="/admin/users">Users</Link>
            </>
          )}
        </nav>

        <div className="admin-user">
          <Link
            href="/admin/account"
            className="admin-user__row"
            style={{ borderRadius: 8, textDecoration: 'none' }}
          >
            <div className="admin-user__avatar" aria-hidden="true">
              {initial}
            </div>
            <div className="admin-user__meta">
              <span className="admin-user__name">
                {user?.name ?? user?.email}
              </span>
              {user?.name && user?.email && (
                <span className="admin-user__email">{user.email}</span>
              )}
            </div>
          </Link>
          <form
            action={async () => {
              'use server';
              await signOut({ redirectTo: '/admin/login' });
            }}
          >
            <button
              className="admin-btn admin-btn--ghost"
              type="submit"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>

      <main className="admin-main">
        <div className="admin-shell">{children}</div>
      </main>
    </div>
  );
}
