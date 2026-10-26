import { listCategories } from '@/lib/categories';
import PostEditor from '../PostEditor';

export default async function AdminNewPostPage() {
  const categories = (await listCategories()).map((c) => ({
    id: c.id,
    name: c.name,
  }));
  return <PostEditor initial={{}} categories={categories} />;
}
