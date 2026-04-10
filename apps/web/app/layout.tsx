import type { Metadata } from 'next';
import './globals.css';
import { Sidebar } from '../components/layout/Sidebar';

export const metadata: Metadata = {
  title: 'ComplyArc â€” AI-Native AML & eKYC Platform',
  description: 'Real-time sanctions screening, PEP detection, adverse media AI, and risk scoring engine for modern compliance.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="app-layout">
          <Sidebar />
          <main className="main-content">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
