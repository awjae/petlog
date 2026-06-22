import {
  Species,
  Gender,
  HealthRecordType,
  AppetiteLevel,
  ActivityLevel,
  ReportType,
  ReportGeneratedBy,
} from "../types";

export const SPECIES_LABEL: Record<Species, string> = {
  [Species.Dog]: "강아지",
  [Species.Cat]: "고양이",
};

export const GENDER_LABEL: Record<Gender, string> = {
  [Gender.Male]: "수컷",
  [Gender.Female]: "암컷",
  [Gender.Unknown]: "미확인",
};

export const HEALTH_RECORD_TYPE_LABEL: Record<HealthRecordType, string> = {
  [HealthRecordType.Weight]: "체중",
  [HealthRecordType.Appetite]: "식욕",
  [HealthRecordType.Activity]: "활동량",
  [HealthRecordType.Symptom]: "증상",
  [HealthRecordType.Stool]: "배변",
  [HealthRecordType.Vomit]: "구토",
  [HealthRecordType.Mood]: "기분",
};

export const APPETITE_LEVEL_LABEL: Record<AppetiteLevel, string> = {
  [AppetiteLevel.None]: "없음",
  [AppetiteLevel.Low]: "적음",
  [AppetiteLevel.Normal]: "보통",
  [AppetiteLevel.High]: "많음",
};

export const ACTIVITY_LEVEL_LABEL: Record<ActivityLevel, string> = {
  [ActivityLevel.Low]: "적음",
  [ActivityLevel.Normal]: "보통",
  [ActivityLevel.High]: "활발",
};

export const REPORT_TYPE_LABEL: Record<ReportType, string> = {
  [ReportType.Weekly]: "주간 리포트",
  [ReportType.Monthly]: "월간 리포트",
};

export const REPORT_GENERATED_BY_LABEL: Record<ReportGeneratedBy, string> = {
  [ReportGeneratedBy.Mock]: "자동 생성",
  [ReportGeneratedBy.AI]: "AI 분석",
};
