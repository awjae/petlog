'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import {
  MEDICAL_EVENTS_QUERY,
  VACCINATIONS_QUERY,
  APPOINTMENTS_QUERY,
} from '../api/medical.queries';
import {
  CREATE_MEDICAL_EVENT_MUTATION,
  DELETE_MEDICAL_EVENT_MUTATION,
  CREATE_VACCINATION_MUTATION,
  DELETE_VACCINATION_MUTATION,
  CREATE_APPOINTMENT_MUTATION,
  DELETE_APPOINTMENT_MUTATION,
} from '../api/medical.mutations';
import type {
  CreateMedicalEventFormInput,
  CreateVaccinationFormInput,
  CreateAppointmentFormInput,
} from '../types/medical.types';

function toDateIso(dateStr: string, time = 'T12:00:00'): string {
  return new Date(dateStr + time).toISOString();
}

export function useMedicalEvents(petId: string) {
  return useQuery(MEDICAL_EVENTS_QUERY, {
    variables: { petId },
    fetchPolicy: 'cache-and-network',
  });
}

export function useVaccinations(petId: string) {
  return useQuery(VACCINATIONS_QUERY, {
    variables: { petId },
    fetchPolicy: 'cache-and-network',
  });
}

export function useAppointments(petId: string) {
  return useQuery(APPOINTMENTS_QUERY, {
    variables: { petId },
    fetchPolicy: 'cache-and-network',
  });
}

export function useCreateMedicalEvent() {
  const [error, setError] = useState('');
  const [mutate, { loading }] = useMutation(CREATE_MEDICAL_EVENT_MUTATION, {
    refetchQueries: ['MedicalEvents', 'CalendarQuery'],
    onError: () => setError('저장에 실패했어요. 다시 시도해주세요.'),
  });

  async function createMedicalEvent(input: CreateMedicalEventFormInput): Promise<boolean> {
    setError('');
    const result = await mutate({
      variables: {
        input: {
          petId: input.petId,
          hospitalName: input.hospitalName,
          visitDate: toDateIso(input.visitDate),
          description: input.description.trim() || '-',
        },
      },
    }).catch(() => null);
    return result?.data?.createMedicalEvent != null;
  }

  return { createMedicalEvent, loading, error };
}

export function useDeleteMedicalEvent() {
  const [mutate, { loading }] = useMutation(DELETE_MEDICAL_EVENT_MUTATION, {
    refetchQueries: ['MedicalEvents', 'CalendarQuery'],
  });
  return {
    deleteMedicalEvent: (id: string) => mutate({ variables: { id } }),
    loading,
  };
}

export function useCreateVaccination() {
  const [error, setError] = useState('');
  const [mutate, { loading }] = useMutation(CREATE_VACCINATION_MUTATION, {
    refetchQueries: ['Vaccinations', 'HomeQuery', 'CalendarQuery'],
    onError: () => setError('저장에 실패했어요. 다시 시도해주세요.'),
  });

  async function createVaccination(input: CreateVaccinationFormInput): Promise<boolean> {
    setError('');
    const result = await mutate({
      variables: {
        input: {
          petId: input.petId,
          name: input.name,
          vaccinatedAt: toDateIso(input.vaccinatedAt),
          nextDueAt: input.nextDueAt ? toDateIso(input.nextDueAt) : undefined,
          memo: input.memo?.trim() || undefined,
        },
      },
    }).catch(() => null);
    return result?.data?.createVaccination != null;
  }

  return { createVaccination, loading, error };
}

export function useDeleteVaccination() {
  const [mutate, { loading }] = useMutation(DELETE_VACCINATION_MUTATION, {
    refetchQueries: ['Vaccinations', 'CalendarQuery'],
  });
  return {
    deleteVaccination: (id: string) => mutate({ variables: { id } }),
    loading,
  };
}

export function useCreateAppointment() {
  const [error, setError] = useState('');
  const [mutate, { loading }] = useMutation(CREATE_APPOINTMENT_MUTATION, {
    refetchQueries: ['Appointments', 'HomeQuery', 'CalendarQuery'],
    onError: () => setError('저장에 실패했어요. 다시 시도해주세요.'),
  });

  async function createAppointment(input: CreateAppointmentFormInput): Promise<boolean> {
    setError('');
    const result = await mutate({
      variables: {
        input: {
          petId: input.petId,
          hospitalName: input.hospitalName,
          scheduledAt: toDateIso(input.scheduledAt, 'T09:00:00'),
          reason: input.reason?.trim() || undefined,
          memo: input.memo?.trim() || undefined,
        },
      },
    }).catch(() => null);
    return result?.data?.createAppointment != null;
  }

  return { createAppointment, loading, error };
}

export function useDeleteAppointment() {
  const [mutate, { loading }] = useMutation(DELETE_APPOINTMENT_MUTATION, {
    refetchQueries: ['Appointments', 'CalendarQuery'],
  });
  return {
    deleteAppointment: (id: string) => mutate({ variables: { id } }),
    loading,
  };
}
