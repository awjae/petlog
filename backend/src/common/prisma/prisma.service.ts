import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { softDeleteExtension } from './soft-delete.extension';

const createClient = () => new PrismaClient().$extends(softDeleteExtension);

type ExtendedPrismaClient = ReturnType<typeof createClient>;

@Injectable()
export class PrismaService implements OnModuleInit {
  private readonly client: ExtendedPrismaClient;

  constructor() {
    this.client = createClient();
  }

  async onModuleInit() {
    await this.client.$connect();
  }

  // 각 모델을 그대로 위임 — 사용처에서 prisma.pet.findMany() 형태 유지
  get user() {
    return this.client.user;
  }
  get pet() {
    return this.client.pet;
  }
  get healthRecord() {
    return this.client.healthRecord;
  }
  get medicalEvent() {
    return this.client.medicalEvent;
  }
  get medication() {
    return this.client.medication;
  }
  get vaccination() {
    return this.client.vaccination;
  }
  get appointment() {
    return this.client.appointment;
  }
  get report() {
    return this.client.report;
  }
  get pushToken() {
    return this.client.pushToken;
  }
  get refreshToken() {
    return this.client.refreshToken;
  }
  get notification() {
    return this.client.notification;
  }
  get $transaction() {
    return this.client.$transaction.bind(this.client);
  }
}
