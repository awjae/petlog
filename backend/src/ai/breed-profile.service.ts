import { Injectable } from '@nestjs/common';
import breedProfile from '../../../libs/ai/breed-profile.json';

type RiskLevel = 'high' | 'medium' | 'low';

export interface BreedCondition {
  name: string;
  risk_level: RiskLevel;
  watch_for: string[];
  age_onset_months: number;
}

export interface BreedAlert {
  condition: string;
  risk_level: RiskLevel;
  watch_for: string[];
}

export interface BreedLifeStageInfo {
  is_senior: boolean;
  recommended_checkup: string;
}

@Injectable()
export class BreedProfileService {
  private calculateAgeMonths(birthDate: Date): number {
    const now = new Date();
    return (
      (now.getFullYear() - birthDate.getFullYear()) * 12 + (now.getMonth() - birthDate.getMonth())
    );
  }

  /**
   * 품종에 따른 주의 질환 목록을 반환한다.
   * 품종이 없거나 프로필에 등록되지 않은 경우 빈 배열을 반환한다.
   */
  getBreedAlerts(
    species: 'dog' | 'cat',
    breed: string | null | undefined,
    birthDate: Date | null | undefined,
  ): BreedAlert[] {
    if (!breed || !birthDate) return [];

    const profile = (
      breedProfile[species] as Record<
        string,
        { predisposed_conditions: BreedCondition[] } | undefined
      >
    )[breed];
    if (!profile) return [];

    const ageMonths = this.calculateAgeMonths(birthDate);
    return profile.predisposed_conditions
      .filter((c) => ageMonths >= c.age_onset_months)
      .map((c) => ({
        condition: c.name,
        risk_level: c.risk_level,
        watch_for: c.watch_for,
      }));
  }

  /**
   * 현재 나이 기준 노령기 여부와 권장 검진 주기를 반환한다.
   * 품종 정보가 없으면 null을 반환한다.
   */
  getLifeStageInfo(
    species: 'dog' | 'cat',
    breed: string | null | undefined,
    birthDate: Date | null | undefined,
  ): BreedLifeStageInfo | null {
    if (!breed || !birthDate) return null;

    const profile = (
      breedProfile[species] as Record<
        string,
        | { life_stage_checks: { senior_age_months: number; recommended_checkup: string } }
        | undefined
      >
    )[breed];
    if (!profile) return null;

    const ageMonths = this.calculateAgeMonths(birthDate);
    return {
      is_senior: ageMonths >= profile.life_stage_checks.senior_age_months,
      recommended_checkup: profile.life_stage_checks.recommended_checkup,
    };
  }
}
