import { Injectable } from '@nestjs/common';
import breedProfile from '../../../libs/ai/breed-profile.json';
import type {
  HealthReportGenerationParams,
  ReportContent,
} from './health-report-generator.interface';

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
    let months =
      (now.getFullYear() - birthDate.getFullYear()) * 12 + (now.getMonth() - birthDate.getMonth());

    // 연/월 차이만 세면 그 달의 생일이 오기 전에도 한 달을 더 센다. 이 값이 is_senior
    // 판정과 품종별 주의 질환 선택에 쓰이므로, 최대 한 달 일찍 시니어로 분류될 수 있다.
    // (프론트의 calcAge도 같은 규칙을 쓴다 — features/pet/utils/petMeta.ts)
    if (now.getDate() < birthDate.getDate()) {
      months -= 1;
    }

    return Math.max(0, months);
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

  /**
   * 생성기가 만든 리포트 본문에 품종 기반 규칙 문구를 덧붙인다.
   * 규칙 기반 병합은 생성기마다가 아니라 여기서 한 번만 한다.
   */
  mergeIntoReport(
    content: ReportContent,
    params: Pick<HealthReportGenerationParams, 'petName' | 'species' | 'breed' | 'birthDate'>,
  ): ReportContent {
    const { petName, species, breed, birthDate } = params;

    const alerts = this.getBreedAlerts(species, breed, birthDate);
    const lifeStage = this.getLifeStageInfo(species, breed, birthDate);

    const highlights = [...content.highlights];
    if (lifeStage?.is_senior) {
      highlights.push(
        `${petName}는 노령기에 접어들었어요. ${lifeStage.recommended_checkup}을 권장해요`,
      );
    }

    const concerns = [
      ...content.concerns,
      ...alerts
        .filter((a) => a.risk_level === 'high')
        .map((a) => `${a.condition} 위험이 있어요. ${a.watch_for.join(', ')} 증상을 주의하세요`),
    ];

    const recommendations = [...content.recommendations];
    // high는 concerns에서 이미 다루므로, medium은 recommendations에서 조건별로 개별 안내한다.
    if (breed) {
      recommendations.push(
        ...alerts
          .filter((a) => a.risk_level === 'medium')
          .map(
            (a) =>
              `${breed} 품종은 ${a.condition} 발병률이 상대적으로 높아요. ${a.watch_for.join(', ')} 증상이 보이면 미리 관리해주세요`,
          ),
      );
    }

    return { ...content, highlights, concerns, recommendations };
  }
}
