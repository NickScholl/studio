
import type { Metadata } from 'next';
import './globals.css';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseProvider } from '@/firebase';

export const metadata: Metadata = {
  title: 'ShuttleScore | Badminton Performance Tracker',
  description: 'Submit matches and track your badminton statistics effortlessly.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased">
        <FirebaseProvider>
          <SidebarProvider defaultOpen={true}>
            {children}
            <Toaster />
          </SidebarProvider>
        </FirebaseProvider>
      </body>
    </html>
  );
}
