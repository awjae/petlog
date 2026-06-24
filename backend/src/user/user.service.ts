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

  async create(email: string, password: string, name: string): Promise<PrismaUser> {
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

  async updateProfile(id: string, name: string): Promise<PrismaUser> {
    return this.prisma.user.update({ where: { id }, data: { name } });
  }
}
