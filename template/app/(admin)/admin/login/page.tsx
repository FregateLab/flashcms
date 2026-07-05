import { Suspense } from 'react';
import LoginForm from './LoginForm';

export default function AdminLoginPage() {
  return (
    <div className="admin-login-wrap">
      <aside className="admin-login__brand" aria-hidden="true">
        <div className="admin-login__markline">
          <span className="admin-brand__mark">S</span>
          <span>
            <span className="admin-brand__title">SFH CMS</span>
            <span className="admin-brand__sub">Society for Family Health</span>
          </span>
        </div>

        <div className="admin-login__pitch">
          <h2>
            Public health,<br />
            <em>edited by you</em>.
          </h2>
          <p>
            The content platform behind SFH’s marketing sites: pages,
            posts, media, and the block library that ties them together.
          </p>
        </div>

        <p className="admin-login__foot">
          © {new Date().getFullYear()} Society for Family Health
        </p>
      </aside>

      <section className="admin-login__form">
        <div className="admin-login-card">
          <h1 className="admin-h1">Welcome back.</h1>
          <p className="admin-lede">
            Sign in with your SFH credentials to continue.
          </p>
          <Suspense fallback={<p className="admin-lede">Loading…</p>}>
            <LoginForm />
          </Suspense>
        </div>
      </section>
    </div>
  );
}
