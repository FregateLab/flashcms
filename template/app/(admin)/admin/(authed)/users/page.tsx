import Link from 'next/link';
import { auth } from '@/lib/auth';
import { listUsers } from '@/lib/users';
import NewUserButton from './NewUserButton';

function formatDate(d: Date | string | null) {
  if (!d) return '-';
  const date = d instanceof Date ? d : new Date(d);
  if (isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default async function AdminUsersPage() {
  const session = await auth();
  const me = session?.user;
  const rows = await listUsers();

  return (
    <>
      <div className="admin-toolbar">
        <div>
          <h1 className="admin-h1">Users</h1>
          <p className="admin-lede">
            People who can sign in to the CMS.{' '}
            <strong>{rows.length}</strong> total.
          </p>
        </div>
        <NewUserButton />
      </div>

      <table className="admin-table">
        <thead>
          <tr>
            <th>User</th>
            <th className="narrow">Role</th>
            <th className="narrow">Added</th>
            <th className="narrow right"></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const isMe = row.id === me?.id;
            const initial = (row.name ?? row.email).charAt(0).toUpperCase();
            return (
              <tr key={row.id}>
                <td>
                  <div className="tcell-primary">
                    <span
                      className="tcell-primary__icon"
                      style={{
                        background: 'var(--sfh-navy-soft)',
                        color: 'var(--sfh-navy)',
                        fontWeight: 700,
                        borderColor: 'transparent',
                      }}
                    >
                      {initial}
                    </span>
                    <span className="tcell-primary__lines">
                      <span
                        className="tcell-primary__title"
                        style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                      >
                        {row.name ?? row.email}
                        {isMe && (
                          <span
                            className="admin-pill admin-pill--info"
                            style={{ padding: '2px 8px' }}
                          >
                            You
                          </span>
                        )}
                      </span>
                      <span className="tcell-primary__sub">{row.email}</span>
                    </span>
                  </div>
                </td>
                <td className="narrow">
                  <span
                    className={
                      row.role === 'admin'
                        ? 'admin-pill admin-pill--accent'
                        : 'admin-pill admin-pill--neutral'
                    }
                  >
                    {row.role}
                  </span>
                </td>
                <td className="narrow tcell-date">
                  {formatDate(row.createdAt)}
                </td>
                <td className="narrow right">
                  <Link
                    className="admin-btn admin-btn--ghost"
                    href={`/admin/users/${row.id}`}
                    style={{ padding: '5px 12px', fontSize: 12 }}
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
}
