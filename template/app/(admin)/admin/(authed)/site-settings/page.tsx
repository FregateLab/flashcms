import { getFooterConfig, getHeaderConfig } from '@/lib/site-settings';
import SiteSettingsEditor from './SiteSettingsEditor';

export default async function AdminSiteSettingsPage() {
  const [header, footer] = await Promise.all([
    getHeaderConfig(),
    getFooterConfig(),
  ]);
  return (
    <>
      <div className="admin-toolbar">
        <div>
          <h1 className="admin-h1">Site settings</h1>
          <p className="admin-lede">
            Edit the header navigation and footer that appear on every
            public page.
          </p>
        </div>
      </div>
      <SiteSettingsEditor initialHeader={header} initialFooter={footer} />
    </>
  );
}
