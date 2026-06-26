import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './common/prisma/prisma.module';
import { DateTimeScalar } from './common/scalars/datetime.scalar';
import { PetModule } from './pet/pet.module';
import { HealthRecordModule } from './health-record/health-record.module';
import { MedicalEventModule } from './medical-event/medical-event.module';
import { MedicationModule } from './medication/medication.module';
import { VaccinationModule } from './vaccination/vaccination.module';
import { AppointmentModule } from './appointment/appointment.module';
import { UserModule } from './user/user.module';
import { UploadModule } from './upload/upload.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.generated.graphql'),
      sortSchema: true,
      playground: process.env.NODE_ENV !== 'production',
      path: '/api/graphql',
      context: ({ req }: { req: Request }) => ({ req }),
    }),
    PrismaModule,
    AuthModule,
    PetModule,
    HealthRecordModule,
    MedicalEventModule,
    MedicationModule,
    VaccinationModule,
    AppointmentModule,
    UserModule,
    UploadModule,
  ],
  providers: [DateTimeScalar],
})
export class AppModule {}
