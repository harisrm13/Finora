import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Finora — Personal Finance Tracker",
  description: "Take Control of Your Money. Aplikasi pencatatan keuangan pribadi, anggaran, uang saku, dan tabungan modern.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const t = localStorage.getItem('finora_theme');
                if (t === 'dark' || (!t && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (_) {}
            `,
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-[#F7F8FA] dark:bg-[#0B1120] text-[#111827] dark:text-[#F8FAFC] antialiased">
        {children}
      </body>
    </html>
  );
}
