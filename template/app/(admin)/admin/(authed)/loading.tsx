/**
 * Route-level fallback rendered by Next while a segment inside the
 * authed admin is streaming. Complements <TopProgress /> — the bar
 * shows the click was registered, this shows the content shape.
 */
export default function AuthedAdminLoading() {
  return (
    <div className="admin-loading" aria-busy="true" aria-live="polite">
      <div className="admin-loading__title" />
      <div className="admin-loading__lede" />
      <div className="admin-loading__grid">
        <div className="admin-loading__card" />
        <div className="admin-loading__card" />
        <div className="admin-loading__card" />
      </div>
      <span className="visually-hidden">Loading…</span>
    </div>
  );
}
