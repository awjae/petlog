import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import type { User as PrismaUser } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';

const BCRYPT_ROUNDS = 12;

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<PrismaUser | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async findByEmail(email: string): Promise<PrismaUser | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async create(email: string, password: string, name?: string): Promise<PrismaUser> {
    const existing = await this.findByEmail(email);
    if (existing) throw new ConflictException('이미 사용 중인 이메일입니다.');

    const hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    return this.prisma.user.create({ data: { email, password: hash, name } });
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
