import { gql } from '@apollo/client';
import type { TypedDocumentNode } from '@apollo/client';

interface UpdateProfileData {
  updateProfile: { id: string; name: string | null; email: string };
}

interface UpdateProfileInput {
  name: string;
}

export const UPDATE_PROFILE_MUTATION: TypedDocumentNode<
  UpdateProfileData,
  { input: UpdateProfileInput }
> = gql`
  mutation UpdateProfile($input: UpdateProfileInput!) {
    updateProfile(input: $input) {
      id
      name
      email
    }
  }
`;
