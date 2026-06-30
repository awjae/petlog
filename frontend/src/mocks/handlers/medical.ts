import { graphql, HttpResponse } from 'msw';

type CreateMedicalEventInput = {
  petId: string;
  hospitalName: string;
  visitDate: string;
  description: string;
};

type CreateVaccinationInput = {
  petId: string;
  name: string;
  code?: string;
  vaccinatedAt: string;
  nextDueAt?: string;
  memo?: string;
};

type CreateAppointmentInput = {
  petId: string;
  hospitalName: string;
  scheduledAt: string;
  reason?: string;
  memo?: string;
};

type CreateMedicationInput = {
  petId: string;
  name: string;
  dosage: string;
  frequency: string;
  startDate: string;
  endDate?: string;
};

type MockMedicalEvent = {
  id: string;
  petId: string;
  hospitalName: string;
  visitDate: string;
  description: string;
  attachmentUrls: string[];
  createdAt: string;
  updatedAt: string;
};
type MockVaccination = {
  id: string;
  petId: string;
  name: string;
  code: string | null;
  vaccinatedAt: string;
  nextDueAt: string | null;
  memo: string | null;
  createdAt: string;
  updatedAt: string;
};
type MockAppointment = {
  id: string;
  petId: string;
  hospitalName: string;
  scheduledAt: string;
  reason: string | null;
  status: string;
  memo: string | null;
  createdAt: string;
  updatedAt: string;
};
type MockMedication = {
  id: string;
  petId: string;
  name: string;
  dosage: string;
  frequency: string;
  startDate: string;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
};

const mockMedicalEvents: MockMedicalEvent[] = [
  {
    id: 'me-1',
    petId: 'pet-1',
    hospitalName: '행복 동물병원',
    visitDate: '2026-06-10T12:00:00.000Z',
    description: '정기 건강검진. 체중 정상, 치석 제거 권장.',
    attachmentUrls: [],
    createdAt: '2026-06-10T12:00:00.000Z',
    updatedAt: '2026-06-10T12:00:00.000Z',
  },
  {
    id: 'me-2',
    petId: 'pet-1',
    hospitalName: '하늘 동물병원',
    visitDate: '2026-05-20T12:00:00.000Z',
    description: '기침 증상으로 방문. 기관지염 소견.',
    attachmentUrls: [],
    createdAt: '2026-05-20T12:00:00.000Z',
    updatedAt: '2026-05-20T12:00:00.000Z',
  },
];

const mockVaccinations: MockVaccination[] = [
  {
    id: 'vac-1',
    petId: 'pet-1',
    name: '종합백신 DHPPL',
    code: null,
    vaccinatedAt: '2026-03-15T12:00:00.000Z',
    nextDueAt: '2027-03-15T12:00:00.000Z',
    memo: null,
    createdAt: '2026-03-15T12:00:00.000Z',
    updatedAt: '2026-03-15T12:00:00.000Z',
  },
  {
    id: 'vac-2',
    petId: 'pet-1',
    name: '광견병',
    code: null,
    vaccinatedAt: '2026-03-15T12:00:00.000Z',
    nextDueAt: '2026-07-03T12:00:00.000Z',
    memo: null,
    createdAt: '2026-03-15T12:00:00.000Z',
    updatedAt: '2026-03-15T12:00:00.000Z',
  },
];

const mockAppointments: MockAppointment[] = [
  {
    id: 'apt-1',
    petId: 'pet-1',
    hospitalName: '행복 동물병원',
    scheduledAt: '2026-07-05T09:00:00.000Z',
    reason: '정기 검진',
    status: 'SCHEDULED',
    memo: null,
    createdAt: '2026-06-28T00:00:00.000Z',
    updatedAt: '2026-06-28T00:00:00.000Z',
  },
];

const mockMedications: MockMedication[] = [
  {
    id: 'med-1',
    petId: 'pet-1',
    name: '심장사상충 예방약',
    dosage: '-',
    frequency: '하루 1회',
    startDate: '2026-06-01T12:00:00.000Z',
    endDate: null,
    createdAt: '2026-06-01T12:00:00.000Z',
    updatedAt: '2026-06-01T12:00:00.000Z',
  },
];

