# Categories

Admin-defined taxonomy for posts (and optionally pages), one list per
site. Added in 1.1.0.

## What ships

| File | Role |
|---|---|
| `db/schema.ts` → `postCategories` | Table `post_categories` (migration `0008`) + `posts.category_id` (`0008`) + `pages.category_id` (`0009`). FKs are `ON DELETE SET NULL` — deleting a category un-categorises its posts, never deletes them. |
| `lib/categories.ts` | Server actions: `listCategories`, `getCategoryById`, `getCategoryBySlug`, `createCategory`, `updateCategory`, `deleteCategory`. All site-scoped. |
| `app/(admin)/admin/(authed)/categories/` | `/admin/categories` — inline create form, table with inline edit + delete. Any signed-in user can manage categories. |
| `posts/PostEditor.tsx` | "Category" select in the sidebar (links to `/admin/categories` when empty). |
| `lib/blog.ts` | `getPublishedPosts({ categorySlug })`, `listVisibleCategories()`. |
| `lib/pages.ts` | `updatePageCategory` (admin action, no UI yet). |

## Data model

```
post_categories
  id          uuid pk
  site_id     uuid → sites.id (cascade)
  slug        varchar(64)   kebab-case, unique per site
  name        text
  description text null
  sort_order  integer       chips/lists order by sort_order, then name
  created_at  timestamp
```

## Public filtering

Categories are referenced publicly by slug. A blog index with filter
chips:

```tsx
// app/(frontend)/blog/page.tsx
import Link from 'next/link';
import { getPublishedPosts, listVisibleCategories } from '@/lib/blog';

export default async function BlogIndex({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const [posts, categories] = await Promise.all([
    getPublishedPosts({ categorySlug: category }),
    listVisibleCategories(), // only categories with ≥1 published post
  ]);

  return (
    <main className="container">
      <nav aria-label="Filter by category">
        <Link href="/blog" aria-current={!category ? 'page' : undefined}>All</Link>
        {categories.map((c) => (
          <Link key={c.id} href={`/blog?category=${c.slug}`}
                aria-current={c.slug === category ? 'page' : undefined}>
            {c.name} ({c.postCount})
          </Link>
        ))}
      </nav>
      <ul>
        {posts.map((p) => (
          <li key={p.id}><Link href={`/blog/${p.slug}`}>{p.title}</Link></li>
        ))}
      </ul>
    </main>
  );
}
```

An unknown slug returns an empty list rather than an error. Both reads
are cached with the `posts` / `post-categories` tags; category writes
and post publishes revalidate them.

## Notes

- Changing a category's slug changes its public filter URL — existing
  links with the old slug will show an empty list.
- `getPublishedPosts` rows now include `categoryId`, so press/blog
  renderers can show a category label without an extra query
  (join against `listCategories()`).
