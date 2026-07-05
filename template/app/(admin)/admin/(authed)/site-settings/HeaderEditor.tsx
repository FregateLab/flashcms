'use client';

import { useActionState, useState } from 'react';
import type { HeaderConfig, NavItem, NavLink } from '@/lib/site-settings';
import {
  saveHeaderConfig,
  type SiteSettingsState,
} from '@/lib/site-settings-actions';

export default function HeaderEditor({
  initial,
}: {
  initial: HeaderConfig;
}) {
  const [cfg, setCfg] = useState<HeaderConfig>(structuredClone(initial));
  const [state, formAction, pending] = useActionState<
    SiteSettingsState,
    FormData
  >(saveHeaderConfig, {});

  // ----- Primary nav ---------------------------------------------------
  function updateNavItem(idx: number, patch: Partial<NavItem>) {
    setCfg((c) => ({
      ...c,
      primaryNav: c.primaryNav.map((item, i) =>
        i === idx ? { ...item, ...patch } : item,
      ),
    }));
  }
  function moveNav(idx: number, dir: -1 | 1) {
    setCfg((c) => {
      const next = [...c.primaryNav];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return c;
      [next[idx], next[target]] = [next[target]!, next[idx]!];
      return { ...c, primaryNav: next };
    });
  }
  function removeNav(idx: number) {
    setCfg((c) => ({
      ...c,
      primaryNav: c.primaryNav.filter((_, i) => i !== idx),
    }));
  }
  function addNav() {
    setCfg((c) => ({
      ...c,
      primaryNav: [
        ...c.primaryNav,
        { label: 'New item', href: '/', megaKey: '' },
      ],
    }));
  }

  // ----- Mega columns -------------------------------------------------
  function addMegaLink(key: string) {
    setCfg((c) => ({
      ...c,
      mega: {
        ...c.mega,
        [key]: [...(c.mega[key] ?? []), { label: 'New link', href: '/' }],
      },
    }));
  }
  function updateMegaLink(key: string, idx: number, patch: Partial<NavLink>) {
    setCfg((c) => ({
      ...c,
      mega: {
        ...c.mega,
        [key]: (c.mega[key] ?? []).map((l, i) =>
          i === idx ? { ...l, ...patch } : l,
        ),
      },
    }));
  }
  function removeMegaLink(key: string, idx: number) {
    setCfg((c) => ({
      ...c,
      mega: {
        ...c.mega,
        [key]: (c.mega[key] ?? []).filter((_, i) => i !== idx),
      },
    }));
  }
  function moveMegaLink(key: string, idx: number, dir: -1 | 1) {
    setCfg((c) => {
      const arr = [...(c.mega[key] ?? [])];
      const target = idx + dir;
      if (target < 0 || target >= arr.length) return c;
      [arr[idx], arr[target]] = [arr[target]!, arr[idx]!];
      return { ...c, mega: { ...c.mega, [key]: arr } };
    });
  }
  function addMegaGroup(key: string) {
    setCfg((c) => ({ ...c, mega: { ...c.mega, [key]: [] } }));
  }

  const megaKeys = Object.keys(cfg.mega);

  return (
    <form action={formAction} style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <input type="hidden" name="config" value={JSON.stringify(cfg)} />

      {/* Primary nav */}
      <section className="admin-card">
        <SectionHead
          title="Primary navigation"
          hint="Items shown in the top-right of the site header. Use megaKey to bind a group of dropdown links."
        />
        <div className="siteSet__list">
          {cfg.primaryNav.map((item, idx) => (
            <div key={idx} className="siteSet__row">
              <div className="siteSet__cells">
                <Field label="Label">
                  <input
                    className="admin-input"
                    value={item.label}
                    onChange={(e) => updateNavItem(idx, { label: e.target.value })}
                  />
                </Field>
                <Field label="Href">
                  <input
                    className="admin-input"
                    value={item.href}
                    onChange={(e) => updateNavItem(idx, { href: e.target.value })}
                  />
                </Field>
                <Field label="Mega key (optional)">
                  <input
                    className="admin-input"
                    value={item.megaKey ?? ''}
                    placeholder="about"
                    onChange={(e) => updateNavItem(idx, { megaKey: e.target.value })}
                  />
                </Field>
              </div>
              <RowActions
                onUp={() => moveNav(idx, -1)}
                onDown={() => moveNav(idx, 1)}
                onDelete={() => removeNav(idx)}
              />
            </div>
          ))}
        </div>
        <button type="button" className="admin-btn admin-btn--ghost" onClick={addNav}>
          + Add nav item
        </button>
      </section>

      {/* Mega columns */}
      <section className="admin-card">
        <SectionHead
          title="Mega menu columns"
          hint="Groups of links that appear when hovering a primary nav item. Match megaKey above with the column key here."
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {megaKeys.map((key) => (
            <div key={key} className="siteSet__mega">
              <div className="siteSet__megaHead">
                <span className="siteSet__key">{key}</span>
                <button
                  type="button"
                  className="admin-btn admin-btn--ghost"
                  onClick={() => addMegaLink(key)}
                >
                  + Add link
                </button>
              </div>
              <div className="siteSet__list">
                {(cfg.mega[key] ?? []).map((link, idx) => (
                  <div key={idx} className="siteSet__row">
                    <div className="siteSet__cells">
                      <Field label="Label">
                        <input
                          className="admin-input"
                          value={link.label}
                          onChange={(e) =>
                            updateMegaLink(key, idx, { label: e.target.value })
                          }
                        />
                      </Field>
                      <Field label="Href">
                        <input
                          className="admin-input"
                          value={link.href}
                          onChange={(e) =>
                            updateMegaLink(key, idx, { href: e.target.value })
                          }
                        />
                      </Field>
                      <Field label="External?">
                        <label style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 13 }}>
                          <input
                            type="checkbox"
                            checked={!!link.external}
                            onChange={(e) =>
                              updateMegaLink(key, idx, {
                                external: e.target.checked,
                              })
                            }
                          />
                          Opens in new tab
                        </label>
                      </Field>
                    </div>
                    <RowActions
                      onUp={() => moveMegaLink(key, idx, -1)}
                      onDown={() => moveMegaLink(key, idx, 1)}
                      onDelete={() => removeMegaLink(key, idx)}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
          <AddMegaGroup existing={megaKeys} onAdd={addMegaGroup} />
        </div>
      </section>

      <SaveBar
        state={state}
        pending={pending}
        onReset={() => setCfg(structuredClone(initial))}
      />
    </form>
  );
}

// ----- Small shared bits ---------------------------------------------
function SectionHead({ title, hint }: { title: string; hint?: string }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <span className="admin-card__eyebrow">{title}</span>
      {hint && (
        <p className="admin-lede" style={{ fontSize: 12.5, marginTop: 4 }}>
          {hint}
        </p>
      )}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="siteSet__field">
      <span className="siteSet__fieldLabel">{label}</span>
      {children}
    </div>
  );
}

function RowActions({
  onUp,
  onDown,
  onDelete,
}: {
  onUp: () => void;
  onDown: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="siteSet__actions">
      <button type="button" className="siteSet__iconBtn" onClick={onUp} title="Move up">
        ↑
      </button>
      <button type="button" className="siteSet__iconBtn" onClick={onDown} title="Move down">
        ↓
      </button>
      <button
        type="button"
        className="siteSet__iconBtn siteSet__iconBtn--danger"
        onClick={onDelete}
        title="Remove"
      >
        ×
      </button>
    </div>
  );
}

function AddMegaGroup({
  existing,
  onAdd,
}: {
  existing: string[];
  onAdd: (key: string) => void;
}) {
  const [name, setName] = useState('');
  return (
    <div
      style={{
        display: 'flex',
        gap: 8,
        alignItems: 'center',
        padding: 12,
        border: '1px dashed var(--admin-border)',
        borderRadius: 10,
      }}
    >
      <input
        className="admin-input"
        placeholder="new-key (e.g. resources)"
        value={name}
        onChange={(e) => setName(e.target.value.trim())}
        style={{ maxWidth: 240 }}
      />
      <button
        type="button"
        className="admin-btn admin-btn--ghost"
        disabled={!name || existing.includes(name)}
        onClick={() => {
          onAdd(name);
          setName('');
        }}
      >
        + Add mega group
      </button>
    </div>
  );
}

export function SaveBar({
  state,
  pending,
  onReset,
}: {
  state: SiteSettingsState;
  pending: boolean;
  onReset?: () => void;
}) {
  return (
    <div
      className="admin-card"
      style={{
        position: 'sticky',
        bottom: 20,
        display: 'flex',
        gap: 10,
        alignItems: 'center',
        justifyContent: 'flex-end',
        boxShadow: 'var(--admin-shadow-lg)',
      }}
    >
      {state.error && (
        <p className="admin-error" style={{ margin: 0, marginRight: 'auto' }}>
          {state.error}
        </p>
      )}
      {state.ok && (
        <p
          className="admin-lede"
          style={{ margin: 0, marginRight: 'auto', color: '#166534' }}
        >
          Saved. Refresh the public site to see the change.
        </p>
      )}
      {onReset && (
        <button
          type="button"
          className="admin-btn admin-btn--ghost"
          onClick={onReset}
        >
          Reset changes
        </button>
      )}
      <button type="submit" className="admin-btn" disabled={pending}>
        {pending ? 'Saving…' : 'Publish changes'}
      </button>
    </div>
  );
}
