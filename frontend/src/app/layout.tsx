import type { Metadata } from 'next';
import { Inter, Source_Serif_4 } from 'next/font/google';
import { QueryProvider } from '@/components/providers/query-provider';
import { ToastProvider } from '@/components/ui/toast-provider';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const sourceSerif = Source_Serif_4({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
  weight: ['600', '700'],
});

export const metadata: Metadata = {
  title: 'FMS | Freight Management System',
  description: 'Enterprise Freight Management ERP',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${sourceSerif.variable}`}>
      <body className="min-h-screen font-sans antialiased">
        <QueryProvider>
          <ToastProvider>{children}</ToastProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
