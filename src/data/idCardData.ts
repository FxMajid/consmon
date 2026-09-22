import { IDCardKonsumsi } from '../types';

// Area Kerja resmi sesuai dataset panitia & lapangan HBD
export const WORK_AREAS = [
  'Backstage',
  'Main Stage',
  'Second Stage',
  'BOOTH GAMES',
  'FOTO BOOTH',
  'MODIFIKASI',
  'MOTORAN',
  'REGISTRASI',
  'RIDING TEST',
  'SERVICE MOTOR',
  'UMKM',
  'Booth & Arena',
  'KONSUMSI',
  'PERLENGKAPAN',
  'OB Area',
  'Community Basecamp',
  'Tenda Medis',
  'Pos Polisi & Gate Venue',
  'Pos Babinsa',
  'Area Parkir & 6 Gate',
  'WP',
  'Mobile',
  'All Area',
];

export const INITIAL_ID_CARDS: IDCardKonsumsi[] = [
  {
    id: 'IDC-001',
    cardCode: 'HBD-ID-001',
    activationCode: 'HBD-ACT-IDC-001',
    pickupCode: 'HBD-PICKUP-IDC-001',
    status: 'active',
    holderName: 'Raditya Pratama',
    holderEmail: 'raditya.pratama@event-hbd.id',
    areaKerja: 'Main Stage & Talent',
    kategori: 'Internal',
    activatedAt: '2026-09-21 07:15',
    notes: 'PIC Stage Coordinator',
    claimedMeals: {
      pagi: { claimed: true, claimedAt: '06:45' },
      siang: { claimed: false },
      malam: { claimed: false },
    },
  },
  {
    id: 'IDC-002',
    cardCode: 'HBD-ID-002',
    activationCode: 'HBD-ACT-IDC-002',
    pickupCode: 'HBD-PICKUP-IDC-002',
    status: 'active',
    holderName: 'Citra Kirana Lestari',
    holderEmail: 'citra.lestari@event-hbd.id',
    areaKerja: 'FOH Sound & Lighting',
    kategori: 'Internal',
    activatedAt: '2026-09-21 07:30',
    notes: 'Lead Audio Engineering',
    claimedMeals: {
      pagi: { claimed: true, claimedAt: '07:05' },
      siang: { claimed: false },
      malam: { claimed: false },
    },
  },
  {
    id: 'IDC-003',
    cardCode: 'HBD-ID-003',
    activationCode: 'HBD-ACT-IDC-003',
    pickupCode: 'HBD-PICKUP-IDC-003',
    status: 'active',
    holderName: 'dr. Dimas Anggara',
    holderEmail: 'dimas.medis@rs-mitra.org',
    areaKerja: 'Pos Medis & Tim Rescue',
    kategori: 'Eksternal',
    activatedAt: '2026-09-21 08:00',
    notes: 'Dokter Jaga Pos 1',
    claimedMeals: {
      pagi: { claimed: false },
      siang: { claimed: false },
      malam: { claimed: false },
    },
  },
  {
    id: 'IDC-004',
    cardCode: 'HBD-ID-004',
    activationCode: 'HBD-ACT-IDC-004',
    pickupCode: 'HBD-PICKUP-IDC-004',
    status: 'active',
    holderName: 'Faisal Riza Ramadhan',
    holderEmail: 'faisal.riza@taskforce.id',
    areaKerja: 'Mobile Taskforce Area',
    kategori: 'Mobile',
    activatedAt: '2026-09-21 08:15',
    notes: 'Patroli Ring 1',
    claimedMeals: {
      pagi: { claimed: false },
      siang: { claimed: false },
      malam: { claimed: false },
    },
  },
  {
    id: 'IDC-005',
    cardCode: 'HBD-ID-005',
    activationCode: 'HBD-ACT-IDC-005',
    pickupCode: 'HBD-PICKUP-IDC-005',
    status: 'active',
    holderName: 'Linda Wulandari',
    holderEmail: 'linda.w@event-hbd.id',
    areaKerja: 'Ticketing & Gate Masuk',
    kategori: 'Internal',
    activatedAt: '2026-09-21 08:20',
    notes: 'Koordinator Pintu Barat',
    claimedMeals: {
      pagi: { claimed: true, claimedAt: '07:15' },
      siang: { claimed: false },
      malam: { claimed: false },
    },
  },
  // IDC-006 to IDC-025 are unactivated (ready for printing and activating)
  ...Array.from({ length: 20 }, (_, idx) => {
    const num = idx + 6;
    const pad = String(num).padStart(3, '0');
    const id = `IDC-${pad}`;
    return {
      id,
      cardCode: `HBD-ID-${pad}`,
      activationCode: `HBD-ACT-${id}`,
      pickupCode: `HBD-PICKUP-${id}`,
      status: 'unactivated' as const,
      kategori: (num % 3 === 0 ? 'Eksternal' : num % 2 === 0 ? 'Mobile' : 'Internal') as
        | 'Internal'
        | 'Mobile'
        | 'Eksternal',
      claimedMeals: {
        pagi: { claimed: false },
        siang: { claimed: false },
        malam: { claimed: false },
      },
    };
  }),
];
