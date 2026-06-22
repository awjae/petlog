import { HealthRecordType, AppetiteLevel, ActivityLevel } from "../types";

export function parseHealthRecordValue(
  type: HealthRecordType,
  value: string,
): string | number | AppetiteLevel | ActivityLevel {
  switch (type) {
    case HealthRecordType.Weight:
      return parseFloat(value);
    case HealthRecordType.Appetite:
      return value as AppetiteLevel;
    case HealthRecordType.Activity:
      return value as ActivityLevel;
    default:
      return value;
  }
}

export function formatHealthRecordValue(
  type: HealthRecordType,
  value: string,
): string {
  switch (type) {
    case HealthRecordType.Weight:
      return `${value}kg`;
    case HealthRecordType.Appetite:
      return (
        { none: "없음", low: "적음", normal: "보통", high: "많음" }[value] ??
        value
      );
    case HealthRecordType.Activity:
      return { low: "적음", normal: "보통", high: "활발" }[value] ?? value;
    default:
      return value;
  }
}
