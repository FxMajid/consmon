import { IDCardKonsumsi } from '../types';

// Area Kerja resmi sesuai dataset panitia & lapangan HBD 2026
export const WORK_AREAS = [
  'Backstage & LO',
  'Main Stage & Concert',
  'Second Stage & Double Deck',
  'BOOTH GAMES (Zone 3)',
  'FOTO BOOTH (Zone 4)',
  'MODIFIKASI Contest',
  'MOTORAN (Zone 6)',
  'REGISTRASI & System Dev',
  'RIDING TEST (Zone 5)',
  'SERVICE MOTOR (H2 & Kabeng)',
  'UMKM & Sponsorship (Zone 2)',
  'WP (Zone 7)',
  'KONSUMSI',
  'PERLENGKAPAN & Logistik',
  'Community Basecamp',
  'Tenda Medis & Rescue',
  'Pos Pengamanan (TNI & POLRI)',
  'Team Loading Vendor (SNR)',
  'Office Boy (OB Internal)',
  'Mobile Taskforce',
  'All Area Venue',
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
