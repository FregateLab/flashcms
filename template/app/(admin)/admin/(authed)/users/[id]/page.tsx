import { notFound } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { getUserById } from '@/lib/users';
import UserEditor from './UserEditor';

export default async function AdminEditUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const target = await getUserById(id);
  if (!target) notFound();

  const isMe = session?.user?.id === target.id;

  return (
    <>
      <div className="admin-toolbar">
        <div>
          <Link
            href="/admin/users"
            style={{
              color: 'var(--admin-ink-2)',
              fontSize: 12,
              display: 'inline-block',
              marginBottom: 6,
            }}
          >
            ← Users
          </Link>
          <h1 className="admin-h1">
            {target.name ?? target.email}
          </h1>
          <p className="admin-lede">
            {target.email} · {target.role}
          </p>
        </div>
      </div>

      <UserEditor
        userId={target.id}
        initialName={target.name ?? ''}
        initialRole={target.role as 'admin' | 'editor'}
        isMe={isMe}
      />
    </>
  );
}
