import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { ConsentType } from '@prisma/client';
import type { User as PrismaUser } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { ConsentService } from '../consent/consent.service';
import { REQUIRED_CONSENT_TYPES } from '../consent/consent.constants';

const BCRYPT_ROUNDS = 12;

export interface RegisterConsents {
  termsOfService: boolean;
  privacyPolicy: boolean;
  marketingNotification: boolean;
}

export interface RequestMeta {
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly consentService: ConsentService,
  ) {}

  async findById(id: string): Promise<PrismaUser | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async findByEmail(email: string): Promise<PrismaUser | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  // 회원가입. User 생성과 동의 이력 3건 기록을 하나의 트랜잭션으로 묶어 원자적으로 처리한다 —
  // 둘 중 하나라도 실패하면 계정도, 동의 이력도 남지 않아야 한다(계정만 만들어지고 동의 이력이
  // 누락되는 상태를 방지). 필수 항목(termsOfService, privacyPolicy) 미동의는 DB CHECK 제약으로도
  // 막히지만, 트랜잭션 롤백 전에 명확한 에러 메시지를 주기 위해 여기서 먼저 검증한다.
  async create(
    email: string,
    password: string,
    name: string | undefined,
    consents: RegisterConsents,
    requestMeta: RequestMeta,
  ): Promise<PrismaUser> {
    const existing = await this.findByEmail(email);
    if (existing) throw new ConflictException('이미 사용 중인 이메일입니다.');

    const consentValues: Record<ConsentType, boolean> = {
      [ConsentType.termsOfService]: consents.termsOfService,
      [ConsentType.privacyPolicy]: consents.privacyPolicy,
      [ConsentType.marketingNotification]: consents.marketingNotification,
    };
    const missingRequired = REQUIRED_CONSENT_TYPES.some((type) => !consentValues[type]);
    if (missingRequired) {
      throw new BadRequestException('이용약관 및 개인정보처리방침에 동의해야 가입할 수 있습니다.');
    }

    const hash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({ data: { email, password: hash, name } });

      await this.consentService.recordConsents(
        user.id,
        [
          { consentType: ConsentType.termsOfService, agreed: consents.termsOfService },
          { consentType: ConsentType.privacyPolicy, agreed: consents.privacyPolicy },
          {
            consentType: ConsentType.marketingNotification,
            agreed: consents.marketingNotification,
          },
        ],
        requestMeta,
        tx,
      );

      return user;
    });
  }

  async validateUser(email: string, password: string): Promise<PrismaUser> {
    const user = await this.findByEmail(email);
    if (!user) throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');

    return user;
  }

  // 계정 삭제(탈퇴) 흐름에서 사용. validateUser()는 email 기반이라 이미 로그인된
  // 사용자(id 기준)의 본인 확인에는 맞지 않아 별도로 둔다.
  async verifyPassword(id: string, password: string): Promise<boolean> {
    const user = await this.findById(id);
    if (!user) return false;

    return bcrypt.compare(password, user.password);
  }

  async updateProfile(id: string, name: string): Promise<PrismaUser> {
    return this.prisma.user.update({ where: { id }, data: { name } });
  }

  // 비밀번호 재설정(Forgot Password) 흐름에서 사용. create()와 동일한 bcrypt 규칙을 적용한다.
  async updatePassword(id: string, newPassword: string): Promise<void> {
    const hash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await this.prisma.user.update({ where: { id }, data: { password: hash } });
  }

  async getRecordDates(userId: string, limit: number): Promise<string[]> {
    const pets = await this.prisma.pet.findMany({
      where: { userId },
      select: { id: true },
    });
    if (pets.length === 0) return [];

    const petIds = pets.map((p) => p.id);

    const records = await this.prisma.healthRecord.findMany({
      where: { petId: { in: petIds } },
      select: { recordedAt: true },
      orderBy: { recordedAt: 'desc' },
      take: limit,
    });

    return records.map((r) => r.recordedAt.toISOString());
  }
}
