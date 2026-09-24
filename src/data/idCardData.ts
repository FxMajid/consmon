import { IDCardKonsumsi } from '../types';

// Area Kerja resmi sesuai dataset panitia & lapangan HBD 2026
export const WORK_AREAS = [
  'Babinkamtibnas',
  'Babinsa',
  'Backstage',
  'Booth Games',
  'Choir',
  'Community Bikers',
  'DAMKAR',
  'Dancer',
  'Foto Booth',
  'Funtastic Band',
  'Keamanan Gedung',
  'Keamanan Lokal dan Parkir',
  'Keamanan Polda',
  'Kipas Tua',
  'Konsumsi',
  'Loading Sunar',
  'MC Malam',
  'MC Pagi',
  'Medis',
  'Mobile',
  'Modifikasi',
  'Motoran',
  'Nusa Etnik',
  'OB',
  'Perlengkapan',
  'Registrasi',
  'Riding Test',
  'Second Stage',
  'Security',
  'Service Motor',
  'SMK Binaan',
  'Tim Armada',
  'Trafis',
  'UMKM',
  'UPTD Area',
  'UPTD Kebersihan',
  'Videografer',
  'Volunteer Mahasiswa',
  'WP',
];

// Data ID Card Konsumsi Bersih & Kosong Siap Diaktivasi Mandiri oleh Peserta/Panitia
export const INITIAL_ID_CARDS: IDCardKonsumsi[] = Array.from({ length: 120 }, (_, idx) => {
  const num = idx + 1;
  const pad = String(num).padStart(3, '0');
  const id = `IDC-${pad}`;
  return {
    id,
    cardCode: `HBD-ID-${pad}`,
    activationCode: `HBD-ACT-${id}`,
    pickupCode: `HBD-PICKUP-${id}`,
    status: 'unactivated' as const,
    kategori: (num > 90 ? 'Eksternal' : num > 70 ? 'Mobile' : 'Internal') as
      | 'Internal'
      | 'Mobile'
      | 'Eksternal',
    claimedMeals: {
      pagi: { claimed: false },
      siang: { claimed: false },
      malam: { claimed: false },
    },
  };
});
