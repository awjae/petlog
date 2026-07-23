import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { softDeleteExtension } from './soft-delete.extension';

const createClient = () => new PrismaClient().$extends(softDeleteExtension);

type ExtendedPrismaClient = ReturnType<typeof createClient>;

// $transaction(async (tx) => ...) 콜백에 전달되는 트랜잭션 클라이언트의 타입.
// 서비스 레이어에서 "트랜잭션 내부에서 호출될 수도 있는" 메서드(예: ConsentService.recordConsents)의
// 선택적 tx 파라미터 타입으로 사용한다. $connect/$disconnect 등 트랜잭션 컨텍스트에서
// 호출 불가능한 최상위 메서드는 Prisma.TransactionClient와 동일하게 제외한다.
export type PrismaTransactionClient = Omit<
  ExtendedPrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

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
  get reportShare() {
    return this.client.reportShare;
  }
  get pushToken() {
    return this.client.pushToken;
  }
  get refreshToken() {
    return this.client.refreshToken;
  }
  get passwordResetToken() {
    return this.client.passwordResetToken;
  }
  get notification() {
    return this.client.notification;
  }
  get notificationPreference() {
    return this.client.notificationPreference;
  }
  get userConsent() {
    return this.client.userConsent;
  }
  get $transaction() {
    return this.client.$transaction.bind(this.client);
  }
}
