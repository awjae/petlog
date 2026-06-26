/** Internal type. DO NOT USE DIRECTLY. */
type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
/** Internal type. DO NOT USE DIRECTLY. */
export type Incremental<T> =
  | T
  | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type CalendarEventType =
  | 'appointment'
  | 'health_record'
  | 'medical_event'
  | 'medication'
  | 'vaccination';

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

export type CalendarQueryQueryVariables = Exact<{
  startDate: string;
  endDate: string;
}>;

export type CalendarQueryQuery = {
  me: {
    pets: Array<{ id: string; name: string; profileImageUrl: string | null }>;
    calendarEvents: Array<{
      id: string;
      date: string;
      type: CalendarEventType;
      title: string;
      subtitle: string | null;
      petId: string;
    }>;
  };
};

export type HomeQueryQueryVariables = Exact<{ [key: string]: never }>;

export type HomeQueryQuery = {
  me: {
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

export const CalendarQueryDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'CalendarQuery' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'startDate' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
          },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'endDate' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
          },
        },
      ],
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
                  name: { kind: 'Name', value: 'pets' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'profileImageUrl' } },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'calendarEvents' },
                  arguments: [
                    {
                      kind: 'Argument',
                      name: { kind: 'Name', value: 'startDate' },
                      value: { kind: 'Variable', name: { kind: 'Name', value: 'startDate' } },
                    },
                    {
                      kind: 'Argument',
                      name: { kind: 'Name', value: 'endDate' },
                      value: { kind: 'Variable', name: { kind: 'Name', value: 'endDate' } },
                    },
                  ],
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'date' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'type' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'title' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'subtitle' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'petId' } },
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
} as unknown as DocumentNode<CalendarQueryQuery, CalendarQueryQueryVariables>;
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
                            value: { kind: 'IntValue', value: '3' },
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
