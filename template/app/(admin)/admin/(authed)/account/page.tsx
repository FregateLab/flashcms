import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getUserById } from '@/lib/users';
import AccountEditor from './AccountEditor';

export default async function AdminAccountPage() {
  const session = await auth();
  const user = session?.user;
  if (!user?.id) redirect('/admin/login');
  const row = await getUserById(user.id);
  if (!row) redirect('/admin/login');

  return (
    <>
      <div className="admin-toolbar">
        <div>
          <h1 className="admin-h1">My account</h1>
          <p className="admin-lede">
            Update your name and change your password.
          </p>
        </div>
      </div>

      <AccountEditor
        userId={row.id}
        email={row.email}
        role={row.role}
        initialName={row.name ?? ''}
      />
    </>
  );
}
