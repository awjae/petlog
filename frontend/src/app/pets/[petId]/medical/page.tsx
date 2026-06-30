'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Loader2 } from 'lucide-react';
import { MedicalHubTabs } from '@/features/medical/components/MedicalHubTabs';
import { MedicalVisitList } from '@/features/medical/components/MedicalVisitList';
import { VaccinationList } from '@/features/medical/components/VaccinationList';
import { AppointmentList } from '@/features/medical/components/AppointmentList';
import {
  useMedicalEvents,
  useVaccinations,
  useAppointments,
  useDeleteMedicalEvent,
  useDeleteVaccination,
  useDeleteAppointment,
} from '@/features/medical/hooks/useMedical';
import { FAB } from '@/features/shared/components/FAB';
import type { MedicalHubTab } from '@/features/medical/types/medical.types';
import styles from './page.module.css';

export default function MedicalHubPage({ params }: { params: Promise<{ petId: string }> }) {
  const router = useRouter();
  const { petId } = use(params);
  const [activeTab, setActiveTab] = useState<MedicalHubTab>('visits');

  const medicalEventsResult = useMedicalEvents(petId);
  const vaccinationsResult = useVaccinations(petId);
  const appointmentsResult = useAppointments(petId);
  const { deleteMedicalEvent } = useDeleteMedicalEvent();
  const { deleteVaccination } = useDeleteVaccination();
  const { deleteAppointment } = useDeleteAppointment();

  const FAB_HREF: Record<MedicalHubTab, string> = {
    visits: `/pets/${petId}/medical/new`,
    vaccinations: `/pets/${petId}/medical/vaccinations/new`,
    appointments: `/pets/${petId}/medical/appointments/new`,
  };

  function renderContent() {
    if (activeTab === 'visits') {
      if (medicalEventsResult.loading && !medicalEventsResult.data) {
        return <LoadingState />;
      }
      if (medicalEventsResult.error && !medicalEventsResult.data) {
        return <ErrorState message="방문 기록을 불러올 수 없어요." />;
      }
      return (
        <MedicalVisitList
          items={medicalEventsResult.data?.medicalEvents ?? []}
          onDelete={(id) => deleteMedicalEvent(id)}
        />
      );
    }

    if (activeTab === 'vaccinations') {
      if (vaccinationsResult.loading && !vaccinationsResult.data) {
        return <LoadingState />;
      }
      if (vaccinationsResult.error && !vaccinationsResult.data) {
        return <ErrorState message="예방접종 기록을 불러올 수 없어요." />;
      }
      return (
        <VaccinationList
          items={vaccinationsResult.data?.vaccinations ?? []}
          onDelete={(id) => deleteVaccination(id)}
        />
      );
    }

    if (activeTab === 'appointments') {
      if (appointmentsResult.loading && !appointmentsResult.data) {
        return <LoadingState />;
      }
      if (appointmentsResult.error && !appointmentsResult.data) {
        return <ErrorState message="예약 내역을 불러올 수 없어요." />;
      }
      return (
        <AppointmentList
          items={appointmentsResult.data?.appointments ?? []}
          onDelete={(id) => deleteAppointment(id)}
        />
      );
    }

    return null;
  }

  return (
    <main className={styles.main} aria-label="병원 기록">
      <header className={styles.header}>
        <button
          type="button"
          className={styles.backBtn}
          onClick={() => router.back()}
          aria-label="뒤로"
        >
          <ChevronLeft size={22} strokeWidth={2} aria-hidden="true" />
        </button>
        <h1 className={styles.title}>병원 기록</h1>
        <div className={styles.headerSpacer} aria-hidden="true" />
      </header>

      <MedicalHubTabs active={activeTab} onChange={setActiveTab} />

      <div className={styles.content}>{renderContent()}</div>

      <FAB href={FAB_HREF[activeTab]} label="기록 추가" />
    </main>
  );
}

function LoadingState() {
  return (
    <div className={styles.loadingState} aria-label="로딩 중">
      <Loader2 size={32} className={styles.spinner} aria-hidden="true" />
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className={styles.errorState} role="alert">
      <p className={styles.errorText}>{message}</p>
    </div>
  );
}
