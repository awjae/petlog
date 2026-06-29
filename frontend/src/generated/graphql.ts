/** Internal type. DO NOT USE DIRECTLY. */
type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
/** Internal type. DO NOT USE DIRECTLY. */
export type Incremental<T> =
  | T
  | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type CreateHealthRecordInput = {
  note?: string | null | undefined;
  numValue?: number | null | undefined;
  petId: string | number;
  recordedAt: string;
  textValue?: string | null | undefined;
  type: HealthRecordType;
};

export type CreatePetInput = {
  birthDate?: string | null | undefined;
  breed?: string | null | undefined;
  gender: Gender;
  isNeutered?: boolean | null | undefined;
  name: string;
  profileImageUrl?: string | null | undefined;
  species: Species;
  weight?: number | null | undefined;
};

export type Gender = 'female' | 'male' | 'unknown';

export type HealthRecordType =
  | 'activity'
  | 'appetite'
  | 'mood'
  | 'stool'
  | 'symptom'
  | 'vomit'
  | 'weight';

export type ScheduleType = 'appointment' | 'medication' | 'vaccination';

export type Species = 'cat' | 'dog';

export type CreateHealthRecordMutationVariables = Exact<{
  input: CreateHealthRecordInput;
}>;

export type CreateHealthRecordMutation = {
  createHealthRecord: { id: string; type: HealthRecordType; recordedAt: string };
};

export type HealthRecordsQueryVariables = Exact<{
  petId: string | number;
}>;

export type HealthRecordsQuery = {
  healthRecords: Array<{
    id: string;
    type: HealthRecordType;
    recordedAt: string;
    numValue: number | null;
    textValue: string | null;
    note: string | null;
  }>;
};

export type HomeQueryQueryVariables = Exact<{ [key: string]: never }>;

export type HomeQueryQuery = {
  me: {
    recordDates: Array<string>;
    pets: Array<{
      id: string;
      name: string;
      species: Species;
      breed: string | null;
      birthDate: string | null;
      profileImageUrl: string | null;
      todayRecordCount: number;
      recentWeight: { value: number; recordedAt: string } | null;
      recentHealthRecords: Array<{
        id: string;
        type: HealthRecordType;
        recordedAt: string;
        summary: string;
      }>;
    }>;
    upcomingSchedules: Array<{
      id: string;
      petId: string;
      petName: string;
      petProfileImageUrl: string | null;
      type: ScheduleType;
      title: string;
      dueDate: string;
    }>;
  };
};

export type CreatePetMutationVariables = Exact<{
  input: CreatePetInput;
}>;

export type CreatePetMutation = { createPet: { id: string; name: string; species: Species } };

export const CreateHealthRecordDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'CreateHealthRecord' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'CreateHealthRecordInput' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'createHealthRecord' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'input' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'type' } },
                { kind: 'Field', name: { kind: 'Name', value: 'recordedAt' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<CreateHealthRecordMutation, CreateHealthRecordMutationVariables>;
export const HealthRecordsDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'HealthRecords' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'petId' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'ID' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'healthRecords' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'petId' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'petId' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'type' } },
                { kind: 'Field', name: { kind: 'Name', value: 'recordedAt' } },
                { kind: 'Field', name: { kind: 'Name', value: 'numValue' } },
                { kind: 'Field', name: { kind: 'Name', value: 'textValue' } },
                { kind: 'Field', name: { kind: 'Name', value: 'note' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<HealthRecordsQuery, HealthRecordsQueryVariables>;
export const HomeQueryDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'HomeQuery' },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'me' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'recordDates' },
                  arguments: [
                    {
                      kind: 'Argument',
                      name: { kind: 'Name', value: 'limit' },
                      value: { kind: 'IntValue', value: '90' },
                    },
                  ],
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'pets' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'species' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'breed' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'birthDate' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'profileImageUrl' } },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'recentWeight' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            { kind: 'Field', name: { kind: 'Name', value: 'value' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'recordedAt' } },
                          ],
                        },
                      },
                      { kind: 'Field', name: { kind: 'Name', value: 'todayRecordCount' } },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'recentHealthRecords' },
                        arguments: [
                          {
                            kind: 'Argument',
                            name: { kind: 'Name', value: 'limit' },
                            value: { kind: 'IntValue', value: '5' },
                          },
                        ],
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'type' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'recordedAt' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'summary' } },
                          ],
                        },
                      },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'upcomingSchedules' },
                  arguments: [
                    {
                      kind: 'Argument',
                      name: { kind: 'Name', value: 'limit' },
                      value: { kind: 'IntValue', value: '3' },
                    },
                  ],
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'petId' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'petName' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'petProfileImageUrl' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'type' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'title' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'dueDate' } },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<HomeQueryQuery, HomeQueryQueryVariables>;
export const CreatePetDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'CreatePet' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'CreatePetInput' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'createPet' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'input' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                { kind: 'Field', name: { kind: 'Name', value: 'species' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<CreatePetMutation, CreatePetMutationVariables>;
