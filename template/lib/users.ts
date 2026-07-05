'use server';

import bcrypt from 'bcryptjs';
import { asc, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { db, users } from '@/db';

export type UserFormState = { error?: string; ok?: boolean; id?: string };

const emailSchema = z.string().email();
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters.')
  .max(200);
const nameSchema = z.string().min(1).max(120);
const roleSchema = z.enum(['admin', 'editor']);

// ---- reads --------------------------------------------------------------
export async function listUsers() {
  return db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      image: users.image,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(asc(users.createdAt));
}

export async function getUserById(id: string) {
  const [row] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, id));
  return row ?? null;
}

// ---- helpers ------------------------------------------------------------
async function requireAdmin() {
  const session = await auth();
  const user = session?.user;
  if (!user) throw new Error('Not authenticated.');
  const role = (user as { role?: string }).role;
  if (role !== 'admin') throw new Error('Admins only.');
  return user;
}

// ---- create -------------------------------------------------------------
export async function createUser(
  _prev: UserFormState,
  formData: FormData,
): Promise<UserFormState> {
  try {
    await requireAdmin();
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Forbidden.' };
  }

  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const name = String(formData.get('name') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const roleRaw = String(formData.get('role') ?? 'editor');

  const parsed = z
    .object({
      email: emailSchema,
      name: nameSchema,
      password: passwordSchema,
      role: roleSchema,
    })
    .safeParse({ email, name, password, role: roleRaw });
  if (!parsed.success) {
    return {
      error: parsed.error.issues.map((i) => i.message).join('; '),
    };
  }

  const [existing] = await db.select().from(users).where(eq(users.email, email));
  if (existing) return { error: 'A user with that email already exists.' };

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  const [row] = await db
    .insert(users)
    .values({
      email: parsed.data.email,
      name: parsed.data.name,
      passwordHash,
      role: parsed.data.role,
    })
    .returning({ id: users.id });

  revalidatePath('/admin/users');
  return { ok: true, id: row.id };
}

// ---- profile (name) ----------------------------------------------------
export async function updateUserProfile(
  _prev: UserFormState,
  formData: FormData,
): Promise<UserFormState> {
  const session = await auth();
  const me = session?.user;
  if (!me) return { error: 'Not authenticated.' };
  const myRole = (me as { role?: string }).role;

  const id = String(formData.get('id') ?? '');
  const name = String(formData.get('name') ?? '').trim();

  if (!id) return { error: 'Missing user id.' };
  if (myRole !== 'admin' && id !== me.id) {
    return { error: 'You can only edit your own profile.' };
  }
  const parsed = nameSchema.safeParse(name);
  if (!parsed.success) return { error: 'Name is required.' };

  await db.update(users).set({ name: parsed.data }).where(eq(users.id, id));

  revalidatePath('/admin/users');
  revalidatePath('/admin/account');
  return { ok: true };
}

// ---- role --------------------------------------------------------------
export async function updateUserRole(
  _prev: UserFormState,
  formData: FormData,
): Promise<UserFormState> {
  try {
    const me = await requireAdmin();
    const id = String(formData.get('id') ?? '');
    const roleRaw = String(formData.get('role') ?? 'editor');
    const parsed = roleSchema.safeParse(roleRaw);
    if (!parsed.success) return { error: 'Invalid role.' };

    if (id === me.id && parsed.data !== 'admin') {
      return { error: "You can't downgrade your own admin role." };
    }

    await db.update(users).set({ role: parsed.data }).where(eq(users.id, id));
    revalidatePath('/admin/users');
    return { ok: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Forbidden.' };
  }
}

// ---- password ----------------------------------------------------------
export async function changePassword(
  _prev: UserFormState,
  formData: FormData,
): Promise<UserFormState> {
  const session = await auth();
  const me = session?.user;
  if (!me) return { error: 'Not authenticated.' };
  const myRole = (me as { role?: string }).role;

  const id = String(formData.get('id') ?? '');
  const password = String(formData.get('password') ?? '');

  if (!id) return { error: 'Missing user id.' };
  if (myRole !== 'admin' && id !== me.id) {
    return { error: 'You can only change your own password.' };
  }
  const parsed = passwordSchema.safeParse(password);
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join('; ') };
  }

  const hash = await bcrypt.hash(parsed.data, 12);
  await db.update(users).set({ passwordHash: hash }).where(eq(users.id, id));

  revalidatePath('/admin/users');
  revalidatePath('/admin/account');
  return { ok: true };
}

// ---- delete ------------------------------------------------------------
export async function deleteUser(
  _prev: UserFormState,
  formData: FormData,
): Promise<UserFormState> {
  try {
    const me = await requireAdmin();
    const id = String(formData.get('id') ?? '');
    if (!id) return { error: 'Missing user id.' };
    if (id === me.id) return { error: "You can't delete your own account." };

    await db.delete(users).where(eq(users.id, id));
    revalidatePath('/admin/users');
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Forbidden.' };
  }
  redirect('/admin/users');
}
