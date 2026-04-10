import type { Metadata } from 'next';
import './globals.css';
import { ClientLayout } from '../components/layout/ClientLayout';

export const metadata: Metadata = {
  title: 'ComplyArc — AI-Native AML & eKYC Platform',
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
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
