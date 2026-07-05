import Link from 'next/link';
import { getPublishedPosts, getFeaturedOrLatestPost } from '@/lib/blog';

type PostRow = Awaited<ReturnType<typeof getPublishedPosts>>[number];

function formatDate(d: Date | string | null) {
  if (!d) return '';
  const date = d instanceof Date ? d : new Date(d);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function tagLabel(pressType: string) {
  if (pressType === 'release') return 'Release';
  if (pressType === 'report') return 'Report';
  return 'Story';
}
function tagVariant(pressType: string) {
  if (pressType === 'release') return 'pressFeat__tag--release';
  if (pressType === 'report') return 'pressFeat__tag--report';
  return 'pressFeat__tag--story';
}
function itemTagVariant(pressType: string) {
  if (pressType === 'release') return 'psItem__tag--release';
  if (pressType === 'report') return 'psItem__tag--report';
  return 'psItem__tag--story';
}
function postHref(p: PostRow) {
  return p.externalUrl && p.externalUrl.length > 0
    ? p.externalUrl
    : `/blog/${p.slug}`;
}

// -------- Featured story --------
export async function PressFeatServer({
  eyebrow,
  badge,
  ctaLabel,
}: {
  eyebrow: string;
  badge: string;
  ctaLabel: string;
}) {
  const post = await getFeaturedOrLatestPost();
  if (!post) return null;
  const external = !!post.externalUrl;

  return (
    <section className="pressFeat" aria-labelledby="pressFeat-title">
      <div className="container">
        <a
          href={postHref(post)}
          target={external ? '_blank' : undefined}
          rel={external ? 'noopener' : undefined}
          className="pressFeat__card"
        >
          <div className="pressFeat__media">
            {post.coverImage && (
              <img src={post.coverImage} alt="" loading="lazy" />
            )}
            {badge && <span className="pressFeat__badge">{badge}</span>}
          </div>
          <div className="pressFeat__body">
            <span className="pressFeat__meta">
              <span
                className={`pressFeat__tag ${tagVariant(post.pressType)}`}
              >
                {eyebrow || tagLabel(post.pressType)}
              </span>
              <span className="pressFeat__date">
                {formatDate(post.publishedAt)}
              </span>
            </span>
            <h2 id="pressFeat-title" className="pressFeat__title">
              {post.title}
            </h2>
            {post.excerpt && (
              <p className="pressFeat__deck">{post.excerpt}</p>
            )}
            <span className="pressFeat__cta">
              {external ? ctaLabel : 'Read more'}{' '}
              <span aria-hidden="true">{external ? '↗' : '→'}</span>
            </span>
          </div>
        </a>
      </div>
    </section>
  );
}

// -------- Filterable list --------
export async function PressListServer({
  anchor,
  eyebrow,
  title,
  lede,
  showFilter,
  ctaLabel,
  externalCtaLabel,
}: {
  anchor?: string;
  eyebrow: string;
  title: string;
  lede: string;
  showFilter?: boolean;
  ctaLabel: string;
  externalCtaLabel: string;
}) {
  const posts = await getPublishedPosts();
  if (posts.length === 0) return null;

  return (
    <section className="pressList" aria-labelledby="pressList-title" id={anchor || undefined}>
      <div className="container">
        <header className="impact__sectionhead pressList__head">
          <span className="impact__sectioneyebrow">{eyebrow}</span>
          <h2 id="pressList-title" className="impact__sectiontitle">
            {title}
          </h2>
          {lede && <p className="impact__sectionlede">{lede}</p>}
        </header>
        {showFilter !== false && (
          <nav
            className="careers__filter pressList__filter"
            aria-label="Filter press items"
            data-role-filter
          >
            <button
              className="careers__filterPill"
              type="button"
              data-filter="all"
              data-active="true"
            >
              All items
            </button>
            <button
              className="careers__filterPill"
              type="button"
              data-filter="release"
            >
              Releases
            </button>
            <button
              className="careers__filterPill"
              type="button"
              data-filter="story"
            >
              Stories
            </button>
            <button
              className="careers__filterPill"
              type="button"
              data-filter="report"
            >
              Reports
            </button>
          </nav>
        )}
        <ul className="pressList__grid" aria-label="Press items">
          {posts.map((p) => {
            const external = !!p.externalUrl;
            const label = external ? externalCtaLabel : ctaLabel;
            return (
              <li
                key={p.id}
                className="psItem"
                data-entity={p.pressType}
              >
                {external ? (
                  <a
                    href={p.externalUrl!}
                    target="_blank"
                    rel="noopener"
                    className="psItem__link"
                  >
                    <ItemBody item={p} label={label} external />
                  </a>
                ) : (
                  <Link href={`/blog/${p.slug}`} className="psItem__link">
                    <ItemBody item={p} label={label} external={false} />
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

function ItemBody({
  item,
  label,
  external,
}: {
  item: PostRow;
  label: string;
  external: boolean;
}) {
  return (
    <>
      <div className="psItem__media">
        {item.coverImage && (
          <img src={item.coverImage} alt="" loading="lazy" />
        )}
        <span className={`psItem__tag ${itemTagVariant(item.pressType)}`}>
          {tagLabel(item.pressType)}
        </span>
      </div>
      <div className="psItem__body">
        <span className="psItem__date">{formatDate(item.publishedAt)}</span>
        <h3 className="psItem__title">{item.title}</h3>
        <span className="psItem__cta">
          {label} <span aria-hidden="true">{external ? '↗' : '→'}</span>
        </span>
      </div>
    </>
  );
}
