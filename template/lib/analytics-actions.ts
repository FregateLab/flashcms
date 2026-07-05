'use server';

import { revalidatePath } from 'next/cache';
import { sql } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { analyticsEvents, analyticsVitals, db } from '@/db';

export type CleanupState = {
  ok?: boolean;
  error?: string;
  deletedEvents?: number;
  deletedVitals?: number;
};

/**
 * Manual purge — deletes analytics rows older than `days`. Admin-only.
 */
export async function cleanupOldAnalytics(
  _prev: CleanupState,
  formData: FormData,
): Promise<CleanupState> {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== 'admin') return { error: 'Admins only.' };

  const rawDays = Number(formData.get('days') ?? '90');
  const days = Number.isFinite(rawDays) && rawDays > 0 ? Math.min(Math.round(rawDays), 3650) : 90;
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  try {
    const eRes = await db
      .delete(analyticsEvents)
      .where(sql`${analyticsEvents.createdAt} < ${cutoff}`)
      .returning({ id: analyticsEvents.id });
    const vRes = await db
      .delete(analyticsVitals)
      .where(sql`${analyticsVitals.createdAt} < ${cutoff}`)
      .returning({ id: analyticsVitals.id });
    revalidatePath('/admin');
    return {
      ok: true,
      deletedEvents: eRes.length,
      deletedVitals: vRes.length,
    };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : 'Cleanup failed.',
    };
  }
}
