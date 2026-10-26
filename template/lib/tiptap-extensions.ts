import Image from '@tiptap/extension-image';

// Image extension extended with a `width` attribute so editors can pick
// a size in the admin (small | medium | full). Shared between the
// TipTap editor client-side and the server-side `generateHTML` render
// in lib/blog.ts so the size class survives serialization → HTML.
export const ResizableImage = Image.extend({
  addAttributes() {
    return {
      ...(this.parent?.() ?? {}),
      width: {
        default: null,
        parseHTML: (el) => el.getAttribute('data-width'),
        renderHTML: (attrs) => {
          const size = attrs.width as string | null;
          const cls = size ? `blog-img blog-img--${size}` : 'blog-img';
          return { class: cls, ...(size ? { 'data-width': size } : {}) };
        },
      },
    };
  },
});
