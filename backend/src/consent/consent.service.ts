import { Injectable } from '@nestjs/common';
import { ConsentType } from '@prisma/client';
import { PrismaService, PrismaTransactionClient } from '../common/prisma/prisma.service';
import { CONSENT_POLICY_VERSIONS } from './consent.constants';

export interface ConsentEntryInput {
  consentType: ConsentType;
  agreed: boolean;
}

export interface ConsentMeta {
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class ConsentService {
  constructor(private readonly prisma: PrismaService) {}

  // 동의 이력을 append-only로 기록한다. 기존 행은 절대 수정하지 않는다.
  // tx가 주어지면 해당 트랜잭션 클라이언트를 사용한다 — 회원가입 시 User 생성과 원자적으로
  // 묶일 때(user.service.ts) 사용하고, 없으면 PrismaService를 직접 사용한다(설정 화면의 단건 토글 등).
  async recordConsents(
    userId: string,
    entries: ConsentEntryInput[],
    meta: ConsentMeta,
    tx?: PrismaTransactionClient,
  ): Promise<void> {
    const client = tx ?? this.prisma;
    await client.userConsent.createMany({
      data: entries.map((entry) => ({
        userId,
        consentType: entry.consentType,
        agreed: entry.agreed,
        policyVersion: CONSENT_POLICY_VERSIONS[entry.consentType],
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      })),
    });
  }

  // 설정 화면 진입 시 현재 마케팅 알림 동의 상태를 조회한다.
  // (userId, consentType)별 가장 최근 행이 "현재 상태"다. 행이 없으면 false로 간주한다.
  async getMarketingConsentStatus(userId: string): Promise<boolean> {
    const latest = await this.prisma.userConsent.findFirst({
      where: { userId, consentType: ConsentType.marketingNotification },
      orderBy: { createdAt: 'desc' },
    });
    return latest?.agreed ?? false;
  }

  // 설정 화면의 마케팅 동의 토글. append-only이므로 기존 행을 수정하지 않고 새 행을 추가한다.
  async updateMarketingConsent(
    userId: string,
    agreed: boolean,
    meta: ConsentMeta,
  ): Promise<boolean> {
    await this.recordConsents(
      userId,
      [{ consentType: ConsentType.marketingNotification, agreed }],
      meta,
    );
    return agreed;
  }
}
