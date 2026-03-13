import './globals.css';
import Sidebar from '@/components/Sidebar';
import { ThemeProvider } from '@/components/ThemeProvider';

import AuthGuard from '@/components/AuthGuard';

export const metadata = {
  title: 'LifeTracker — Personal Goal Tracker',
  description: 'A premium personal life tracker to manage goals across Gym, Learning, and Content Creation.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <AuthGuard>
            <div className="app-layout">
              <Sidebar />
              <main className="main-content">
                {children}
              </main>
            </div>
          </AuthGuard>
        </ThemeProvider>
      </body>
    </html>
  );
}
