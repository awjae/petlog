import type { PetDetailQuery, PetEditQuery } from '@/generated/graphql';

export type PetDetail = PetDetailQuery['pet'];
export type PetRecentHealthRecord = PetDetail['recentHealthRecords'][number];
export type PetRecentWeight = NonNullable<PetDetail['recentWeight']>;
export type PetEditData = PetEditQuery['pet'];
