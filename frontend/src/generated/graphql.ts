/** Internal type. DO NOT USE DIRECTLY. */
type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
/** Internal type. DO NOT USE DIRECTLY. */
export type Incremental<T> =
  | T
  | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type AppointmentStatus = 'cancelled' | 'completed' | 'scheduled';

export type CreateAppointmentInput = {
  hospitalName: string;
  memo?: string | null | undefined;
  petId: string | number;
  reason?: string | null | undefined;
  scheduledAt: string;
};

export type CreateHealthRecordInput = {
  note?: string | null | undefined;
  numValue?: number | null | undefined;
  petId: string | number;
  recordedAt: string;
  textValue?: string | null | undefined;
  type: HealthRecordType;
};

export type CreateMedicalEventInput = {
  attachmentUrls?: Array<string> | null | undefined;
  description: string;
  hospitalName: string;
  petId: string | number;
  visitDate: string;
};

export type CreateMedicationInput = {
  dosage?: string | null | undefined;
  endDate?: string | null | undefined;
  frequency?: string | null | undefined;
  name?: string | null | undefined;
  petId: string | number;
  startDate: string;
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

export type CreateVaccinationInput = {
  code?: string | null | undefined;
  memo?: string | null | undefined;
  name: string;
  nextDueAt?: string | null | undefined;
  petId: string | number;
  vaccinatedAt: string;
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

export type ReportGeneratedBy = 'ai' | 'mock';

export type ReportStatus = 'completed' | 'failed' | 'pending' | 'processing';

export type ScheduleType = 'appointment' | 'medication' | 'vaccination';

export type Species = 'cat' | 'dog';

export type UpdateNotificationPreferenceInput = {
  appointmentReminderEnabled?: boolean | null | undefined;
  vaccinationDueEnabled?: boolean | null | undefined;
  weeklyCheckinEnabled?: boolean | null | undefined;
};

export type UpdatePetInput = {
  birthDate?: string | null | undefined;
  breed?: string | null | undefined;
  gender?: Gender | null | undefined;
  isNeutered?: boolean | null | undefined;
  name?: string | null | undefined;
  profileImageUrl?: string | null | undefined;
  species?: Species | null | undefined;
  weight?: number | null | undefined;
};

export type UpdateProfileInput = {
  name?: string | null | undefined;
};

export type ConsentStatusQueryVariables = Exact<{ [key: string]: never }>;

export type ConsentStatusQuery = { consentStatus: { marketingNotificationAgreed: boolean } };

export type UpdateMarketingConsentMutationVariables = Exact<{
  agreed: boolean;
}>;

export type UpdateMarketingConsentMutation = {
  updateMarketingConsent: { marketingNotificationAgreed: boolean };
};

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
      totalHealthRecordCount: number;
      recentWeight: { value: number; recordedAt: string } | null;
      recentHealthRecords: Array<{
        id: string;
        type: HealthRecordType;
        recordedAt: string;
        numValue: number | null;
        textValue: string | null;
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

export type CreateMedicalEventMutationVariables = Exact<{
  input: CreateMedicalEventInput;
}>;

export type CreateMedicalEventMutation = {
  createMedicalEvent: { id: string; visitDate: string; hospitalName: string };
};

export type DeleteMedicalEventMutationVariables = Exact<{
  id: string | number;
}>;

export type DeleteMedicalEventMutation = { deleteMedicalEvent: boolean };

export type CreateVaccinationMutationVariables = Exact<{
  input: CreateVaccinationInput;
}>;

export type CreateVaccinationMutation = {
  createVaccination: { id: string; name: string; vaccinatedAt: string };
};

export type DeleteVaccinationMutationVariables = Exact<{
  id: string | number;
}>;

export type DeleteVaccinationMutation = { deleteVaccination: boolean };

export type CreateAppointmentMutationVariables = Exact<{
  input: CreateAppointmentInput;
}>;

export type CreateAppointmentMutation = {
  createAppointment: { id: string; hospitalName: string; scheduledAt: string };
};

export type DeleteAppointmentMutationVariables = Exact<{
  id: string | number;
}>;

export type DeleteAppointmentMutation = { deleteAppointment: boolean };

export type MedicalEventsQueryVariables = Exact<{
  petId: string | number;
}>;

export type MedicalEventsQuery = {
  medicalEvents: Array<{
    id: string;
    petId: string;
    hospitalName: string;
    visitDate: string;
    description: string;
    attachmentUrls: Array<string>;
    createdAt: string;
    updatedAt: string;
  }>;
};

export type VaccinationsQueryVariables = Exact<{
  petId: string | number;
}>;

export type VaccinationsQuery = {
  vaccinations: Array<{
    id: string;
    petId: string;
    name: string;
    code: string | null;
    vaccinatedAt: string;
    nextDueAt: string | null;
    memo: string | null;
    createdAt: string;
    updatedAt: string;
  }>;
};

export type AppointmentsQueryVariables = Exact<{
  petId: string | number;
}>;

export type AppointmentsQuery = {
  appointments: Array<{
    id: string;
    petId: string;
    hospitalName: string;
    scheduledAt: string;
    reason: string | null;
    status: AppointmentStatus;
    memo: string | null;
    createdAt: string;
    updatedAt: string;
  }>;
};

export type CreateMedicationMutationVariables = Exact<{
  input: CreateMedicationInput;
}>;

export type CreateMedicationMutation = {
  createMedication: { id: string; name: string | null; startDate: string };
};

export type DeleteMedicationMutationVariables = Exact<{
  id: string | number;
}>;

export type DeleteMedicationMutation = { deleteMedication: boolean };

export type MedicationsQueryVariables = Exact<{
  petId: string | number;
}>;

export type MedicationsQuery = {
  medications: Array<{
    id: string;
    petId: string;
    name: string | null;
    dosage: string | null;
    frequency: string | null;
    startDate: string;
    endDate: string | null;
    createdAt: string;
    updatedAt: string;
  }>;
};

export type RegisterPushTokenMutationVariables = Exact<{
  token: string;
}>;

export type RegisterPushTokenMutation = { registerPushToken: boolean };

export type SendTestPushNotificationMutationVariables = Exact<{ [key: string]: never }>;

export type SendTestPushNotificationMutation = { sendTestPushNotification: boolean };

export type NotificationPreferenceQueryVariables = Exact<{ [key: string]: never }>;

export type NotificationPreferenceQuery = {
  notificationPreference: {
    vaccinationDueEnabled: boolean;
    appointmentReminderEnabled: boolean;
    weeklyCheckinEnabled: boolean;
  };
};

export type UpdateNotificationPreferenceMutationVariables = Exact<{
  input: UpdateNotificationPreferenceInput;
}>;

export type UpdateNotificationPreferenceMutation = {
  updateNotificationPreference: {
    vaccinationDueEnabled: boolean;
    appointmentReminderEnabled: boolean;
    weeklyCheckinEnabled: boolean;
  };
};

export type NotificationAuthCheckQueryVariables = Exact<{ [key: string]: never }>;

export type NotificationAuthCheckQuery = { me: { id: string } };

export type CreatePetMutationVariables = Exact<{
  input: CreatePetInput;
}>;

export type CreatePetMutation = { createPet: { id: string; name: string; species: Species } };

export type UpdatePetMutationVariables = Exact<{
  id: string | number;
  input: UpdatePetInput;
}>;

export type UpdatePetMutation = {
  updatePet: {
    id: string;
    name: string;
    species: Species;
    breed: string | null;
    birthDate: string | null;
    gender: Gender;
    isNeutered: boolean;
    profileImageUrl: string | null;
  };
};

export type DeletePetMutationVariables = Exact<{
  id: string | number;
}>;

export type DeletePetMutation = { deletePet: boolean };

export type PetDetailQueryVariables = Exact<{
  id: string | number;
}>;

export type PetDetailQuery = {
  pet: {
    id: string;
    name: string;
    species: Species;
    breed: string | null;
    birthDate: string | null;
    gender: Gender;
    weight: number | null;
    isNeutered: boolean;
    profileImageUrl: string | null;
    todayRecordCount: number;
    createdAt: string;
    updatedAt: string;
    recentWeight: { value: number; recordedAt: string } | null;
    recentHealthRecords: Array<{
      id: string;
      type: HealthRecordType;
      recordedAt: string;
      numValue: number | null;
      textValue: string | null;
    }>;
  };
};

export type PetEditQueryVariables = Exact<{
  id: string | number;
}>;

export type PetEditQuery = {
  pet: {
    id: string;
    name: string;
    species: Species;
    breed: string | null;
    birthDate: string | null;
    gender: Gender;
    weight: number | null;
    isNeutered: boolean;
    profileImageUrl: string | null;
  };
};

export type PetIdsQueryVariables = Exact<{ [key: string]: never }>;

export type PetIdsQuery = { pets: Array<{ id: string }> };

export type StartReportShareMutationVariables = Exact<{
  reportId: string | number;
}>;

export type StartReportShareMutation = {
  startReportShare: { isActive: boolean; includeConcerns: boolean; shareToken: string | null };
};

export type StopReportShareMutationVariables = Exact<{
  reportId: string | number;
}>;

export type StopReportShareMutation = {
  stopReportShare: { isActive: boolean; includeConcerns: boolean; shareToken: string | null };
};

export type SetReportShareIncludeConcernsMutationVariables = Exact<{
  reportId: string | number;
  includeConcerns: boolean;
}>;

export type SetReportShareIncludeConcernsMutation = {
  setReportShareIncludeConcerns: {
    isActive: boolean;
    includeConcerns: boolean;
    shareToken: string | null;
  };
};

export type ReportShareSettingsQueryVariables = Exact<{
  reportId: string | number;
}>;

export type ReportShareSettingsQuery = {
  reportShareSettings: { isActive: boolean; includeConcerns: boolean; shareToken: string | null };
};

export type ShareViewerQueryVariables = Exact<{ [key: string]: never }>;

export type ShareViewerQuery = { me: { name: string | null } };

export type GenerateReportMutationVariables = Exact<{
  petId: string | number;
  periodStart: string;
  periodEnd: string;
}>;

export type GenerateReportMutation = { generateReport: { reportId: string; status: ReportStatus } };

export type ReportStatusQueryVariables = Exact<{
  petId: string | number;
}>;

export type ReportStatusQuery = {
  reportStatus: {
    canGenerateThisMonth: boolean;
    hasEnoughRecords: boolean;
    recordCount: number;
    recordDays: number;
    nextAvailableAt: string | null;
    processingReport: { id: string; status: ReportStatus } | null;
  };
};

export type ReportsQueryVariables = Exact<{
  petId: string | number;
}>;

export type ReportsQuery = {
  reports: Array<{
    id: string;
    status: ReportStatus;
    overview: string | null;
    highlights: Array<string>;
    concerns: Array<string>;
    recommendations: Array<string>;
    generatedBy: ReportGeneratedBy | null;
    periodStart: string;
    periodEnd: string;
    createdAt: string;
  }>;
};

export type ReportQueryVariables = Exact<{
  id: string | number;
}>;

export type ReportQuery = {
  report: {
    id: string;
    petId: string;
    status: ReportStatus;
    overview: string | null;
    highlights: Array<string>;
    concerns: Array<string>;
    recommendations: Array<string>;
    generatedBy: ReportGeneratedBy | null;
    periodStart: string;
    periodEnd: string;
    createdAt: string;
  } | null;
};

export type ReportPollStatusQueryVariables = Exact<{
  id: string | number;
}>;

export type ReportPollStatusQuery = {
  reportPollStatus: { id: string; status: ReportStatus; failedReason: string | null };
};

export type PetsForReportQueryVariables = Exact<{ [key: string]: never }>;

export type PetsForReportQuery = {
  me: { pets: Array<{ id: string; name: string; createdAt: string }> };
};

export type ReportPeriodPreviewQueryVariables = Exact<{
  petId: string | number;
  periodStart: string;
  periodEnd: string;
}>;

export type ReportPeriodPreviewQuery = {
  reportPeriodPreview: { recordCount: number; recordDays: number; hasEnoughRecords: boolean };
};

export type UpdateProfileMutationVariables = Exact<{
  input: UpdateProfileInput;
}>;

export type UpdateProfileMutation = {
  updateProfile: { id: string; name: string | null; email: string };
};

export type SettingsMeQueryVariables = Exact<{ [key: string]: never }>;

export type SettingsMeQuery = { me: { name: string | null; email: string } };

export const ConsentStatusDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'ConsentStatus' },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'consentStatus' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'marketingNotificationAgreed' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<ConsentStatusQuery, ConsentStatusQueryVariables>;
export const UpdateMarketingConsentDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'UpdateMarketingConsent' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'agreed' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'Boolean' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'updateMarketingConsent' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'agreed' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'agreed' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'marketingNotificationAgreed' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<
  UpdateMarketingConsentMutation,
  UpdateMarketingConsentMutationVariables
>;
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
                      { kind: 'Field', name: { kind: 'Name', value: 'totalHealthRecordCount' } },
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
                            { kind: 'Field', name: { kind: 'Name', value: 'numValue' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'textValue' } },
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
export const CreateMedicalEventDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'CreateMedicalEvent' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'CreateMedicalEventInput' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'createMedicalEvent' },
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
                { kind: 'Field', name: { kind: 'Name', value: 'visitDate' } },
                { kind: 'Field', name: { kind: 'Name', value: 'hospitalName' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<CreateMedicalEventMutation, CreateMedicalEventMutationVariables>;
export const DeleteMedicalEventDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'DeleteMedicalEvent' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
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
            name: { kind: 'Name', value: 'deleteMedicalEvent' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'id' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
              },
            ],
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<DeleteMedicalEventMutation, DeleteMedicalEventMutationVariables>;
export const CreateVaccinationDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'CreateVaccination' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'CreateVaccinationInput' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'createVaccination' },
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
                { kind: 'Field', name: { kind: 'Name', value: 'vaccinatedAt' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<CreateVaccinationMutation, CreateVaccinationMutationVariables>;
export const DeleteVaccinationDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'DeleteVaccination' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
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
            name: { kind: 'Name', value: 'deleteVaccination' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'id' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
              },
            ],
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<DeleteVaccinationMutation, DeleteVaccinationMutationVariables>;
export const CreateAppointmentDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'CreateAppointment' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'CreateAppointmentInput' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'createAppointment' },
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
                { kind: 'Field', name: { kind: 'Name', value: 'hospitalName' } },
                { kind: 'Field', name: { kind: 'Name', value: 'scheduledAt' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<CreateAppointmentMutation, CreateAppointmentMutationVariables>;
export const DeleteAppointmentDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'DeleteAppointment' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
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
            name: { kind: 'Name', value: 'deleteAppointment' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'id' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
              },
            ],
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<DeleteAppointmentMutation, DeleteAppointmentMutationVariables>;
export const MedicalEventsDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'MedicalEvents' },
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
            name: { kind: 'Name', value: 'medicalEvents' },
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
                { kind: 'Field', name: { kind: 'Name', value: 'petId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'hospitalName' } },
                { kind: 'Field', name: { kind: 'Name', value: 'visitDate' } },
                { kind: 'Field', name: { kind: 'Name', value: 'description' } },
                { kind: 'Field', name: { kind: 'Name', value: 'attachmentUrls' } },
                { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
                { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<MedicalEventsQuery, MedicalEventsQueryVariables>;
export const VaccinationsDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'Vaccinations' },
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
            name: { kind: 'Name', value: 'vaccinations' },
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
                { kind: 'Field', name: { kind: 'Name', value: 'petId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                { kind: 'Field', name: { kind: 'Name', value: 'code' } },
                { kind: 'Field', name: { kind: 'Name', value: 'vaccinatedAt' } },
                { kind: 'Field', name: { kind: 'Name', value: 'nextDueAt' } },
                { kind: 'Field', name: { kind: 'Name', value: 'memo' } },
                { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
                { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<VaccinationsQuery, VaccinationsQueryVariables>;
export const AppointmentsDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'Appointments' },
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
            name: { kind: 'Name', value: 'appointments' },
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
                { kind: 'Field', name: { kind: 'Name', value: 'petId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'hospitalName' } },
                { kind: 'Field', name: { kind: 'Name', value: 'scheduledAt' } },
                { kind: 'Field', name: { kind: 'Name', value: 'reason' } },
                { kind: 'Field', name: { kind: 'Name', value: 'status' } },
                { kind: 'Field', name: { kind: 'Name', value: 'memo' } },
                { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
                { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<AppointmentsQuery, AppointmentsQueryVariables>;
export const CreateMedicationDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'CreateMedication' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'CreateMedicationInput' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'createMedication' },
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
                { kind: 'Field', name: { kind: 'Name', value: 'startDate' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<CreateMedicationMutation, CreateMedicationMutationVariables>;
export const DeleteMedicationDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'DeleteMedication' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
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
            name: { kind: 'Name', value: 'deleteMedication' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'id' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
              },
            ],
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<DeleteMedicationMutation, DeleteMedicationMutationVariables>;
export const MedicationsDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'Medications' },
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
            name: { kind: 'Name', value: 'medications' },
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
                { kind: 'Field', name: { kind: 'Name', value: 'petId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                { kind: 'Field', name: { kind: 'Name', value: 'dosage' } },
                { kind: 'Field', name: { kind: 'Name', value: 'frequency' } },
                { kind: 'Field', name: { kind: 'Name', value: 'startDate' } },
                { kind: 'Field', name: { kind: 'Name', value: 'endDate' } },
                { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
                { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<MedicationsQuery, MedicationsQueryVariables>;
export const RegisterPushTokenDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'RegisterPushToken' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'token' } },
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
            name: { kind: 'Name', value: 'registerPushToken' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'token' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'token' } },
              },
            ],
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<RegisterPushTokenMutation, RegisterPushTokenMutationVariables>;
export const SendTestPushNotificationDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'SendTestPushNotification' },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [{ kind: 'Field', name: { kind: 'Name', value: 'sendTestPushNotification' } }],
      },
    },
  ],
} as unknown as DocumentNode<
  SendTestPushNotificationMutation,
  SendTestPushNotificationMutationVariables
>;
export const NotificationPreferenceDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'NotificationPreference' },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'notificationPreference' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'vaccinationDueEnabled' } },
                { kind: 'Field', name: { kind: 'Name', value: 'appointmentReminderEnabled' } },
                { kind: 'Field', name: { kind: 'Name', value: 'weeklyCheckinEnabled' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<NotificationPreferenceQuery, NotificationPreferenceQueryVariables>;
export const UpdateNotificationPreferenceDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'UpdateNotificationPreference' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
          type: {
            kind: 'NonNullType',
            type: {
              kind: 'NamedType',
              name: { kind: 'Name', value: 'UpdateNotificationPreferenceInput' },
            },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'updateNotificationPreference' },
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
                { kind: 'Field', name: { kind: 'Name', value: 'vaccinationDueEnabled' } },
                { kind: 'Field', name: { kind: 'Name', value: 'appointmentReminderEnabled' } },
                { kind: 'Field', name: { kind: 'Name', value: 'weeklyCheckinEnabled' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<
  UpdateNotificationPreferenceMutation,
  UpdateNotificationPreferenceMutationVariables
>;
export const NotificationAuthCheckDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'NotificationAuthCheck' },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'me' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [{ kind: 'Field', name: { kind: 'Name', value: 'id' } }],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<NotificationAuthCheckQuery, NotificationAuthCheckQueryVariables>;
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
export const UpdatePetDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'UpdatePet' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'ID' } },
          },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'UpdatePetInput' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'updatePet' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'id' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
              },
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
                { kind: 'Field', name: { kind: 'Name', value: 'breed' } },
                { kind: 'Field', name: { kind: 'Name', value: 'birthDate' } },
                { kind: 'Field', name: { kind: 'Name', value: 'gender' } },
                { kind: 'Field', name: { kind: 'Name', value: 'isNeutered' } },
                { kind: 'Field', name: { kind: 'Name', value: 'profileImageUrl' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<UpdatePetMutation, UpdatePetMutationVariables>;
export const DeletePetDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'DeletePet' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
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
            name: { kind: 'Name', value: 'deletePet' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'id' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
              },
            ],
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<DeletePetMutation, DeletePetMutationVariables>;
export const PetDetailDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'PetDetail' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
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
            name: { kind: 'Name', value: 'pet' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'id' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                { kind: 'Field', name: { kind: 'Name', value: 'species' } },
                { kind: 'Field', name: { kind: 'Name', value: 'breed' } },
                { kind: 'Field', name: { kind: 'Name', value: 'birthDate' } },
                { kind: 'Field', name: { kind: 'Name', value: 'gender' } },
                { kind: 'Field', name: { kind: 'Name', value: 'weight' } },
                { kind: 'Field', name: { kind: 'Name', value: 'isNeutered' } },
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
                      { kind: 'Field', name: { kind: 'Name', value: 'numValue' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'textValue' } },
                    ],
                  },
                },
                { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
                { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<PetDetailQuery, PetDetailQueryVariables>;
export const PetEditDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'PetEdit' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
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
            name: { kind: 'Name', value: 'pet' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'id' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                { kind: 'Field', name: { kind: 'Name', value: 'species' } },
                { kind: 'Field', name: { kind: 'Name', value: 'breed' } },
                { kind: 'Field', name: { kind: 'Name', value: 'birthDate' } },
                { kind: 'Field', name: { kind: 'Name', value: 'gender' } },
                { kind: 'Field', name: { kind: 'Name', value: 'weight' } },
                { kind: 'Field', name: { kind: 'Name', value: 'isNeutered' } },
                { kind: 'Field', name: { kind: 'Name', value: 'profileImageUrl' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<PetEditQuery, PetEditQueryVariables>;
export const PetIdsDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'PetIds' },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'pets' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [{ kind: 'Field', name: { kind: 'Name', value: 'id' } }],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<PetIdsQuery, PetIdsQueryVariables>;
export const StartReportShareDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'StartReportShare' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'reportId' } },
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
            name: { kind: 'Name', value: 'startReportShare' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'reportId' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'reportId' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'isActive' } },
                { kind: 'Field', name: { kind: 'Name', value: 'includeConcerns' } },
                { kind: 'Field', name: { kind: 'Name', value: 'shareToken' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<StartReportShareMutation, StartReportShareMutationVariables>;
export const StopReportShareDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'StopReportShare' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'reportId' } },
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
            name: { kind: 'Name', value: 'stopReportShare' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'reportId' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'reportId' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'isActive' } },
                { kind: 'Field', name: { kind: 'Name', value: 'includeConcerns' } },
                { kind: 'Field', name: { kind: 'Name', value: 'shareToken' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<StopReportShareMutation, StopReportShareMutationVariables>;
export const SetReportShareIncludeConcernsDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'SetReportShareIncludeConcerns' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'reportId' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'ID' } },
          },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'includeConcerns' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'Boolean' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'setReportShareIncludeConcerns' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'reportId' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'reportId' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'includeConcerns' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'includeConcerns' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'isActive' } },
                { kind: 'Field', name: { kind: 'Name', value: 'includeConcerns' } },
                { kind: 'Field', name: { kind: 'Name', value: 'shareToken' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<
  SetReportShareIncludeConcernsMutation,
  SetReportShareIncludeConcernsMutationVariables
>;
export const ReportShareSettingsDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'ReportShareSettings' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'reportId' } },
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
            name: { kind: 'Name', value: 'reportShareSettings' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'reportId' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'reportId' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'isActive' } },
                { kind: 'Field', name: { kind: 'Name', value: 'includeConcerns' } },
                { kind: 'Field', name: { kind: 'Name', value: 'shareToken' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<ReportShareSettingsQuery, ReportShareSettingsQueryVariables>;
export const ShareViewerDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'ShareViewer' },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'me' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [{ kind: 'Field', name: { kind: 'Name', value: 'name' } }],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<ShareViewerQuery, ShareViewerQueryVariables>;
export const GenerateReportDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'GenerateReport' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'petId' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'ID' } },
          },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'periodStart' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'DateTime' } },
          },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'periodEnd' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'DateTime' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'generateReport' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'petId' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'petId' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'periodStart' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'periodStart' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'periodEnd' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'periodEnd' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'reportId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'status' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<GenerateReportMutation, GenerateReportMutationVariables>;
