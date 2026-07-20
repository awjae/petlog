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
  '\n  query HomeQuery {\n    me {\n      recordDates(limit: 90)\n      pets {\n        id\n        name\n        species\n        breed\n        birthDate\n        profileImageUrl\n        recentWeight {\n          value\n          recordedAt\n        }\n        todayRecordCount\n        totalHealthRecordCount\n        recentHealthRecords(limit: 5) {\n          id\n          type\n          recordedAt\n          summary\n        }\n      }\n      upcomingSchedules(limit: 3) {\n        id\n        petId\n        petName\n        petProfileImageUrl\n        type\n        title\n        dueDate\n      }\n    }\n  }\n': typeof types.HomeQueryDocument;
  '\n  mutation CreateMedicalEvent($input: CreateMedicalEventInput!) {\n    createMedicalEvent(input: $input) {\n      id\n      visitDate\n      hospitalName\n    }\n  }\n': typeof types.CreateMedicalEventDocument;
  '\n  mutation DeleteMedicalEvent($id: ID!) {\n    deleteMedicalEvent(id: $id)\n  }\n': typeof types.DeleteMedicalEventDocument;
  '\n  mutation CreateVaccination($input: CreateVaccinationInput!) {\n    createVaccination(input: $input) {\n      id\n      name\n      vaccinatedAt\n    }\n  }\n': typeof types.CreateVaccinationDocument;
  '\n    mutation DeleteVaccination($id: ID!) {\n      deleteVaccination(id: $id)\n    }\n  ': typeof types.DeleteVaccinationDocument;
  '\n  mutation CreateAppointment($input: CreateAppointmentInput!) {\n    createAppointment(input: $input) {\n      id\n      hospitalName\n      scheduledAt\n    }\n  }\n': typeof types.CreateAppointmentDocument;
  '\n    mutation DeleteAppointment($id: ID!) {\n      deleteAppointment(id: $id)\n    }\n  ': typeof types.DeleteAppointmentDocument;
  '\n  query MedicalEvents($petId: ID!) {\n    medicalEvents(petId: $petId) {\n      id\n      petId\n      hospitalName\n      visitDate\n      description\n      attachmentUrls\n      createdAt\n      updatedAt\n    }\n  }\n': typeof types.MedicalEventsDocument;
  '\n  query Vaccinations($petId: ID!) {\n    vaccinations(petId: $petId) {\n      id\n      petId\n      name\n      code\n      vaccinatedAt\n      nextDueAt\n      memo\n      createdAt\n      updatedAt\n    }\n  }\n': typeof types.VaccinationsDocument;
  '\n  query Appointments($petId: ID!) {\n    appointments(petId: $petId) {\n      id\n      petId\n      hospitalName\n      scheduledAt\n      reason\n      status\n      memo\n      createdAt\n      updatedAt\n    }\n  }\n': typeof types.AppointmentsDocument;
  '\n  mutation CreateMedication($input: CreateMedicationInput!) {\n    createMedication(input: $input) {\n      id\n      name\n      startDate\n    }\n  }\n': typeof types.CreateMedicationDocument;
  '\n    mutation DeleteMedication($id: ID!) {\n      deleteMedication(id: $id)\n    }\n  ': typeof types.DeleteMedicationDocument;
  '\n  query Medications($petId: ID!) {\n    medications(petId: $petId) {\n      id\n      petId\n      name\n      dosage\n      frequency\n      startDate\n      endDate\n      createdAt\n      updatedAt\n    }\n  }\n': typeof types.MedicationsDocument;
  '\n  mutation RegisterPushToken($token: String!) {\n    registerPushToken(token: $token)\n  }\n': typeof types.RegisterPushTokenDocument;
  '\n  mutation SendTestPushNotification {\n    sendTestPushNotification\n  }\n': typeof types.SendTestPushNotificationDocument;
  '\n  query NotificationPreference {\n    notificationPreference {\n      vaccinationDueEnabled\n      appointmentReminderEnabled\n      weeklyCheckinEnabled\n    }\n  }\n': typeof types.NotificationPreferenceDocument;
  '\n  mutation UpdateNotificationPreference($input: UpdateNotificationPreferenceInput!) {\n    updateNotificationPreference(input: $input) {\n      vaccinationDueEnabled\n      appointmentReminderEnabled\n      weeklyCheckinEnabled\n    }\n  }\n': typeof types.UpdateNotificationPreferenceDocument;
  '\n  query NotificationAuthCheck {\n    me {\n      id\n    }\n  }\n': typeof types.NotificationAuthCheckDocument;
  '\n  mutation CreatePet($input: CreatePetInput!) {\n    createPet(input: $input) {\n      id\n      name\n      species\n    }\n  }\n': typeof types.CreatePetDocument;
  '\n    mutation UpdatePet($id: ID!, $input: UpdatePetInput!) {\n      updatePet(id: $id, input: $input) {\n        id\n        name\n        species\n        breed\n        birthDate\n        gender\n        isNeutered\n        profileImageUrl\n      }\n    }\n  ': typeof types.UpdatePetDocument;
  '\n    mutation DeletePet($id: ID!) {\n      deletePet(id: $id)\n    }\n  ': typeof types.DeletePetDocument;
  '\n  query PetDetail($id: ID!) {\n    pet(id: $id) {\n      id\n      name\n      species\n      breed\n      birthDate\n      gender\n      weight\n      isNeutered\n      profileImageUrl\n      recentWeight {\n        value\n        recordedAt\n      }\n      todayRecordCount\n      recentHealthRecords(limit: 5) {\n        id\n        type\n        recordedAt\n        summary\n      }\n      createdAt\n      updatedAt\n    }\n  }\n': typeof types.PetDetailDocument;
  '\n  query PetEdit($id: ID!) {\n    pet(id: $id) {\n      id\n      name\n      species\n      breed\n      birthDate\n      gender\n      weight\n      isNeutered\n      profileImageUrl\n    }\n  }\n': typeof types.PetEditDocument;
  '\n  query PetIds {\n    pets {\n      id\n    }\n  }\n': typeof types.PetIdsDocument;
  '\n  mutation StartReportShare($reportId: ID!) {\n    startReportShare(reportId: $reportId) {\n      isActive\n      includeConcerns\n      shareToken\n    }\n  }\n': typeof types.StartReportShareDocument;
  '\n  mutation StopReportShare($reportId: ID!) {\n    stopReportShare(reportId: $reportId) {\n      isActive\n      includeConcerns\n      shareToken\n    }\n  }\n': typeof types.StopReportShareDocument;
  '\n  mutation SetReportShareIncludeConcerns($reportId: ID!, $includeConcerns: Boolean!) {\n    setReportShareIncludeConcerns(reportId: $reportId, includeConcerns: $includeConcerns) {\n      isActive\n      includeConcerns\n      shareToken\n    }\n  }\n': typeof types.SetReportShareIncludeConcernsDocument;
  '\n  query ReportShareSettings($reportId: ID!) {\n    reportShareSettings(reportId: $reportId) {\n      isActive\n      includeConcerns\n      shareToken\n    }\n  }\n': typeof types.ReportShareSettingsDocument;
  '\n  query ShareViewer {\n    me {\n      name\n    }\n  }\n': typeof types.ShareViewerDocument;
  '\n  mutation GenerateReport($petId: ID!, $periodStart: DateTime!, $periodEnd: DateTime!) {\n    generateReport(petId: $petId, periodStart: $periodStart, periodEnd: $periodEnd) {\n      reportId\n      status\n    }\n  }\n': typeof types.GenerateReportDocument;
  '\n  query ReportStatus($petId: ID!) {\n    reportStatus(petId: $petId) {\n      canGenerateThisMonth\n      hasEnoughRecords\n      recordCount\n      recordDays\n      nextAvailableAt\n      processingReport {\n        id\n        status\n      }\n    }\n  }\n': typeof types.ReportStatusDocument;
  '\n  query Reports($petId: ID!) {\n    reports(petId: $petId) {\n      id\n      status\n      overview\n      highlights\n      concerns\n      recommendations\n      generatedBy\n      periodStart\n      periodEnd\n      createdAt\n    }\n  }\n': typeof types.ReportsDocument;
  '\n  query Report($id: ID!) {\n    report(id: $id) {\n      id\n      petId\n      status\n      overview\n      highlights\n      concerns\n      recommendations\n      generatedBy\n      periodStart\n      periodEnd\n      createdAt\n    }\n  }\n': typeof types.ReportDocument;
  '\n  query ReportPollStatus($id: ID!) {\n    reportPollStatus(id: $id) {\n      id\n      status\n      failedReason\n    }\n  }\n': typeof types.ReportPollStatusDocument;
  '\n  query PetsForReport {\n    me {\n      pets {\n        id\n        name\n        createdAt\n      }\n    }\n  }\n': typeof types.PetsForReportDocument;
  '\n  query ReportPeriodPreview($petId: ID!, $periodStart: DateTime!, $periodEnd: DateTime!) {\n    reportPeriodPreview(petId: $petId, periodStart: $periodStart, periodEnd: $periodEnd) {\n      recordCount\n      recordDays\n      hasEnoughRecords\n    }\n  }\n': typeof types.ReportPeriodPreviewDocument;
  '\n  mutation UpdateProfile($input: UpdateProfileInput!) {\n    updateProfile(input: $input) {\n      id\n      name\n      email\n    }\n  }\n': typeof types.UpdateProfileDocument;
  '\n  query SettingsMe {\n    me {\n      name\n      email\n    }\n  }\n': typeof types.SettingsMeDocument;
};
const documents: Documents = {
  '\n  mutation CreateHealthRecord($input: CreateHealthRecordInput!) {\n    createHealthRecord(input: $input) {\n      id\n      type\n      recordedAt\n    }\n  }\n':
    types.CreateHealthRecordDocument,
  '\n  query HealthRecords($petId: ID!) {\n    healthRecords(petId: $petId) {\n      id\n      type\n      recordedAt\n      numValue\n      textValue\n      note\n    }\n  }\n':
    types.HealthRecordsDocument,
  '\n  query HomeQuery {\n    me {\n      recordDates(limit: 90)\n      pets {\n        id\n        name\n        species\n        breed\n        birthDate\n        profileImageUrl\n        recentWeight {\n          value\n          recordedAt\n        }\n        todayRecordCount\n        totalHealthRecordCount\n        recentHealthRecords(limit: 5) {\n          id\n          type\n          recordedAt\n          summary\n        }\n      }\n      upcomingSchedules(limit: 3) {\n        id\n        petId\n        petName\n        petProfileImageUrl\n        type\n        title\n        dueDate\n      }\n    }\n  }\n':
    types.HomeQueryDocument,
  '\n  mutation CreateMedicalEvent($input: CreateMedicalEventInput!) {\n    createMedicalEvent(input: $input) {\n      id\n      visitDate\n      hospitalName\n    }\n  }\n':
    types.CreateMedicalEventDocument,
  '\n  mutation DeleteMedicalEvent($id: ID!) {\n    deleteMedicalEvent(id: $id)\n  }\n':
    types.DeleteMedicalEventDocument,
  '\n  mutation CreateVaccination($input: CreateVaccinationInput!) {\n    createVaccination(input: $input) {\n      id\n      name\n      vaccinatedAt\n    }\n  }\n':
    types.CreateVaccinationDocument,
  '\n    mutation DeleteVaccination($id: ID!) {\n      deleteVaccination(id: $id)\n    }\n  ':
    types.DeleteVaccinationDocument,
  '\n  mutation CreateAppointment($input: CreateAppointmentInput!) {\n    createAppointment(input: $input) {\n      id\n      hospitalName\n      scheduledAt\n    }\n  }\n':
    types.CreateAppointmentDocument,
  '\n    mutation DeleteAppointment($id: ID!) {\n      deleteAppointment(id: $id)\n    }\n  ':
    types.DeleteAppointmentDocument,
  '\n  query MedicalEvents($petId: ID!) {\n    medicalEvents(petId: $petId) {\n      id\n      petId\n      hospitalName\n      visitDate\n      description\n      attachmentUrls\n      createdAt\n      updatedAt\n    }\n  }\n':
    types.MedicalEventsDocument,
  '\n  query Vaccinations($petId: ID!) {\n    vaccinations(petId: $petId) {\n      id\n      petId\n      name\n      code\n      vaccinatedAt\n      nextDueAt\n      memo\n      createdAt\n      updatedAt\n    }\n  }\n':
    types.VaccinationsDocument,
  '\n  query Appointments($petId: ID!) {\n    appointments(petId: $petId) {\n      id\n      petId\n      hospitalName\n      scheduledAt\n      reason\n      status\n      memo\n      createdAt\n      updatedAt\n    }\n  }\n':
    types.AppointmentsDocument,
  '\n  mutation CreateMedication($input: CreateMedicationInput!) {\n    createMedication(input: $input) {\n      id\n      name\n      startDate\n    }\n  }\n':
    types.CreateMedicationDocument,
  '\n    mutation DeleteMedication($id: ID!) {\n      deleteMedication(id: $id)\n    }\n  ':
    types.DeleteMedicationDocument,
  '\n  query Medications($petId: ID!) {\n    medications(petId: $petId) {\n      id\n      petId\n      name\n      dosage\n      frequency\n      startDate\n      endDate\n      createdAt\n      updatedAt\n    }\n  }\n':
    types.MedicationsDocument,
  '\n  mutation RegisterPushToken($token: String!) {\n    registerPushToken(token: $token)\n  }\n':
    types.RegisterPushTokenDocument,
  '\n  mutation SendTestPushNotification {\n    sendTestPushNotification\n  }\n':
    types.SendTestPushNotificationDocument,
  '\n  query NotificationPreference {\n    notificationPreference {\n      vaccinationDueEnabled\n      appointmentReminderEnabled\n      weeklyCheckinEnabled\n    }\n  }\n':
    types.NotificationPreferenceDocument,
  '\n  mutation UpdateNotificationPreference($input: UpdateNotificationPreferenceInput!) {\n    updateNotificationPreference(input: $input) {\n      vaccinationDueEnabled\n      appointmentReminderEnabled\n      weeklyCheckinEnabled\n    }\n  }\n':
    types.UpdateNotificationPreferenceDocument,
  '\n  query NotificationAuthCheck {\n    me {\n      id\n    }\n  }\n':
    types.NotificationAuthCheckDocument,
  '\n  mutation CreatePet($input: CreatePetInput!) {\n    createPet(input: $input) {\n      id\n      name\n      species\n    }\n  }\n':
    types.CreatePetDocument,
  '\n    mutation UpdatePet($id: ID!, $input: UpdatePetInput!) {\n      updatePet(id: $id, input: $input) {\n        id\n        name\n        species\n        breed\n        birthDate\n        gender\n        isNeutered\n        profileImageUrl\n      }\n    }\n  ':
    types.UpdatePetDocument,
  '\n    mutation DeletePet($id: ID!) {\n      deletePet(id: $id)\n    }\n  ':
    types.DeletePetDocument,
  '\n  query PetDetail($id: ID!) {\n    pet(id: $id) {\n      id\n      name\n      species\n      breed\n      birthDate\n      gender\n      weight\n      isNeutered\n      profileImageUrl\n      recentWeight {\n        value\n        recordedAt\n      }\n      todayRecordCount\n      recentHealthRecords(limit: 5) {\n        id\n        type\n        recordedAt\n        summary\n      }\n      createdAt\n      updatedAt\n    }\n  }\n':
    types.PetDetailDocument,
  '\n  query PetEdit($id: ID!) {\n    pet(id: $id) {\n      id\n      name\n      species\n      breed\n      birthDate\n      gender\n      weight\n      isNeutered\n      profileImageUrl\n    }\n  }\n':
    types.PetEditDocument,
  '\n  query PetIds {\n    pets {\n      id\n    }\n  }\n': types.PetIdsDocument,
  '\n  mutation StartReportShare($reportId: ID!) {\n    startReportShare(reportId: $reportId) {\n      isActive\n      includeConcerns\n      shareToken\n    }\n  }\n':
    types.StartReportShareDocument,
  '\n  mutation StopReportShare($reportId: ID!) {\n    stopReportShare(reportId: $reportId) {\n      isActive\n      includeConcerns\n      shareToken\n    }\n  }\n':
    types.StopReportShareDocument,
  '\n  mutation SetReportShareIncludeConcerns($reportId: ID!, $includeConcerns: Boolean!) {\n    setReportShareIncludeConcerns(reportId: $reportId, includeConcerns: $includeConcerns) {\n      isActive\n      includeConcerns\n      shareToken\n    }\n  }\n':
    types.SetReportShareIncludeConcernsDocument,
  '\n  query ReportShareSettings($reportId: ID!) {\n    reportShareSettings(reportId: $reportId) {\n      isActive\n      includeConcerns\n      shareToken\n    }\n  }\n':
    types.ReportShareSettingsDocument,
  '\n  query ShareViewer {\n    me {\n      name\n    }\n  }\n': types.ShareViewerDocument,
  '\n  mutation GenerateReport($petId: ID!, $periodStart: DateTime!, $periodEnd: DateTime!) {\n    generateReport(petId: $petId, periodStart: $periodStart, periodEnd: $periodEnd) {\n      reportId\n      status\n    }\n  }\n':
    types.GenerateReportDocument,
  '\n  query ReportStatus($petId: ID!) {\n    reportStatus(petId: $petId) {\n      canGenerateThisMonth\n      hasEnoughRecords\n      recordCount\n      recordDays\n      nextAvailableAt\n      processingReport {\n        id\n        status\n      }\n    }\n  }\n':
    types.ReportStatusDocument,
  '\n  query Reports($petId: ID!) {\n    reports(petId: $petId) {\n      id\n      status\n      overview\n      highlights\n      concerns\n      recommendations\n      generatedBy\n      periodStart\n      periodEnd\n      createdAt\n    }\n  }\n':
    types.ReportsDocument,
  '\n  query Report($id: ID!) {\n    report(id: $id) {\n      id\n      petId\n      status\n      overview\n      highlights\n      concerns\n      recommendations\n      generatedBy\n      periodStart\n      periodEnd\n      createdAt\n    }\n  }\n':
    types.ReportDocument,
  '\n  query ReportPollStatus($id: ID!) {\n    reportPollStatus(id: $id) {\n      id\n      status\n      failedReason\n    }\n  }\n':
    types.ReportPollStatusDocument,
  '\n  query PetsForReport {\n    me {\n      pets {\n        id\n        name\n        createdAt\n      }\n    }\n  }\n':
    types.PetsForReportDocument,
  '\n  query ReportPeriodPreview($petId: ID!, $periodStart: DateTime!, $periodEnd: DateTime!) {\n    reportPeriodPreview(petId: $petId, periodStart: $periodStart, periodEnd: $periodEnd) {\n      recordCount\n      recordDays\n      hasEnoughRecords\n    }\n  }\n':
    types.ReportPeriodPreviewDocument,
  '\n  mutation UpdateProfile($input: UpdateProfileInput!) {\n    updateProfile(input: $input) {\n      id\n      name\n      email\n    }\n  }\n':
    types.UpdateProfileDocument,
  '\n  query SettingsMe {\n    me {\n      name\n      email\n    }\n  }\n':
    types.SettingsMeDocument,
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
  source: '\n  query HomeQuery {\n    me {\n      recordDates(limit: 90)\n      pets {\n        id\n        name\n        species\n        breed\n        birthDate\n        profileImageUrl\n        recentWeight {\n          value\n          recordedAt\n        }\n        todayRecordCount\n        totalHealthRecordCount\n        recentHealthRecords(limit: 5) {\n          id\n          type\n          recordedAt\n          summary\n        }\n      }\n      upcomingSchedules(limit: 3) {\n        id\n        petId\n        petName\n        petProfileImageUrl\n        type\n        title\n        dueDate\n      }\n    }\n  }\n',
): (typeof documents)['\n  query HomeQuery {\n    me {\n      recordDates(limit: 90)\n      pets {\n        id\n        name\n        species\n        breed\n        birthDate\n        profileImageUrl\n        recentWeight {\n          value\n          recordedAt\n        }\n        todayRecordCount\n        totalHealthRecordCount\n        recentHealthRecords(limit: 5) {\n          id\n          type\n          recordedAt\n          summary\n        }\n      }\n      upcomingSchedules(limit: 3) {\n        id\n        petId\n        petName\n        petProfileImageUrl\n        type\n        title\n        dueDate\n      }\n    }\n  }\n'];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  mutation CreateMedicalEvent($input: CreateMedicalEventInput!) {\n    createMedicalEvent(input: $input) {\n      id\n      visitDate\n      hospitalName\n    }\n  }\n',
): (typeof documents)['\n  mutation CreateMedicalEvent($input: CreateMedicalEventInput!) {\n    createMedicalEvent(input: $input) {\n      id\n      visitDate\n      hospitalName\n    }\n  }\n'];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  mutation DeleteMedicalEvent($id: ID!) {\n    deleteMedicalEvent(id: $id)\n  }\n',
): (typeof documents)['\n  mutation DeleteMedicalEvent($id: ID!) {\n    deleteMedicalEvent(id: $id)\n  }\n'];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  mutation CreateVaccination($input: CreateVaccinationInput!) {\n    createVaccination(input: $input) {\n      id\n      name\n      vaccinatedAt\n    }\n  }\n',
): (typeof documents)['\n  mutation CreateVaccination($input: CreateVaccinationInput!) {\n    createVaccination(input: $input) {\n      id\n      name\n      vaccinatedAt\n    }\n  }\n'];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n    mutation DeleteVaccination($id: ID!) {\n      deleteVaccination(id: $id)\n    }\n  ',
): (typeof documents)['\n    mutation DeleteVaccination($id: ID!) {\n      deleteVaccination(id: $id)\n    }\n  '];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  mutation CreateAppointment($input: CreateAppointmentInput!) {\n    createAppointment(input: $input) {\n      id\n      hospitalName\n      scheduledAt\n    }\n  }\n',
): (typeof documents)['\n  mutation CreateAppointment($input: CreateAppointmentInput!) {\n    createAppointment(input: $input) {\n      id\n      hospitalName\n      scheduledAt\n    }\n  }\n'];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n    mutation DeleteAppointment($id: ID!) {\n      deleteAppointment(id: $id)\n    }\n  ',
): (typeof documents)['\n    mutation DeleteAppointment($id: ID!) {\n      deleteAppointment(id: $id)\n    }\n  '];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  query MedicalEvents($petId: ID!) {\n    medicalEvents(petId: $petId) {\n      id\n      petId\n      hospitalName\n      visitDate\n      description\n      attachmentUrls\n      createdAt\n      updatedAt\n    }\n  }\n',
): (typeof documents)['\n  query MedicalEvents($petId: ID!) {\n    medicalEvents(petId: $petId) {\n      id\n      petId\n      hospitalName\n      visitDate\n      description\n      attachmentUrls\n      createdAt\n      updatedAt\n    }\n  }\n'];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  query Vaccinations($petId: ID!) {\n    vaccinations(petId: $petId) {\n      id\n      petId\n      name\n      code\n      vaccinatedAt\n      nextDueAt\n      memo\n      createdAt\n      updatedAt\n    }\n  }\n',
): (typeof documents)['\n  query Vaccinations($petId: ID!) {\n    vaccinations(petId: $petId) {\n      id\n      petId\n      name\n      code\n      vaccinatedAt\n      nextDueAt\n      memo\n      createdAt\n      updatedAt\n    }\n  }\n'];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  query Appointments($petId: ID!) {\n    appointments(petId: $petId) {\n      id\n      petId\n      hospitalName\n      scheduledAt\n      reason\n      status\n      memo\n      createdAt\n      updatedAt\n    }\n  }\n',
): (typeof documents)['\n  query Appointments($petId: ID!) {\n    appointments(petId: $petId) {\n      id\n      petId\n      hospitalName\n      scheduledAt\n      reason\n      status\n      memo\n      createdAt\n      updatedAt\n    }\n  }\n'];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  mutation CreateMedication($input: CreateMedicationInput!) {\n    createMedication(input: $input) {\n      id\n      name\n      startDate\n    }\n  }\n',
): (typeof documents)['\n  mutation CreateMedication($input: CreateMedicationInput!) {\n    createMedication(input: $input) {\n      id\n      name\n      startDate\n    }\n  }\n'];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n    mutation DeleteMedication($id: ID!) {\n      deleteMedication(id: $id)\n    }\n  ',
): (typeof documents)['\n    mutation DeleteMedication($id: ID!) {\n      deleteMedication(id: $id)\n    }\n  '];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  query Medications($petId: ID!) {\n    medications(petId: $petId) {\n      id\n      petId\n      name\n      dosage\n      frequency\n      startDate\n      endDate\n      createdAt\n      updatedAt\n    }\n  }\n',
): (typeof documents)['\n  query Medications($petId: ID!) {\n    medications(petId: $petId) {\n      id\n      petId\n      name\n      dosage\n      frequency\n      startDate\n      endDate\n      createdAt\n      updatedAt\n    }\n  }\n'];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  mutation RegisterPushToken($token: String!) {\n    registerPushToken(token: $token)\n  }\n',
): (typeof documents)['\n  mutation RegisterPushToken($token: String!) {\n    registerPushToken(token: $token)\n  }\n'];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  mutation SendTestPushNotification {\n    sendTestPushNotification\n  }\n',
): (typeof documents)['\n  mutation SendTestPushNotification {\n    sendTestPushNotification\n  }\n'];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  query NotificationPreference {\n    notificationPreference {\n      vaccinationDueEnabled\n      appointmentReminderEnabled\n      weeklyCheckinEnabled\n    }\n  }\n',
): (typeof documents)['\n  query NotificationPreference {\n    notificationPreference {\n      vaccinationDueEnabled\n      appointmentReminderEnabled\n      weeklyCheckinEnabled\n    }\n  }\n'];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  mutation UpdateNotificationPreference($input: UpdateNotificationPreferenceInput!) {\n    updateNotificationPreference(input: $input) {\n      vaccinationDueEnabled\n      appointmentReminderEnabled\n      weeklyCheckinEnabled\n    }\n  }\n',
): (typeof documents)['\n  mutation UpdateNotificationPreference($input: UpdateNotificationPreferenceInput!) {\n    updateNotificationPreference(input: $input) {\n      vaccinationDueEnabled\n      appointmentReminderEnabled\n      weeklyCheckinEnabled\n    }\n  }\n'];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  query NotificationAuthCheck {\n    me {\n      id\n    }\n  }\n',
): (typeof documents)['\n  query NotificationAuthCheck {\n    me {\n      id\n    }\n  }\n'];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  mutation CreatePet($input: CreatePetInput!) {\n    createPet(input: $input) {\n      id\n      name\n      species\n    }\n  }\n',
): (typeof documents)['\n  mutation CreatePet($input: CreatePetInput!) {\n    createPet(input: $input) {\n      id\n      name\n      species\n    }\n  }\n'];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n    mutation UpdatePet($id: ID!, $input: UpdatePetInput!) {\n      updatePet(id: $id, input: $input) {\n        id\n        name\n        species\n        breed\n        birthDate\n        gender\n        isNeutered\n        profileImageUrl\n      }\n    }\n  ',
): (typeof documents)['\n    mutation UpdatePet($id: ID!, $input: UpdatePetInput!) {\n      updatePet(id: $id, input: $input) {\n        id\n        name\n        species\n        breed\n        birthDate\n        gender\n        isNeutered\n        profileImageUrl\n      }\n    }\n  '];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n    mutation DeletePet($id: ID!) {\n      deletePet(id: $id)\n    }\n  ',
): (typeof documents)['\n    mutation DeletePet($id: ID!) {\n      deletePet(id: $id)\n    }\n  '];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  query PetDetail($id: ID!) {\n    pet(id: $id) {\n      id\n      name\n      species\n      breed\n      birthDate\n      gender\n      weight\n      isNeutered\n      profileImageUrl\n      recentWeight {\n        value\n        recordedAt\n      }\n      todayRecordCount\n      recentHealthRecords(limit: 5) {\n        id\n        type\n        recordedAt\n        summary\n      }\n      createdAt\n      updatedAt\n    }\n  }\n',
): (typeof documents)['\n  query PetDetail($id: ID!) {\n    pet(id: $id) {\n      id\n      name\n      species\n      breed\n      birthDate\n      gender\n      weight\n      isNeutered\n      profileImageUrl\n      recentWeight {\n        value\n        recordedAt\n      }\n      todayRecordCount\n      recentHealthRecords(limit: 5) {\n        id\n        type\n        recordedAt\n        summary\n      }\n      createdAt\n      updatedAt\n    }\n  }\n'];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  query PetEdit($id: ID!) {\n    pet(id: $id) {\n      id\n      name\n      species\n      breed\n      birthDate\n      gender\n      weight\n      isNeutered\n      profileImageUrl\n    }\n  }\n',
): (typeof documents)['\n  query PetEdit($id: ID!) {\n    pet(id: $id) {\n      id\n      name\n      species\n      breed\n      birthDate\n      gender\n      weight\n      isNeutered\n      profileImageUrl\n    }\n  }\n'];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  query PetIds {\n    pets {\n      id\n    }\n  }\n',
): (typeof documents)['\n  query PetIds {\n    pets {\n      id\n    }\n  }\n'];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  mutation StartReportShare($reportId: ID!) {\n    startReportShare(reportId: $reportId) {\n      isActive\n      includeConcerns\n      shareToken\n    }\n  }\n',
): (typeof documents)['\n  mutation StartReportShare($reportId: ID!) {\n    startReportShare(reportId: $reportId) {\n      isActive\n      includeConcerns\n      shareToken\n    }\n  }\n'];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  mutation StopReportShare($reportId: ID!) {\n    stopReportShare(reportId: $reportId) {\n      isActive\n      includeConcerns\n      shareToken\n    }\n  }\n',
): (typeof documents)['\n  mutation StopReportShare($reportId: ID!) {\n    stopReportShare(reportId: $reportId) {\n      isActive\n      includeConcerns\n      shareToken\n    }\n  }\n'];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  mutation SetReportShareIncludeConcerns($reportId: ID!, $includeConcerns: Boolean!) {\n    setReportShareIncludeConcerns(reportId: $reportId, includeConcerns: $includeConcerns) {\n      isActive\n      includeConcerns\n      shareToken\n    }\n  }\n',
): (typeof documents)['\n  mutation SetReportShareIncludeConcerns($reportId: ID!, $includeConcerns: Boolean!) {\n    setReportShareIncludeConcerns(reportId: $reportId, includeConcerns: $includeConcerns) {\n      isActive\n      includeConcerns\n      shareToken\n    }\n  }\n'];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  query ReportShareSettings($reportId: ID!) {\n    reportShareSettings(reportId: $reportId) {\n      isActive\n      includeConcerns\n      shareToken\n    }\n  }\n',
): (typeof documents)['\n  query ReportShareSettings($reportId: ID!) {\n    reportShareSettings(reportId: $reportId) {\n      isActive\n      includeConcerns\n      shareToken\n    }\n  }\n'];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  query ShareViewer {\n    me {\n      name\n    }\n  }\n',
): (typeof documents)['\n  query ShareViewer {\n    me {\n      name\n    }\n  }\n'];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  mutation GenerateReport($petId: ID!, $periodStart: DateTime!, $periodEnd: DateTime!) {\n    generateReport(petId: $petId, periodStart: $periodStart, periodEnd: $periodEnd) {\n      reportId\n      status\n    }\n  }\n',
): (typeof documents)['\n  mutation GenerateReport($petId: ID!, $periodStart: DateTime!, $periodEnd: DateTime!) {\n    generateReport(petId: $petId, periodStart: $periodStart, periodEnd: $periodEnd) {\n      reportId\n      status\n    }\n  }\n'];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  query ReportStatus($petId: ID!) {\n    reportStatus(petId: $petId) {\n      canGenerateThisMonth\n      hasEnoughRecords\n      recordCount\n      recordDays\n      nextAvailableAt\n      processingReport {\n        id\n        status\n      }\n    }\n  }\n',
): (typeof documents)['\n  query ReportStatus($petId: ID!) {\n    reportStatus(petId: $petId) {\n      canGenerateThisMonth\n      hasEnoughRecords\n      recordCount\n      recordDays\n      nextAvailableAt\n      processingReport {\n        id\n        status\n      }\n    }\n  }\n'];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  query Reports($petId: ID!) {\n    reports(petId: $petId) {\n      id\n      status\n      overview\n      highlights\n      concerns\n      recommendations\n      generatedBy\n      periodStart\n      periodEnd\n      createdAt\n    }\n  }\n',
): (typeof documents)['\n  query Reports($petId: ID!) {\n    reports(petId: $petId) {\n      id\n      status\n      overview\n      highlights\n      concerns\n      recommendations\n      generatedBy\n      periodStart\n      periodEnd\n      createdAt\n    }\n  }\n'];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  query Report($id: ID!) {\n    report(id: $id) {\n      id\n      petId\n      status\n      overview\n      highlights\n      concerns\n      recommendations\n      generatedBy\n      periodStart\n      periodEnd\n      createdAt\n    }\n  }\n',
): (typeof documents)['\n  query Report($id: ID!) {\n    report(id: $id) {\n      id\n      petId\n      status\n      overview\n      highlights\n      concerns\n      recommendations\n      generatedBy\n      periodStart\n      periodEnd\n      createdAt\n    }\n  }\n'];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  query ReportPollStatus($id: ID!) {\n    reportPollStatus(id: $id) {\n      id\n      status\n      failedReason\n    }\n  }\n',
): (typeof documents)['\n  query ReportPollStatus($id: ID!) {\n    reportPollStatus(id: $id) {\n      id\n      status\n      failedReason\n    }\n  }\n'];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  query PetsForReport {\n    me {\n      pets {\n        id\n        name\n        createdAt\n      }\n    }\n  }\n',
): (typeof documents)['\n  query PetsForReport {\n    me {\n      pets {\n        id\n        name\n        createdAt\n      }\n    }\n  }\n'];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  query ReportPeriodPreview($petId: ID!, $periodStart: DateTime!, $periodEnd: DateTime!) {\n    reportPeriodPreview(petId: $petId, periodStart: $periodStart, periodEnd: $periodEnd) {\n      recordCount\n      recordDays\n      hasEnoughRecords\n    }\n  }\n',
): (typeof documents)['\n  query ReportPeriodPreview($petId: ID!, $periodStart: DateTime!, $periodEnd: DateTime!) {\n    reportPeriodPreview(petId: $petId, periodStart: $periodStart, periodEnd: $periodEnd) {\n      recordCount\n      recordDays\n      hasEnoughRecords\n    }\n  }\n'];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  mutation UpdateProfile($input: UpdateProfileInput!) {\n    updateProfile(input: $input) {\n      id\n      name\n      email\n    }\n  }\n',
): (typeof documents)['\n  mutation UpdateProfile($input: UpdateProfileInput!) {\n    updateProfile(input: $input) {\n      id\n      name\n      email\n    }\n  }\n'];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  query SettingsMe {\n    me {\n      name\n      email\n    }\n  }\n',
): (typeof documents)['\n  query SettingsMe {\n    me {\n      name\n      email\n    }\n  }\n'];

export function gql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> =
  TDocumentNode extends DocumentNode<infer TType, any> ? TType : never;
