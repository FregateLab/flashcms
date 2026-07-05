import type { Metadata } from 'next';
import './admin.css';

export const metadata: Metadata = {
  title: 'SFH CMS',
  robots: { index: false, follow: false },
  icons: {
    icon: [
      { url: '/v1/assets/sfh-icon.png', sizes: 'any' },
    ],
    shortcut: '/v1/assets/sfh-icon.png',
    apple: '/v1/assets/sfh-icon.png',
  },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Poppins:wght@500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="admin-body">{children}</body>
    </html>
  );
}
