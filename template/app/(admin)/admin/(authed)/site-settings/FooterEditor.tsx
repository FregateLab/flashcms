'use client';

import { useActionState, useState } from 'react';
import MediaField from '@/components/MediaField';
import type {
  FooterColumn,
  FooterConfig,
  NavLink,
} from '@/lib/site-settings';
import {
  saveFooterConfig,
  type SiteSettingsState,
} from '@/lib/site-settings-actions';
import { SaveBar } from './HeaderEditor';

export default function FooterEditor({
  initial,
}: {
  initial: FooterConfig;
}) {
  const [cfg, setCfg] = useState<FooterConfig>(structuredClone(initial));
  const [state, formAction, pending] = useActionState<
    SiteSettingsState,
    FormData
  >(saveFooterConfig, {});

  function updateColumnLink(
    ci: number,
    li: number,
    patch: Partial<NavLink>,
  ) {
    setCfg((c) => ({
      ...c,
      columns: c.columns.map((col, i) =>
        i === ci
          ? {
              ...col,
              links: col.links.map((l, j) => (j === li ? { ...l, ...patch } : l)),
            }
          : col,
      ),
    }));
  }
  function moveColumnLink(ci: number, li: number, dir: -1 | 1) {
    setCfg((c) => {
      const arr = [...c.columns[ci]!.links];
      const t = li + dir;
      if (t < 0 || t >= arr.length) return c;
      [arr[li], arr[t]] = [arr[t]!, arr[li]!];
      return {
        ...c,
        columns: c.columns.map((col, i) =>
          i === ci ? { ...col, links: arr } : col,
        ),
      };
    });
  }
  function removeColumnLink(ci: number, li: number) {
    setCfg((c) => ({
      ...c,
      columns: c.columns.map((col, i) =>
        i === ci ? { ...col, links: col.links.filter((_, j) => j !== li) } : col,
      ),
    }));
  }
  function addColumnLink(ci: number) {
    setCfg((c) => ({
      ...c,
      columns: c.columns.map((col, i) =>
        i === ci
          ? {
              ...col,
              links: [...col.links, { label: 'New link', href: '/' }],
            }
          : col,
      ),
    }));
  }
  function updateColumnTitle(ci: number, title: string) {
    setCfg((c) => ({
      ...c,
      columns: c.columns.map((col, i) => (i === ci ? { ...col, title } : col)),
    }));
  }
  function addColumn() {
    setCfg((c) => ({
      ...c,
      columns: [...c.columns, { title: 'New column', links: [] }],
    }));
  }
  function moveColumn(ci: number, dir: -1 | 1) {
    setCfg((c) => {
      const arr = [...c.columns];
      const t = ci + dir;
      if (t < 0 || t >= arr.length) return c;
      [arr[ci], arr[t]] = [arr[t]!, arr[ci]!];
      return { ...c, columns: arr };
    });
  }
  function removeColumn(ci: number) {
    setCfg((c) => ({
      ...c,
      columns: c.columns.filter((_, i) => i !== ci),
    }));
  }

  // ---- Bottom links --------------------------------------------------
  function updateBottomLink(idx: number, patch: Partial<NavLink>) {
    setCfg((c) => ({
      ...c,
      bottom: {
        ...c.bottom,
        links: c.bottom.links.map((l, i) => (i === idx ? { ...l, ...patch } : l)),
      },
    }));
  }
  function moveBottomLink(idx: number, dir: -1 | 1) {
    setCfg((c) => {
      const arr = [...c.bottom.links];
      const t = idx + dir;
      if (t < 0 || t >= arr.length) return c;
      [arr[idx], arr[t]] = [arr[t]!, arr[idx]!];
      return { ...c, bottom: { ...c.bottom, links: arr } };
    });
  }
  function removeBottomLink(idx: number) {
    setCfg((c) => ({
      ...c,
      bottom: {
        ...c.bottom,
        links: c.bottom.links.filter((_, i) => i !== idx),
      },
    }));
  }
  function addBottomLink() {
    setCfg((c) => ({
      ...c,
      bottom: {
        ...c.bottom,
        links: [...c.bottom.links, { label: 'New link', href: '/' }],
      },
    }));
  }

  return (
    <form action={formAction} style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <input type="hidden" name="config" value={JSON.stringify(cfg)} />

      {/* Newsletter */}
      <section className="admin-card">
        <SectionHead
          title="Newsletter signup"
          hint="The quarterly bulletin form at the top of the footer."
        />
        <div className="siteSet__grid">
          <Field label="Eyebrow">
            <input
              className="admin-input"
              value={cfg.newsletter.eyebrow}
              onChange={(e) =>
                setCfg((c) => ({
                  ...c,
                  newsletter: { ...c.newsletter, eyebrow: e.target.value },
                }))
              }
            />
          </Field>
          <Field label="Title">
            <input
              className="admin-input"
              value={cfg.newsletter.title}
              onChange={(e) =>
                setCfg((c) => ({
                  ...c,
                  newsletter: { ...c.newsletter, title: e.target.value },
                }))
              }
            />
          </Field>
          <Field label="Email placeholder">
            <input
              className="admin-input"
              value={cfg.newsletter.placeholder}
              onChange={(e) =>
                setCfg((c) => ({
                  ...c,
                  newsletter: { ...c.newsletter, placeholder: e.target.value },
                }))
              }
            />
          </Field>
          <Field label="Submit label">
            <input
              className="admin-input"
              value={cfg.newsletter.submitLabel}
              onChange={(e) =>
                setCfg((c) => ({
                  ...c,
                  newsletter: { ...c.newsletter, submitLabel: e.target.value },
                }))
              }
            />
          </Field>
          <div style={{ gridColumn: '1 / -1' }}>
            <Field label="Consent HTML">
              <textarea
                className="admin-input"
                rows={2}
                value={cfg.newsletter.consentHtml}
                onChange={(e) =>
                  setCfg((c) => ({
                    ...c,
                    newsletter: { ...c.newsletter, consentHtml: e.target.value },
                  }))
                }
              />
            </Field>
          </div>
        </div>
      </section>

      {/* Brand */}
      <section className="admin-card">
        <SectionHead title="Brand block" hint="Logo and tagline shown next to the link columns." />
        <div className="siteSet__grid">
          <div style={{ gridColumn: '1 / -1' }}>
            <Field label="Logo">
              <MediaField
                value={cfg.brand.imageUrl}
                onChange={(next) =>
                  setCfg((c) => ({
                    ...c,
                    brand: { ...c.brand, imageUrl: next },
                  }))
                }
              />
            </Field>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <Field label="Tagline">
              <textarea
                className="admin-input"
                rows={2}
                value={cfg.brand.tagline}
                onChange={(e) =>
                  setCfg((c) => ({
                    ...c,
                    brand: { ...c.brand, tagline: e.target.value },
                  }))
                }
              />
            </Field>
          </div>
        </div>
      </section>

      {/* Columns */}
      <section className="admin-card">
        <SectionHead
          title="Link columns"
          hint="Groups of links (About / Countries / Connect etc.)."
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {cfg.columns.map((col: FooterColumn, ci) => (
            <div key={ci} className="siteSet__mega">
              <div className="siteSet__megaHead">
                <input
                  className="admin-input"
                  style={{ maxWidth: 240, fontWeight: 600 }}
                  value={col.title}
                  onChange={(e) => updateColumnTitle(ci, e.target.value)}
                />
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <button
                    type="button"
                    className="siteSet__iconBtn"
                    onClick={() => moveColumn(ci, -1)}
                    title="Move column up"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="siteSet__iconBtn"
                    onClick={() => moveColumn(ci, 1)}
                    title="Move column down"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    className="siteSet__iconBtn siteSet__iconBtn--danger"
                    onClick={() => removeColumn(ci)}
                    title="Remove column"
                  >
                    ×
                  </button>
                  <button
                    type="button"
                    className="admin-btn admin-btn--ghost"
                    onClick={() => addColumnLink(ci)}
                  >
                    + Add link
                  </button>
                </div>
              </div>
              <div className="siteSet__list">
                {col.links.map((link, li) => (
                  <div key={li} className="siteSet__row">
                    <div className="siteSet__cells">
                      <Field label="Label">
                        <input
                          className="admin-input"
                          value={link.label}
                          onChange={(e) =>
                            updateColumnLink(ci, li, { label: e.target.value })
                          }
                        />
                      </Field>
                      <Field label="Href">
                        <input
                          className="admin-input"
                          value={link.href}
                          onChange={(e) =>
                            updateColumnLink(ci, li, { href: e.target.value })
                          }
                        />
                      </Field>
                      <Field label="Icon URL">
                        <input
                          className="admin-input"
                          placeholder="/v1/assets/flags/…"
                          value={link.iconUrl ?? ''}
                          onChange={(e) =>
                            updateColumnLink(ci, li, {
                              iconUrl: e.target.value || undefined,
                            })
                          }
                        />
                      </Field>
                      <Field label="External?">
                        <label
                          style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 13 }}
                        >
                          <input
                            type="checkbox"
                            checked={!!link.external}
                            onChange={(e) =>
                              updateColumnLink(ci, li, {
                                external: e.target.checked,
                              })
                            }
                          />
                          Opens in new tab
                        </label>
                      </Field>
                    </div>
                    <div className="siteSet__actions">
                      <button
                        type="button"
                        className="siteSet__iconBtn"
                        onClick={() => moveColumnLink(ci, li, -1)}
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        className="siteSet__iconBtn"
                        onClick={() => moveColumnLink(ci, li, 1)}
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        className="siteSet__iconBtn siteSet__iconBtn--danger"
                        onClick={() => removeColumnLink(ci, li)}
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <button type="button" className="admin-btn admin-btn--ghost" onClick={addColumn}>
            + Add column
          </button>
        </div>
      </section>

      {/* Bottom */}
      <section className="admin-card">
        <SectionHead
          title="Bottom strip"
          hint="Copyright line and legal links across the very bottom."
        />
        <div className="siteSet__grid">
          <div style={{ gridColumn: '1 / -1' }}>
            <Field label="Copyright">
              <input
                className="admin-input"
                value={cfg.bottom.copyright}
                onChange={(e) =>
                  setCfg((c) => ({
                    ...c,
                    bottom: { ...c.bottom, copyright: e.target.value },
                  }))
                }
              />
            </Field>
          </div>
        </div>
        <div className="siteSet__list" style={{ marginTop: 12 }}>
          {cfg.bottom.links.map((link, idx) => (
            <div key={idx} className="siteSet__row">
              <div className="siteSet__cells">
                <Field label="Label">
                  <input
                    className="admin-input"
                    value={link.label}
                    onChange={(e) =>
                      updateBottomLink(idx, { label: e.target.value })
                    }
                  />
                </Field>
                <Field label="Href">
                  <input
                    className="admin-input"
                    value={link.href}
                    onChange={(e) =>
                      updateBottomLink(idx, { href: e.target.value })
                    }
                  />
                </Field>
              </div>
              <div className="siteSet__actions">
                <button
                  type="button"
                  className="siteSet__iconBtn"
                  onClick={() => moveBottomLink(idx, -1)}
                >
                  ↑
                </button>
                <button
                  type="button"
                  className="siteSet__iconBtn"
                  onClick={() => moveBottomLink(idx, 1)}
                >
                  ↓
                </button>
                <button
                  type="button"
                  className="siteSet__iconBtn siteSet__iconBtn--danger"
                  onClick={() => removeBottomLink(idx)}
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          className="admin-btn admin-btn--ghost"
          onClick={addBottomLink}
        >
          + Add bottom link
        </button>
      </section>

      <SaveBar
        state={state}
        pending={pending}
        onReset={() => setCfg(structuredClone(initial))}
      />
    </form>
  );
}

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
