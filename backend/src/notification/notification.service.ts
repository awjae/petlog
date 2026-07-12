import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import { NotificationReferenceType, NotificationType } from '@prisma/client';
import { PUSH_SENDER, type PushSender } from '@petlog/push';
import { PrismaService } from '../common/prisma/prisma.service';

interface SendAndLogParams {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  referenceId?: string;
  referenceType?: NotificationReferenceType | null;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(PUSH_SENDER) private readonly pushSender: PushSender,
  ) {}

  // 기기별 FCM 토큰을 등록한다. token이 unique이므로 이미 등록된 토큰이면
  // 소유권(userId)만 현재 사용자로 재이전한다 — 다른 계정으로 재로그인한 기기 케이스.
  async registerPushToken(userId: string, token: string): Promise<boolean> {
    await this.prisma.pushToken.upsert({
      where: { token },
      create: { userId, token },
      update: { userId },
    });
    return true;
  }

  // 스케줄러 로직과 무관한 수동 테스트 트리거. Notification 테이블에 로그를 남기지 않는다 —
  // 중복 발송 방지 이력(scanAndSend*)과 섞이면 안 되므로 완전히 별도 경로로 유지한다.
  async sendTestPush(userId: string): Promise<boolean> {
    const tokens = await this.prisma.pushToken.findMany({ where: { userId } });
    if (tokens.length === 0) {
      throw new BadRequestException('등록된 푸시 토큰이 없습니다.');
    }

    await Promise.all(
      tokens.map((pushToken) =>
        this.pushSender.send(pushToken.token, '[Petlog] 테스트 알림', '테스트 푸시 알림입니다.'),
      ),
    );
    return true;
  }

  // 접종 예정일(nextDueAt) D-7 스캔. 하루 1회 크론이 전체 pet을 훑으므로
  // pet별로는 자연히 하루 1회 스캔이 된다.
  //
  // 중복 발송 방지: 동일 vaccination.id에 대해 이미 발송 이력(Notification.sentAt not null)이
  // 있으면 건너뛴다. nextDueAt이 바뀌지 않는 한 하나의 접종 기록이 D-7 구간에 들어오는 시점은
  // 단 하루뿐이므로, "이 접종에 대해 한 번이라도 보냈는지"만 확인하면 당일 중복 스캔과
  // 매일 재스캔에 의한 중복 발송을 동시에 막을 수 있다.
  async scanAndSendVaccinationDue(): Promise<void> {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 7);
    const { start, end } = dayRange(targetDate);

    const dueVaccinations = await this.prisma.vaccination.findMany({
      where: {
        deletedAt: null,
        nextDueAt: { gte: start, lt: end },
      },
      include: { pet: { select: { id: true, name: true, userId: true, deletedAt: true } } },
    });

    for (const vaccination of dueVaccinations) {
      if (vaccination.pet.deletedAt) continue;

      const alreadySent = await this.prisma.notification.findFirst({
        where: {
          type: NotificationType.vaccinationDue,
          referenceId: vaccination.id,
          referenceType: NotificationReferenceType.vaccination,
          sentAt: { not: null },
        },
      });
      if (alreadySent) continue;

      await this.sendAndLog({
        userId: vaccination.pet.userId,
        type: NotificationType.vaccinationDue,
        title: `[Petlog] ${vaccination.pet.name} 접종 예정 알림`,
        body: `${vaccination.name} 접종 예정일이 7일 남았어요.`,
        referenceId: vaccination.id,
        referenceType: NotificationReferenceType.vaccination,
      });
    }

    this.logger.log(`접종 임박 알림 스캔 완료: ${dueVaccinations.length}건 대상`);
  }

  // 건강기록 권장 알림. pet의 최신 HealthRecord.recordedAt이 7일 이상 경과하면 발송한다.
  // NotificationReferenceType에는 healthRecord 값이 없으므로 referenceType은 null로 저장하고,
  // referenceId에는 petId를 담아 "어떤 pet에 대한 알림인지"를 식별한다.
  //
  // 중복 발송 방지: 직전에 보낸 weeklyCheckin 알림의 sentAt이 최신 기록의 recordedAt보다
  // 이후라면(= 그 알림을 보낸 뒤로 새 기록이 없었다면) 재발송하지 않는다. 이후 새 기록이
  // 생기고 그 기록이 다시 7일 이상 경과하면 그 시점에는 조건이 풀려 재발송된다.
  async scanAndSendWeeklyCheckin(): Promise<void> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const pets = await this.prisma.pet.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true, userId: true },
    });

    let sentCount = 0;

    for (const pet of pets) {
      const latestRecord = await this.prisma.healthRecord.findFirst({
        where: { petId: pet.id, deletedAt: null },
        orderBy: { recordedAt: 'desc' },
        select: { recordedAt: true },
      });
      const lastRecordedAt = latestRecord?.recordedAt ?? null;

      if (lastRecordedAt && lastRecordedAt > sevenDaysAgo) continue;

      const lastNotification = await this.prisma.notification.findFirst({
        where: {
          userId: pet.userId,
          type: NotificationType.weeklyCheckin,
          referenceId: pet.id,
          sentAt: { not: null },
        },
        orderBy: { sentAt: 'desc' },
        select: { sentAt: true },
      });

      const alreadyNotifiedForThisGap =
        lastNotification?.sentAt != null &&
        (lastRecordedAt == null || lastNotification.sentAt > lastRecordedAt);
      if (alreadyNotifiedForThisGap) continue;

      await this.sendAndLog({
        userId: pet.userId,
        type: NotificationType.weeklyCheckin,
        title: `[Petlog] ${pet.name} 건강기록을 남겨보세요`,
        body: '최근 7일간 새로운 건강 기록이 없어요. 오늘의 상태를 기록해보세요.',
        referenceId: pet.id,
        referenceType: null,
      });
      sentCount += 1;
    }

    this.logger.log(`건강기록 권장 알림 스캔 완료: ${sentCount}건 발송`);
  }

  private async sendAndLog(params: SendAndLogParams): Promise<void> {
    const tokens = await this.prisma.pushToken.findMany({ where: { userId: params.userId } });

    await this.prisma.notification.create({
      data: {
        userId: params.userId,
        type: params.type,
        title: params.title,
        body: params.body,
        referenceId: params.referenceId,
        referenceType: params.referenceType,
        sentAt: new Date(),
      },
    });

    await Promise.all(
      tokens.map((pushToken) => this.pushSender.send(pushToken.token, params.title, params.body)),
    );
  }
}

function dayRange(date: Date): { start: Date; end: Date } {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}
