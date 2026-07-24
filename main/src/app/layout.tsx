import type { Metadata } from 'next';
import { Provider } from '@/components/provider';
import './global.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://theaethersea.com'),
  title: {
    default: 'Aethersea',
    template: '%s · Aethersea',
  },
  description: 'Open-source, high-performance remote desktop streaming.',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-fd-background text-fd-foreground antialiased">
        <Provider>{children}</Provider>
      </body>
    </html>
  );
}