export const ReportStatusDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'ReportStatus' },
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
            name: { kind: 'Name', value: 'reportStatus' },
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
                { kind: 'Field', name: { kind: 'Name', value: 'canGenerateThisMonth' } },
                { kind: 'Field', name: { kind: 'Name', value: 'hasEnoughRecords' } },
                { kind: 'Field', name: { kind: 'Name', value: 'recordCount' } },
                { kind: 'Field', name: { kind: 'Name', value: 'recordDays' } },
                { kind: 'Field', name: { kind: 'Name', value: 'nextAvailableAt' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'processingReport' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'status' } },
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
} as unknown as DocumentNode<ReportStatusQuery, ReportStatusQueryVariables>;
export const ReportsDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'Reports' },
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
            name: { kind: 'Name', value: 'reports' },
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
                { kind: 'Field', name: { kind: 'Name', value: 'status' } },
                { kind: 'Field', name: { kind: 'Name', value: 'overview' } },
                { kind: 'Field', name: { kind: 'Name', value: 'highlights' } },
                { kind: 'Field', name: { kind: 'Name', value: 'concerns' } },
                { kind: 'Field', name: { kind: 'Name', value: 'recommendations' } },
                { kind: 'Field', name: { kind: 'Name', value: 'generatedBy' } },
                { kind: 'Field', name: { kind: 'Name', value: 'periodStart' } },
                { kind: 'Field', name: { kind: 'Name', value: 'periodEnd' } },
                { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<ReportsQuery, ReportsQueryVariables>;
export const ReportDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'Report' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
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
            name: { kind: 'Name', value: 'report' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'id' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'petId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'status' } },
                { kind: 'Field', name: { kind: 'Name', value: 'overview' } },
                { kind: 'Field', name: { kind: 'Name', value: 'highlights' } },
                { kind: 'Field', name: { kind: 'Name', value: 'concerns' } },
                { kind: 'Field', name: { kind: 'Name', value: 'recommendations' } },
                { kind: 'Field', name: { kind: 'Name', value: 'generatedBy' } },
                { kind: 'Field', name: { kind: 'Name', value: 'periodStart' } },
                { kind: 'Field', name: { kind: 'Name', value: 'periodEnd' } },
                { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<ReportQuery, ReportQueryVariables>;
export const ReportPollStatusDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'ReportPollStatus' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
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
            name: { kind: 'Name', value: 'reportPollStatus' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'id' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'status' } },
                { kind: 'Field', name: { kind: 'Name', value: 'failedReason' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<ReportPollStatusQuery, ReportPollStatusQueryVariables>;
export const PetsForReportDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'PetsForReport' },
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
                      { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
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
} as unknown as DocumentNode<PetsForReportQuery, PetsForReportQueryVariables>;
export const ReportPeriodPreviewDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'ReportPeriodPreview' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'petId' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'ID' } },
          },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'periodStart' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'DateTime' } },
          },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'periodEnd' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'DateTime' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'reportPeriodPreview' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'petId' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'petId' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'periodStart' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'periodStart' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'periodEnd' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'periodEnd' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'recordCount' } },
                { kind: 'Field', name: { kind: 'Name', value: 'recordDays' } },
                { kind: 'Field', name: { kind: 'Name', value: 'hasEnoughRecords' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<ReportPeriodPreviewQuery, ReportPeriodPreviewQueryVariables>;
export const UpdateProfileDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'UpdateProfile' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'UpdateProfileInput' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'updateProfile' },
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
                { kind: 'Field', name: { kind: 'Name', value: 'email' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<UpdateProfileMutation, UpdateProfileMutationVariables>;
export const SettingsMeDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'SettingsMe' },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'me' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                { kind: 'Field', name: { kind: 'Name', value: 'email' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<SettingsMeQuery, SettingsMeQueryVariables>;
