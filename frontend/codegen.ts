import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: '../backend/src/schema.generated.graphql',
  documents: ['src/**/*.{ts,tsx}', '!src/generated/**'],
  generates: {
    './src/generated/': {
      preset: 'client',
      presetConfig: {
        gqlTagName: 'gql',
        fragmentMasking: false,
      },
    },
  },
  ignoreNoDocuments: true,
  allowPartialOutputs: true,
  config: {
    scalars: {
      DateTime: 'string',
    },
  },
};

export default config;
