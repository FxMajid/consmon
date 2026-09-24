export type ActiveDay = 'H' | 'H-1' | 'H-2' | 'H+1' | 'ALL';

export type MealTimeSlot = 'h1_siang' | 'h1_malam' | 'pagi' | 'snack_pagi' | 'siang' | 'snack_siang' | 'minuman' | 'malam';

export interface MenuDetail {
  id: string;
  name: string;
  vendor: string;
  price: number;
  timeSlot: MealTimeSlot;
  timeLabel: string;
  description?: string;
  category: 'makan' | 'snack' | 'minum';
}

export interface HariHGroupDistribution {
  id: string;
  no: number;
  groupName: string;
  picName: string;
  picPhone: string;
  category: 'Internal' | 'Eksternal' | 'Buffer';
  
  // H-1 Siang (11.30 H-1) - Nasi Ladas / Puti Minang
  h1SiangQty?: number;
  h1SiangMenu?: string;
  h1SiangStatus?: 'pending' | 'completed' | 'partial';
  h1SiangPickedAt?: string;
  h1SiangReceiver?: string;
  h1SiangProofPhoto?: string;

  // H-1 Malam (17.30 H-1) - Nasi Padang Puti Minang
  h1MalamQty?: number;
  h1MalamMenu?: string;
  h1MalamStatus?: 'pending' | 'completed' | 'partial';
  h1MalamPickedAt?: string;
  h1MalamReceiver?: string;
  h1MalamProofPhoto?: string;

  // Pagi (06.30) - Uduk Eyang Rita
  pagiQty: number;
  pagiMenu: string;
  pagiStatus: 'pending' | 'completed' | 'partial';
  pagiPickedAt?: string;
  pagiReceiver?: string;
  pagiProofPhoto?: string;
  
  // Snack Pagi (09.30) - Roti Kamura
  snackPagiQty: number;
  snackPagiMenu: string;
  snackPagiStatus: 'pending' | 'completed' | 'partial';
  snackPagiPickedAt?: string;
  snackPagiReceiver?: string;
  snackPagiProofPhoto?: string;

  // Siang (11.30) - Bebek Belur / Nasi Ayam Bu Ani
  siangQty: number;
  siangMenu: string;
  siangStatus: 'pending' | 'completed' | 'partial';
  siangPickedAt?: string;
  siangReceiver?: string;
  siangProofPhoto?: string;

  // Snack Siang/Sore (15.00) - Umurais / Kue Buani
  snackSiangQty: number;
  snackSiangMenu: string;
  snackSiangStatus: 'pending' | 'completed' | 'partial';
  snackSiangPickedAt?: string;
  snackSiangReceiver?: string;
  snackSiangProofPhoto?: string;

  // Minuman (11.30 / 15.00 / All time) - Iso Plus / Mineral
  minumanQty: number;
  minumanMenu: string;
  minumanStatus: 'pending' | 'completed' | 'partial';
  minumanPickedAt?: string;
  minumanReceiver?: string;
  minumanProofPhoto?: string;

  // Malam (17.30) - Ayam Penyet Surabaya / Mbok Jum / Puti Minang
  malamQty: number;
  malamMenu: string;
  malamStatus: 'pending' | 'completed' | 'partial';
  malamPickedAt?: string;
  malamReceiver?: string;
  malamProofPhoto?: string;

  totalAmount: number;
  notes?: string;
  members?: string; // Daftar nama anggota yang makanannya diambil oleh PIC
  proofPhoto?: string; // Foto bukti pengambilan terakhir
}

export interface VoucherDistributionItem {
  id: string;
  day: 'H-2' | 'H-1' | 'H+1';
  groupNo: number;
  groupName: string;
  picName: string;
  picPhone: string;
  mealType: 'Makan Siang' | 'Makan Malam' | 'Minuman';
  qty: number;
  menuVendor: string;
  unitPrice: number;
  totalPrice: number;
  status: 'pending' | 'claimed' | 'cancelled';
  voucherCode?: string;
  claimedAt?: string;
  receiverName?: string;
  notes?: string;
  members?: string; // Daftar nama anggota / penerima porsi
}

export interface IndividualAccessCard {
  no: number;
  name: string;
  picHbd: string;
  employee: string;
  areaKerja: string;
  picPengambil: string;
  kontakWa: string;
  qty: number;
  kategori: 'Internal' | 'Mobile' | 'Eksternal';
  minum: string;
  makan: string;
  siangH2: string;
  kegiatanH2?: string;
  siangH1: string;
  kegiatanSiangH1?: string;
  malamH1: string;
  kegiatanMalamH1?: string;
  pagiH: string;
  siangH: string;
  malamH: string;
  hPlus1?: string;
  kegiatanHPlus1?: string;
}

export interface IDCardKonsumsi {
  id: string; // e.g. "IDC-001"
  cardCode: string; // e.g. "HBD-ID-001"
  activationCode: string; // e.g. "HBD-ACT-IDC-001"
  pickupCode: string; // e.g. "HBD-PICKUP-IDC-001"
  status: 'unactivated' | 'active';
  holderName?: string;
  holderEmail?: string;
  areaKerja?: string;
  activatedAt?: string;
  kategori?: 'Internal' | 'Mobile' | 'Eksternal' | 'Panitia';
  notes?: string;
  claimedMeals?: {
    pagi?: { claimed: boolean; claimedAt?: string };
    snackPagi?: { claimed: boolean; claimedAt?: string };
    siang?: { claimed: boolean; claimedAt?: string };
    snackSiang?: { claimed: boolean; claimedAt?: string };
    malam?: { claimed: boolean; claimedAt?: string };
  };
}

