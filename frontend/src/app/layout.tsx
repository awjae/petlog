// filepath: src/app/layout.tsx

import type { Metadata } from 'next';
import { ApolloProvider } from '@/providers/ApolloProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'Petlog',
  description: '반려동물 건강 기록 서비스',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <ApolloProvider>{children}</ApolloProvider>
      </body>
    </html>
  );
}
