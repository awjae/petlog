'use client';

import { ApolloProvider as BaseApolloProvider } from '@apollo/client/react';
import { useState } from 'react';
import { makeClient } from '@/lib/apollo/client';

export function ApolloProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => makeClient());

  return <BaseApolloProvider client={client}>{children}</BaseApolloProvider>;
}
