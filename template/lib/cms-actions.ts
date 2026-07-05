'use server';

import { createHmac, randomUUID } from 'node:crypto';
import { auth } from '@/lib/auth';
import { getRemoteVersion } from '@/lib/cms-version';

export type CmsUpdateState = {
  ok?: boolean;
  error?: string;
  triggeredAt?: string;
  targetVersion?: string;
  webhookStatus?: number;
};

/**
 * Fires the deploy webhook configured for this environment. The webhook
 * is expected to be a URL provided by the deploy platform (Dokwe, Vercel,
 * a GitHub Actions workflow_dispatch, etc.) that triggers a fresh
 * build of the app after pulling the latest CMS files.
 *
 * We do NOT rewrite files here — Node runtimes on managed platforms
 * are effectively read-only, and even when writable, a running process
 * won't hot-swap imported modules. The whole flow is a "please rebuild"
 * message to the deploy layer.
 */
export async function triggerCmsUpdate(
  _prev: CmsUpdateState,
  _formData: FormData,
): Promise<CmsUpdateState> {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== 'admin') return { error: 'Admins only.' };

  const webhookUrl = process.env.CMS_UPDATE_WEBHOOK_URL;
  if (!webhookUrl) {
    return {
      error:
        'CMS_UPDATE_WEBHOOK_URL is not set. Configure a deploy webhook on your host and add it to the environment.',
    };
  }

  const remote = await getRemoteVersion();
  const targetVersion = remote?.version;

  const body = JSON.stringify({
    id: randomUUID(),
    triggeredAt: new Date().toISOString(),
    targetVersion: targetVersion ?? null,
    triggeredBy: session?.user?.email ?? null,
    source: 'cms-admin',
  });

  const headers: Record<string, string> = {
    'content-type': 'application/json',
    'user-agent': 'sfh-cms-updater/1.0',
  };

  const secret = process.env.CMS_UPDATE_WEBHOOK_SECRET;
  if (secret) {
    const sig = createHmac('sha256', secret).update(body).digest('hex');
    headers['x-cms-signature'] = `sha256=${sig}`;
  }

  try {
    const res = await fetch(webhookUrl, { method: 'POST', headers, body });
    if (!res.ok) {
      return {
        error: `Webhook responded ${res.status} ${res.statusText}`,
        webhookStatus: res.status,
      };
    }
    return {
      ok: true,
      triggeredAt: new Date().toISOString(),
      targetVersion,
      webhookStatus: res.status,
    };
  } catch (err) {
    return {
      error:
        err instanceof Error
          ? err.message
          : 'Webhook call failed. Check network + secret.',
    };
  }
}
