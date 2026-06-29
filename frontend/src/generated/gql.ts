/* eslint-disable */
import * as types from './graphql';
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';

/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 * Learn more about it here: https://the-guild.dev/graphql/codegen/plugins/presets/preset-client#reducing-bundle-size
 */
type Documents = {
  '\n  mutation CreateHealthRecord($input: CreateHealthRecordInput!) {\n    createHealthRecord(input: $input) {\n      id\n      type\n      recordedAt\n    }\n  }\n': typeof types.CreateHealthRecordDocument;
  '\n  query HealthRecords($petId: ID!) {\n    healthRecords(petId: $petId) {\n      id\n      type\n      recordedAt\n      numValue\n      textValue\n      note\n    }\n  }\n': typeof types.HealthRecordsDocument;
  '\n  query HomeQuery {\n    me {\n      recordDates(limit: 90)\n      pets {\n        id\n        name\n        species\n        breed\n        birthDate\n        profileImageUrl\n        recentWeight {\n          value\n          recordedAt\n        }\n        todayRecordCount\n        recentHealthRecords(limit: 5) {\n          id\n          type\n          recordedAt\n          summary\n        }\n      }\n      upcomingSchedules(limit: 3) {\n        id\n        petId\n        petName\n        petProfileImageUrl\n        type\n        title\n        dueDate\n      }\n    }\n  }\n': typeof types.HomeQueryDocument;
  '\n  mutation CreatePet($input: CreatePetInput!) {\n    createPet(input: $input) {\n      id\n      name\n      species\n    }\n  }\n': typeof types.CreatePetDocument;
};
const documents: Documents = {
  '\n  mutation CreateHealthRecord($input: CreateHealthRecordInput!) {\n    createHealthRecord(input: $input) {\n      id\n      type\n      recordedAt\n    }\n  }\n':
    types.CreateHealthRecordDocument,
  '\n  query HealthRecords($petId: ID!) {\n    healthRecords(petId: $petId) {\n      id\n      type\n      recordedAt\n      numValue\n      textValue\n      note\n    }\n  }\n':
    types.HealthRecordsDocument,
  '\n  query HomeQuery {\n    me {\n      recordDates(limit: 90)\n      pets {\n        id\n        name\n        species\n        breed\n        birthDate\n        profileImageUrl\n        recentWeight {\n          value\n          recordedAt\n        }\n        todayRecordCount\n        recentHealthRecords(limit: 5) {\n          id\n          type\n          recordedAt\n          summary\n        }\n      }\n      upcomingSchedules(limit: 3) {\n        id\n        petId\n        petName\n        petProfileImageUrl\n        type\n        title\n        dueDate\n      }\n    }\n  }\n':
    types.HomeQueryDocument,
  '\n  mutation CreatePet($input: CreatePetInput!) {\n    createPet(input: $input) {\n      id\n      name\n      species\n    }\n  }\n':
    types.CreatePetDocument,
};

/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 *
 *
 * @example
 * ```ts
 * const query = gql(`query GetUser($id: ID!) { user(id: $id) { name } }`);
 * ```
 *
 * The query argument is unknown!
 * Please regenerate the types.
 */
export function gql(source: string): unknown;

/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  mutation CreateHealthRecord($input: CreateHealthRecordInput!) {\n    createHealthRecord(input: $input) {\n      id\n      type\n      recordedAt\n    }\n  }\n',
): (typeof documents)['\n  mutation CreateHealthRecord($input: CreateHealthRecordInput!) {\n    createHealthRecord(input: $input) {\n      id\n      type\n      recordedAt\n    }\n  }\n'];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  query HealthRecords($petId: ID!) {\n    healthRecords(petId: $petId) {\n      id\n      type\n      recordedAt\n      numValue\n      textValue\n      note\n    }\n  }\n',
): (typeof documents)['\n  query HealthRecords($petId: ID!) {\n    healthRecords(petId: $petId) {\n      id\n      type\n      recordedAt\n      numValue\n      textValue\n      note\n    }\n  }\n'];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  query HomeQuery {\n    me {\n      recordDates(limit: 90)\n      pets {\n        id\n        name\n        species\n        breed\n        birthDate\n        profileImageUrl\n        recentWeight {\n          value\n          recordedAt\n        }\n        todayRecordCount\n        recentHealthRecords(limit: 5) {\n          id\n          type\n          recordedAt\n          summary\n        }\n      }\n      upcomingSchedules(limit: 3) {\n        id\n        petId\n        petName\n        petProfileImageUrl\n        type\n        title\n        dueDate\n      }\n    }\n  }\n',
): (typeof documents)['\n  query HomeQuery {\n    me {\n      recordDates(limit: 90)\n      pets {\n        id\n        name\n        species\n        breed\n        birthDate\n        profileImageUrl\n        recentWeight {\n          value\n          recordedAt\n        }\n        todayRecordCount\n        recentHealthRecords(limit: 5) {\n          id\n          type\n          recordedAt\n          summary\n        }\n      }\n      upcomingSchedules(limit: 3) {\n        id\n        petId\n        petName\n        petProfileImageUrl\n        type\n        title\n        dueDate\n      }\n    }\n  }\n'];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  mutation CreatePet($input: CreatePetInput!) {\n    createPet(input: $input) {\n      id\n      name\n      species\n    }\n  }\n',
): (typeof documents)['\n  mutation CreatePet($input: CreatePetInput!) {\n    createPet(input: $input) {\n      id\n      name\n      species\n    }\n  }\n'];

export function gql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> =
  TDocumentNode extends DocumentNode<infer TType, any> ? TType : never;
