import { ApolloClient, InMemoryCache, HttpLink, from } from '@apollo/client';
import { errorLink } from './links/errorLink';

export function makeClient() {
  const httpLink = new HttpLink({
    uri: '/api/graphql',
    credentials: 'include',
  });

  return new ApolloClient({
    cache: new InMemoryCache({
      typePolicies: {
        Pet: { keyFields: ['id'] },
        HealthRecord: { keyFields: ['id'] },
        MedicalEvent: { keyFields: ['id'] },
        Medication: { keyFields: ['id'] },
        Vaccination: { keyFields: ['id'] },
        Appointment: { keyFields: ['id'] },
      },
    }),
    link: from([errorLink, httpLink]),
  });
}