export const medicalHandlers = [
  graphql.query('MedicalEvents', ({ variables }) => {
    const { petId } = variables as { petId: string };
    return HttpResponse.json({
      data: { medicalEvents: mockMedicalEvents.filter((e) => e.petId === petId) },
    });
  }),

  graphql.mutation('CreateMedicalEvent', ({ variables }) => {
    const { input } = variables as { input: CreateMedicalEventInput };
    const item = {
      id: `me-${Date.now()}`,
      petId: input.petId,
      hospitalName: input.hospitalName,
      visitDate: input.visitDate,
      description: input.description,
      attachmentUrls: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockMedicalEvents.unshift(item);
    return HttpResponse.json({
      data: {
        createMedicalEvent: {
          id: item.id,
          visitDate: item.visitDate,
          hospitalName: item.hospitalName,
        },
      },
    });
  }),

  graphql.mutation('DeleteMedicalEvent', ({ variables }) => {
    const { id } = variables as { id: string };
    const idx = mockMedicalEvents.findIndex((e) => e.id === id);
    if (idx !== -1) mockMedicalEvents.splice(idx, 1);
    return HttpResponse.json({ data: { deleteMedicalEvent: true } });
  }),

  graphql.query('Vaccinations', ({ variables }) => {
    const { petId } = variables as { petId: string };
    return HttpResponse.json({
      data: { vaccinations: mockVaccinations.filter((v) => v.petId === petId) },
    });
  }),

  graphql.mutation('CreateVaccination', ({ variables }) => {
    const { input } = variables as { input: CreateVaccinationInput };
    const item = {
      id: `vac-${Date.now()}`,
      petId: input.petId,
      name: input.name,
      code: input.code ?? null,
      vaccinatedAt: input.vaccinatedAt,
      nextDueAt: input.nextDueAt ?? null,
      memo: input.memo ?? null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockVaccinations.unshift(item);
    return HttpResponse.json({
      data: {
        createVaccination: { id: item.id, name: item.name, vaccinatedAt: item.vaccinatedAt },
      },
    });
  }),

  graphql.mutation('DeleteVaccination', ({ variables }) => {
    const { id } = variables as { id: string };
    const idx = mockVaccinations.findIndex((v) => v.id === id);
    if (idx !== -1) mockVaccinations.splice(idx, 1);
    return HttpResponse.json({ data: { deleteVaccination: true } });
  }),

  graphql.query('Appointments', ({ variables }) => {
    const { petId } = variables as { petId: string };
    return HttpResponse.json({
      data: { appointments: mockAppointments.filter((a) => a.petId === petId) },
    });
  }),

  graphql.mutation('CreateAppointment', ({ variables }) => {
    const { input } = variables as { input: CreateAppointmentInput };
    const item = {
      id: `apt-${Date.now()}`,
      petId: input.petId,
      hospitalName: input.hospitalName,
      scheduledAt: input.scheduledAt,
      reason: input.reason ?? null,
      status: 'SCHEDULED',
      memo: input.memo ?? null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockAppointments.unshift(item);
    return HttpResponse.json({
      data: {
        createAppointment: {
          id: item.id,
          hospitalName: item.hospitalName,
          scheduledAt: item.scheduledAt,
        },
      },
    });
  }),

  graphql.mutation('DeleteAppointment', ({ variables }) => {
    const { id } = variables as { id: string };
    const idx = mockAppointments.findIndex((a) => a.id === id);
    if (idx !== -1) mockAppointments.splice(idx, 1);
    return HttpResponse.json({ data: { deleteAppointment: true } });
  }),

  graphql.query('Medications', ({ variables }) => {
    const { petId } = variables as { petId: string };
    return HttpResponse.json({
      data: { medications: mockMedications.filter((m) => m.petId === petId) },
    });
  }),

  graphql.mutation('CreateMedication', ({ variables }) => {
    const { input } = variables as { input: CreateMedicationInput };
    const item = {
      id: `med-${Date.now()}`,
      petId: input.petId,
      name: input.name,
      dosage: input.dosage,
      frequency: input.frequency,
      startDate: input.startDate,
      endDate: input.endDate ?? null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockMedications.unshift(item);
    return HttpResponse.json({
      data: {
        createMedication: { id: item.id, name: item.name, startDate: item.startDate },
      },
    });
  }),

  graphql.mutation('DeleteMedication', ({ variables }) => {
    const { id } = variables as { id: string };
    const idx = mockMedications.findIndex((m) => m.id === id);
    if (idx !== -1) mockMedications.splice(idx, 1);
    return HttpResponse.json({ data: { deleteMedication: true } });
  }),
];
