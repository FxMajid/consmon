import React, { useState, useMemo } from 'react';
import { 
  HariHGroupDistribution, 
  MealTimeSlot,
  IDCardKonsumsi
} from '../types';
import { 
  CheckCircle2, 
  Clock, 
  Search, 
  Filter, 
  MessageSquare, 
  AlertCircle, 
  ChevronRight, 
  Building2, 
  ShieldCheck, 
  Layers,
  Coffee,
  CheckSquare,
  Square,
  Share2,
  Scan,
  QrCode,
  Sparkles,
  Upload,
  Users,
  Camera,
  Eye,
  X,
  Image as ImageIcon
} from 'lucide-react';
import { getBarcodeForSlot, getBarcodeForGroupGeneral } from '../utils/barcodeUtils';

// Explicit keywords and aliases mapping for all 39 Dropdown Area Kerja to Hari H groups
const AREA_TO_GROUP_KEYWORDS: Record<string, string[]> = {
  'babinkamtibnas': ['babinkamtibmas', 'babinkamtibnas', 'polsek', 'polri'],
  'babinsa': ['babinsa', 'tni', 'pkor'],
  'backstage': ['backstage', 'lo', 'show director', 'concert', 'liaison officer'],
  'booth games': ['booth games', 'zone 3'],
  'choir': ['choir', 'paduan suara'],
  'community bikers': ['community bikers', 'paguyuban', 'komunitas'],
  'damkar': ['damkar', 'pemadam kebakaran', 'pemadam'],
  'dancer': ['dancer', 'penari', 'opening closing'],
  'foto booth': ['foto booth', 'foto corner', 'zone 4'],
  'funtastic band': ['funtastic band', 'funtastic'],
  'keamanan gedung': ['keamanan gedung', 'koramil'],
  'keamanan lokal dan parkir': ['parkir', 'keamanan lokal', 'external parkir'],
  'keamanan polda': ['keamanan polda', 'polda lampung', 'polda'],
  'kipas tua': ['kipas tua', 'talent kipas'],
  'konsumsi': ['konsumsi'],
  'loading sunar': ['loading sunar', 'snr', 'loading vendor', 'sunar', 'bongkaran'],
  'mc malam': ['mc malam'],
  'mc pagi': ['mc pagi', 'mc pagi - siang', 'mc pagi siang'],
  'medis': ['medis', 'ambulance', 'team medis'],
  'mobile': ['mobile'],
  'modifikasi': ['modifikasi', 'contest'],
  'motoran': ['motoran', 'zone 6'],
  'nusa etnik': ['nusa etnik'],
  'ob': ['ob', 'office boy'],
  'perlengkapan': ['perlengkapan', 'logistik'],
  'registrasi': ['registrasi', 'system dev'],
  'riding test': ['riding test', 'zone 5'],
  'second stage': ['second stage', 'double deck', 'zone 1'],
  'security': ['security', 'security external'],
  'service motor': ['service motor', 'servis motor', 'kabeng', 'h2'],
  'smk binaan': ['smk', 'smk binaan', 'booth h2'],
  'tim armada': ['armada', 'crew armada', 'bus driver', 'driver'],
  'trafis': ['trafis', 'pijat gratis', 'terapis'],
  'umkm': ['umkm', 'sponsorship', 'zone 2'],
  'uptd area': ['uptd area', 'pengelola pkor', 'uptd'],
  'uptd kebersihan': ['uptd kebersihan', 'kebersihan pkor'],
  'videografer': ['videografer', 'video & foto grafer', 'video foto grafer', 'video', 'grafer'],
  'volunteer mahasiswa': ['volunteer mahasiswa', 'volunteer', 'mahasiswa'],
  'wp': ['wp', 'zone 7 wp', 'zone 7'],
};

/**
 * Checks if a Hari H group/division has been activated by any registered ID Card in "ID Card & Aktivasi QR"
 */
export function isGroupActivatedByIdCards(
  group: HariHGroupDistribution,
  idCards?: IDCardKonsumsi[]
): { 
  isActivated: boolean; 
  matchedCard?: IDCardKonsumsi;
  matchedCards: IDCardKonsumsi[];
  cardCount: number;
} {
  if (!idCards || idCards.length === 0) {
    return { isActivated: false, matchedCards: [], cardCount: 0 };
  }

  const activeCards = idCards.filter((c) => c.status === 'active');
  if (activeCards.length === 0) {
    return { isActivated: false, matchedCards: [], cardCount: 0 };
  }

  const clean = (str: string) =>
    (str || '')
      .toLowerCase()
      .replace(/panitia\s*md\s*[-–:]*/gi, '')
      .replace(/divisi\s*/gi, '')
      .replace(/[^\w\s]/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  const groupClean = clean(group.groupName);
  const picClean = clean(group.picName);
  const membersClean = clean(group.members || group.notes || '');
  const allGroupText = `${groupClean} ${picClean} ${membersClean}`;

  const matchedCards: IDCardKonsumsi[] = [];

  for (const card of activeCards) {
    const holderClean = clean(card.holderName || '');
    const areaClean = clean(card.areaKerja || '');
    let isMatch = false;

    // 1. Match by holder name in group picName, members list, or notes
    if (holderClean && holderClean.length >= 3) {
      if (picClean.includes(holderClean) || holderClean.includes(picClean)) {
        isMatch = true;
      } else if (membersClean.includes(holderClean)) {
        isMatch = true;
      } else {
        const words = holderClean.split(' ').filter((w) => w.length >= 4);
        for (const w of words) {
          if (membersClean.includes(w) || picClean.includes(w)) {
            isMatch = true;
            break;
          }
        }
      }
    }

    // 2. Match by area kerja aliases & keywords
    if (!isMatch && areaClean) {
      // Check explicit alias mapping
      const aliases = AREA_TO_GROUP_KEYWORDS[areaClean] || [areaClean];
      for (const alias of aliases) {
        if (alias.length <= 3) {
          const regex = new RegExp(`\\b${alias}\\b`, 'i');
          if (regex.test(allGroupText)) {
            isMatch = true;
            break;
          }
        } else if (allGroupText.includes(alias) || alias.includes(groupClean)) {
          isMatch = true;
          break;
        }
      }

      // Fallback check keyword parts of area kerja
      if (!isMatch) {
        const areaKeywords = areaClean
          .split(' ')
          .filter((w) => w.length >= 3 && !['zone', 'area', 'venue', 'team', 'tenda', 'pos', 'dan'].includes(w));
        for (const kw of areaKeywords) {
          if (groupClean.includes(kw) || membersClean.includes(kw) || picClean.includes(kw)) {
            isMatch = true;
            break;
          }
        }
      }
    }

    if (isMatch) {
      matchedCards.push(card);
    }
  }

  return {
    isActivated: matchedCards.length > 0,
    matchedCard: matchedCards[0],
    matchedCards,
    cardCount: matchedCards.length,
  };
}

interface HariHMonitorProps {
  groups: HariHGroupDistribution[];
  idCards?: IDCardKonsumsi[];
  onToggleStatus: (groupId: string, slot: MealTimeSlot, currentStatus: string) => void;
  onBatchCompleteSlot: (slot: MealTimeSlot) => void;
  onOpenScanner: () => void;
  onOpenImport?: (category?: 'id_cards' | 'hari_h' | 'vouchers') => void;
  onOpenBarcodeCard: (data: {
    groupName: string;
    picName: string;
    picPhone: string;
    slotLabel: string;
    menu: string;
    qty: number;
    barcodeCode: string;
    status: string;
    category?: string;
  }) => void;
}

export const HariHMonitor: React.FC<HariHMonitorProps> = ({
  groups,
  idCards,
  onToggleStatus,
  onBatchCompleteSlot,
  onOpenScanner,
  onOpenImport,
  onOpenBarcodeCard
}) => {
  const [selectedSlot, setSelectedSlot] = useState<MealTimeSlot | 'all'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('hbd_hari_h_selected_slot');
      if (saved && ['all', 'pagi', 'snack_pagi', 'siang', 'snack_siang', 'minuman', 'malam'].includes(saved)) {
        return saved as any;
      }
    }
    return 'siang';
  });

  const handleSelectSlot = (slot: MealTimeSlot | 'all') => {
    setSelectedSlot(slot);
    setSelectedMenuFilter('all');
    localStorage.setItem('hbd_hari_h_selected_slot', slot);
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'Internal' | 'Eksternal' | 'Buffer'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [selectedMenuFilter, setSelectedMenuFilter] = useState<string>('all');
  const [viewingPhoto, setViewingPhoto] = useState<{ url: string; title: string; subtitle: string } | null>(null);

  // Slot definitions with details
  const TIME_SLOTS = [
    {
      key: 'all' as const,
      label: 'Semua Sesi',
      time: 'H-1 & Hari H Lengkap',
      badge: 'Overview',
      color: 'bg-slate-800 text-white',
    },
    {
      key: 'h1_siang' as const,
      label: 'H-1 Siang',
      time: '11.30 WIB (H-1)',
      menuPrimary: 'Nasi Ladas / Puti Minang',
      totalTarget: 100,
      badge: 'Non-Voucher',
      color: 'bg-amber-600 text-white',
      isActivatedSlot: true,
    },
    {
      key: 'h1_malam' as const,
      label: 'H-1 Malam',
      time: '17.30 WIB (H-1)',
      menuPrimary: 'Nasi Padang Puti Minang',
      totalTarget: 140,
      badge: 'Non-Voucher',
      color: 'bg-amber-700 text-white',
      isActivatedSlot: true,
    },
    {
      key: 'pagi' as const,
      label: 'Sarapan Pagi',
      time: '06.30 WIB',
      menuPrimary: 'Uduk eyang Rita (Rp 12.000)',
      totalTarget: 178,
      badge: '178 Porsi',
      color: 'bg-orange-600 text-white',
      isActivatedSlot: true,
    },
    {
      key: 'snack_pagi' as const,
      label: 'Snack Pagi',
      time: '09.30 WIB',
      menuPrimary: 'Roti Kamura (Rp 11.000)',
      totalTarget: 178,
      badge: '178 Porsi',
      color: 'bg-amber-500 text-white',
      isActivatedSlot: true,
    },
    {
      key: 'siang' as const,
      label: 'Makan Siang',
      time: '11.30 WIB',
      menuPrimary: 'Bebek Belur (105) & Ayam Bu Ani (254)',
      totalTarget: 359,
      badge: '359 Porsi',
      color: 'bg-rose-600 text-white',
      isActivatedSlot: true,
    },
    {
      key: 'snack_siang' as const,
      label: 'Snack Sore',
      time: '15.00 WIB',
      menuPrimary: 'Umurais (105) & Kue Bu Ani (50)',
      totalTarget: 155,
      badge: '155 Porsi',
      color: 'bg-purple-600 text-white',
      isActivatedSlot: true,
    },
    {
      key: 'minuman' as const,
      label: 'Minuman & Iso',
      time: '11.30 / 15.00',
      menuPrimary: 'Iso Plus (224) & Air Mineral/Galon',
      totalTarget: 224,
      badge: '224+ Btl',
      color: 'bg-blue-600 text-white',
      isActivatedSlot: true,
    },
    {
      key: 'malam' as const,
      label: 'Makan Malam',
      time: '17.30 WIB',
      menuPrimary: 'Ayam Penyet Surabaya (97) & Mbok Jum (367)',
      totalTarget: 464,
      badge: '464 Porsi',
      color: 'bg-emerald-700 text-white',
      isActivatedSlot: true,
    },
  ];

  // Helper to extract slot info for a group
  const getSlotInfo = (group: HariHGroupDistribution, slot: MealTimeSlot) => {
    switch (slot) {
      case 'h1_siang': {
        const fallbackQty = group.no <= 14 ? (group.siangQty || 2) : group.no === 64 ? 5 : 0;
        return {
          qty: group.h1SiangQty !== undefined && group.h1SiangQty !== null && group.h1SiangQty > 0 ? group.h1SiangQty : fallbackQty,
          menu: group.h1SiangMenu || 'Nasi Ladas / Puti Minang',
          status: group.h1SiangStatus || 'pending',
          pickedAt: group.h1SiangPickedAt,
          receiver: group.h1SiangReceiver,
          proofPhoto: group.h1SiangProofPhoto,
        };
      }
      case 'h1_malam': {
        const fallbackQty = group.no <= 14 ? (group.malamQty || 2) : group.no === 64 ? 10 : 0;
        return {
          qty: group.h1MalamQty !== undefined && group.h1MalamQty !== null && group.h1MalamQty > 0 ? group.h1MalamQty : fallbackQty,
          menu: group.h1MalamMenu || 'Nasi Padang Puti Minang',
          status: group.h1MalamStatus || 'pending',
          pickedAt: group.h1MalamPickedAt,
          receiver: group.h1MalamReceiver,
          proofPhoto: group.h1MalamProofPhoto,
        };
      }
      case 'pagi':
        return {
          qty: group.pagiQty,
          menu: group.pagiMenu,
          status: group.pagiStatus,
          pickedAt: group.pagiPickedAt,
          receiver: group.pagiReceiver,
          proofPhoto: group.pagiProofPhoto || group.proofPhoto,
        };
      case 'snack_pagi':
        return {
          qty: group.snackPagiQty,
          menu: group.snackPagiMenu,
          status: group.snackPagiStatus,
          pickedAt: group.snackPagiPickedAt,
          receiver: group.snackPagiReceiver,
          proofPhoto: group.snackPagiProofPhoto,
        };
      case 'siang':
        return {
          qty: group.siangQty,
          menu: group.siangMenu,
          status: group.siangStatus,
          pickedAt: group.siangPickedAt,
          receiver: group.siangReceiver,
          proofPhoto: group.siangProofPhoto || group.proofPhoto,
        };
      case 'snack_siang':
        return {
          qty: group.snackSiangQty,
          menu: group.snackSiangMenu,
          status: group.snackSiangStatus,
          pickedAt: group.snackSiangPickedAt,
          receiver: group.snackSiangReceiver,
          proofPhoto: group.snackSiangProofPhoto,
        };
      case 'minuman':
        return {
          qty: group.minumanQty,
          menu: group.minumanMenu,
          status: group.minumanStatus,
          pickedAt: group.minumanPickedAt,
          receiver: group.minumanReceiver,
          proofPhoto: group.minumanProofPhoto,
        };
      case 'malam':
        return {
          qty: group.malamQty,
          menu: group.malamMenu,
          status: group.malamStatus,
          pickedAt: group.malamPickedAt,
          receiver: group.malamReceiver,
          proofPhoto: group.malamProofPhoto || group.proofPhoto,
        };
    }
  };

  // Filtered groups
  const filteredGroups = useMemo(() => {
    return groups.filter((grp) => {
      // Search query
      const matchSearch =
        grp.groupName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        grp.picName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        grp.picPhone.includes(searchQuery) ||
        grp.members?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        grp.notes?.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchSearch) return false;

      // Category filter
      if (categoryFilter !== 'all' && grp.category !== categoryFilter) {
        return false;
      }

      // Slot-specific filter
      if (selectedSlot !== 'all') {
        const info = getSlotInfo(grp, selectedSlot);
        // Only show groups that have allocation > 0 for this slot
        if (info.qty <= 0) return false;

        // Status filter
        if (statusFilter !== 'all' && info.status !== statusFilter) {
          return false;
        }

        // Menu filter
        if (selectedMenuFilter !== 'all') {
          if (!info.menu.toLowerCase().includes(selectedMenuFilter.toLowerCase())) {
            return false;
          }
        }
      }

      return true;
    });
  }, [groups, searchQuery, categoryFilter, selectedSlot, statusFilter, selectedMenuFilter]);

  // Calculations for current slot
  const slotStats = useMemo(() => {
    if (selectedSlot === 'all') {
      let totalPorsi = 0;
      let totalDiambil = 0;
      groups.forEach((g) => {
        const slots: MealTimeSlot[] = ['h1_siang', 'h1_malam', 'pagi', 'snack_pagi', 'siang', 'snack_siang', 'minuman', 'malam'];
        slots.forEach((s) => {
          const info = getSlotInfo(g, s);
          totalPorsi += info.qty;
          if (info.status === 'completed') {
            totalDiambil += info.qty;
          }
        });
      });
      return {
        total: totalPorsi,
        diambil: totalDiambil,
        sisa: totalPorsi - totalDiambil,
        pct: totalPorsi > 0 ? Math.round((totalDiambil / totalPorsi) * 100) : 0,
      };
    } else {
      let total = 0;
      let diambil = 0;
      groups.forEach((g) => {
        const info = getSlotInfo(g, selectedSlot);
        total += info.qty;
        if (info.status === 'completed') {
          diambil += info.qty;
        }
      });
      return {
        total,
        diambil,
        sisa: total - diambil,
        pct: total > 0 ? Math.round((diambil / total) * 100) : 0,
      };
    }
  }, [groups, selectedSlot]);

  // Helper to count activated groups (divisi) for a slot
  const getActivatedCountForSlot = (slotKey: MealTimeSlot | 'all') => {
    if (!idCards || idCards.length === 0) return 0;
    return groups.filter((g) => {
      const act = isGroupActivatedByIdCards(g, idCards);
      if (!act.isActivated) return false;
      if (slotKey === 'all') return true;
      const slotInfo = getSlotInfo(g, slotKey);
      return slotInfo.qty > 0;
    }).length;
  };

  // Helper to count activated ID cards for a slot
  const getActivatedCardsCountForSlot = (slotKey: MealTimeSlot | 'all') => {
    if (!idCards || idCards.length === 0) return 0;
    const activeCards = idCards.filter((c) => c.status === 'active');
    if (activeCards.length === 0) return 0;
    if (slotKey === 'all') return activeCards.length;

    let count = 0;
    for (const card of activeCards) {
      const hasSlot = groups.some((g) => {
        const act = isGroupActivatedByIdCards(g, [card]);
        if (!act.isActivated) return false;
        const slotInfo = getSlotInfo(g, slotKey);
        return slotInfo.qty > 0;
      });
      if (hasSlot) count++;
    }
    return count;
  };

  // Breakdown by menu for the selected slot
  const menuBreakdown = useMemo(() => {
    if (selectedSlot === 'all') return [];
    const breakdownMap: Record<string, { total: number; taken: number; groupsCount: number }> = {};

    groups.forEach((g) => {
      const info = getSlotInfo(g, selectedSlot);
      if (info.qty > 0) {
        const menuKey = info.menu;
        if (!breakdownMap[menuKey]) {
          breakdownMap[menuKey] = { total: 0, taken: 0, groupsCount: 0 };
        }
        breakdownMap[menuKey].total += info.qty;
        if (info.status === 'completed') {
          breakdownMap[menuKey].taken += info.qty;
        }
        breakdownMap[menuKey].groupsCount += 1;
      }
    });

    return Object.entries(breakdownMap).map(([menu, data]) => ({
      menu,
      ...data,
      pct: data.total > 0 ? Math.round((data.taken / data.total) * 100) : 0,
    }));
  }, [groups, selectedSlot]);

  // WhatsApp click to reminder
  const sendWhatsAppReminder = (group: HariHGroupDistribution, slot: MealTimeSlot) => {
    const info = getSlotInfo(group, slot);
    const cleanPhone = group.picPhone.startsWith('0') 
      ? '62' + group.picPhone.slice(1) 
      : group.picPhone.startsWith('8') 
      ? '62' + group.picPhone 
      : group.picPhone;

    const timeLabel = 
      slot === 'pagi' ? 'Sarapan Pagi (06.30)' :
      slot === 'snack_pagi' ? 'Snack Pagi (09.30)' :
      slot === 'siang' ? 'Makan Siang (11.30)' :
      slot === 'snack_siang' ? 'Snack Sore (15.00)' :
      slot === 'minuman' ? 'Minuman Isotonik & Air' : 'Makan Malam (17.30)';

    const message = encodeURIComponent(
      `Halo Kak/Bpk/Ibu *${group.picName}* (${group.groupName}),\n\n` +
      `Pemberitahuan dari *Divisi Konsumsi HBD*:\n` +
      `Jatah konsumsi sesi *${timeLabel}*:\n` +
      `- Menu: *${info.menu}*\n` +
      `- Jumlah: *${info.qty} Porsi*\n` +
      `- Lokasi Pengambilan: Pos Utama Konsumsi Panitia HBD\n\n` +
      `Mohon segera diambil oleh PIC atau perwakilan yang ditunjuk. Terima kasih banyak!`
    );

    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
  };

  return (
    <div className="space-y-6" id="hari-h-monitor-section">
      {/* Top Banner & Context Note */}
      <div className="bg-gradient-to-r from-red-700 via-red-600 to-rose-600 rounded-2xl p-5 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 rounded bg-white/20 text-white text-xs font-semibold uppercase tracking-wide">
              Fokus Utama Hari H
            </span>
            <span className="text-red-100 text-xs">Distribusi Menu Terjadwal</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black mt-1 tracking-tight">
            Monitoring Pengambilan Konsumsi Hari H
          </h2>
          <p className="text-xs sm:text-sm text-red-100 mt-1 max-w-2xl">
            Distribusi langsung berbasis jadwal menu waktu (Sarapan 06.30, Snack 09.30, Siang 11.30, Snack 15.00, Malam 17.30). Pastikan setiap PIC mengambil tepat waktu.
          </p>
        </div>

        {/* Global summary stats */}
        <div className="bg-white/10 backdrop-blur-xs rounded-xl p-3 sm:px-4 border border-white/20 flex items-center space-x-4 min-w-[200px]">
          <div>
            <div className="text-[11px] text-red-100 font-medium">Total Porsi Sesi Ini</div>
            <div className="text-2xl font-black text-white">{slotStats.total}</div>
          </div>
          <div className="h-9 w-px bg-white/20"></div>
          <div>
            <div className="text-[11px] text-emerald-200 font-medium">Sudah Diambil</div>
            <div className="text-2xl font-black text-emerald-300">{slotStats.diambil}</div>
          </div>
          <div className="h-9 w-px bg-white/20"></div>
          <div>
            <div className="text-[11px] text-red-200 font-medium">Sisa</div>
            <div className="text-2xl font-black text-amber-200">{slotStats.sisa}</div>
          </div>
        </div>
      </div>

      {/* Dual Pickup Options Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 rounded-lg bg-red-100 text-red-700 flex items-center justify-center shrink-0 mt-0.5">
            <Scan className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-bold text-slate-900">
                Tersedia 2 Metode Pengambilan Konsumsi:
              </h3>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                Fleksibel
              </span>
            </div>
            <p className="text-slate-500 text-[11px] mt-0.5">
              <strong>Opsi 1:</strong> Petugas pos klik tombol <em>&quot;Tandai Selesai&quot;</em> secara manual pada baris kelompok. &bull;{' '}
              <strong>Opsi 2:</strong> Scan Barcode / QR kupon panitia atau layar ponsel menggunakan kamera / scanner USB.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          {onOpenImport && (
            <button
              onClick={() => onOpenImport('hari_h')}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold shadow-2xs transition-all text-xs"
              title="Import Data Distribusi Hari H (CSV/Excel) ke Database Supabase"
            >
              <Upload className="w-4 h-4 text-indigo-600" />
              <span>Import Data Hari H</span>
            </button>
          )}

          <button
            onClick={onOpenScanner}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold shadow-xs transition-all text-xs"
          >
            <Scan className="w-4 h-4" />
            <span>Scan Barcode Konsumsi</span>
          </button>
        </div>
      </div>

      {/* Time Slot Tabs */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-1.5">
            <Clock className="w-3.5 h-3.5 text-red-600" />
            <span>Pilih Sesi Waktu &amp; Menu:</span>
          </label>
          <span className="text-xs text-slate-500 font-medium">
            Klik sesi untuk filter rincian menu
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {TIME_SLOTS.map((slot) => {
            const isSelected = selectedSlot === slot.key;
            const isActSlot = (slot as any).isActivatedSlot;
            const actDivCount = isActSlot ? getActivatedCountForSlot(slot.key as any) : 0;
            const actCardsCount = isActSlot ? getActivatedCardsCountForSlot(slot.key as any) : 0;
            const displayCount = actCardsCount > 0 ? actCardsCount : actDivCount;

            return (
              <button
                key={slot.key}
                onClick={() => handleSelectSlot(slot.key)}
                className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden ${
                  isSelected
                    ? 'border-red-600 bg-red-50 ring-2 ring-red-500/20 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between gap-1 flex-wrap">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    isSelected ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {slot.time}
                  </span>
                  {isActSlot ? (
                    displayCount > 0 ? (
                      <span 
                        className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300/80"
                        title={`${actCardsCount} ID Card Aktif (${actDivCount} Divisi Terdaftar)`}
                      >
                        ✓ {displayCount} Aktif
                      </span>
                    ) : (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                        ID Card
                      </span>
                    )
                  ) : (
                    slot.key !== 'all' && (
                      <span className="text-[10px] text-slate-400 font-mono">
                        {slot.badge}
                      </span>
                    )
                  )}
                </div>
                <div className={`mt-2 font-bold text-xs ${isSelected ? 'text-red-900' : 'text-slate-800'}`}>
                  {slot.label}
                </div>
                {slot.key !== 'all' && (
                  <div className="text-[11px] text-slate-500 truncate mt-0.5" title={slot.menuPrimary}>
                    {slot.menuPrimary}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sesi Detail & Menu Breakdown Chips (when a specific slot is selected) */}
      {selectedSlot !== 'all' && menuBreakdown.length > 0 && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
            <div className="flex items-center flex-wrap gap-2">
              <span className="w-2 h-2 rounded-full bg-red-600"></span>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                Rincian Menu &amp; Porsi Pada Sesi Ini:
              </h3>
              {(() => {
                const divCount = getActivatedCountForSlot(selectedSlot);
                const cardCount = getActivatedCardsCountForSlot(selectedSlot);
                if (cardCount === 0 && divCount === 0) return null;
                return (
                  <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-[11px] font-bold shadow-2xs">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>
                      {cardCount} ID Card Aktif {divCount > 0 ? `(${divCount} Divisi)` : ''}
                    </span>
                  </span>
                );
              })()}
            </div>
            <div className="text-xs text-slate-600 font-medium">
              Progress Sesi: <span className="font-bold text-slate-900">{slotStats.diambil}</span> dari <span className="font-bold text-slate-900">{slotStats.total}</span> porsi ({slotStats.pct}%)
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {menuBreakdown.map((item) => {
              const isMenuFilterActive = selectedMenuFilter === item.menu;
              return (
                <div
                  key={item.menu}
                  onClick={() => setSelectedMenuFilter(isMenuFilterActive ? 'all' : item.menu)}
                  className={`cursor-pointer rounded-lg p-3 border transition-all ${
                    isMenuFilterActive
                      ? 'bg-white border-red-500 shadow-xs ring-1 ring-red-400'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-900">{item.menu}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {item.groupsCount} kelompok penerima
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      item.pct === 100 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {item.taken}/{item.total} porsi
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2.5 overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 ${
                        item.pct === 100 ? 'bg-emerald-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${item.pct}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-slate-500 mt-1">
                    <span>{item.pct}% Diambil</span>
                    <span>Sisa: {item.total - item.taken}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {selectedMenuFilter !== 'all' && (
            <div className="mt-2.5 flex items-center space-x-2 text-xs">
              <span className="text-slate-500">Filter menu aktif:</span>
              <span className="font-semibold text-red-700 bg-red-100 px-2 py-0.5 rounded">
                {selectedMenuFilter}
              </span>
              <button
                onClick={() => setSelectedMenuFilter('all')}
                className="text-xs text-slate-500 hover:text-slate-800 underline"
              >
                Reset Filter Menu
              </button>
            </div>
          )}
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama divisi, kelompok, PIC pengambil, atau no WA..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-slate-50/50"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Category Filter */}
            <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg text-xs">
              <button
                onClick={() => setCategoryFilter('all')}
                className={`px-2.5 py-1 rounded font-medium transition-colors ${
                  categoryFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Semua
              </button>
              <button
                onClick={() => setCategoryFilter('Internal')}
                className={`px-2.5 py-1 rounded font-medium transition-colors ${
                  categoryFilter === 'Internal' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Internal MD
              </button>
              <button
                onClick={() => setCategoryFilter('Eksternal')}
                className={`px-2.5 py-1 rounded font-medium transition-colors ${
                  categoryFilter === 'Eksternal' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Eksternal
              </button>
              <button
                onClick={() => setCategoryFilter('Buffer')}
                className={`px-2.5 py-1 rounded font-medium transition-colors ${
                  categoryFilter === 'Buffer' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Buffer
              </button>
            </div>

            {/* Status Filter (if specific slot is chosen) */}
            {selectedSlot !== 'all' && (
              <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg text-xs">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-2 py-1 rounded font-medium ${
                    statusFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Semua
                </button>
                <button
                  onClick={() => setStatusFilter('pending')}
                  className={`px-2 py-1 rounded font-medium ${
                    statusFilter === 'pending' ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Belum Diambil
                </button>
                <button
                  onClick={() => setStatusFilter('completed')}
                  className={`px-2 py-1 rounded font-medium ${
                    statusFilter === 'completed' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Sudah Selesai
                </button>
              </div>
            )}

            {/* Quick Scanner & Batch Complete Buttons */}
            {selectedSlot !== 'all' && (
              <>
                <button
                  onClick={onOpenScanner}
                  className="inline-flex items-center space-x-1 px-3 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-2xs transition-colors"
                  title="Buka scanner kamera / USB gun"
                >
                  <Scan className="w-3.5 h-3.5" />
                  <span>Scan Barcode</span>
                </button>

                <button
                  onClick={() => {
                    if (window.confirm(`Tandai semua kelompok yang tersisa pada sesi ${selectedSlot} sebagai 'Sudah Diambil'?`)) {
                      onBatchCompleteSlot(selectedSlot);
                    }
                  }}
                  className="inline-flex items-center space-x-1 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 rounded-lg border border-slate-200 transition-colors"
                  title="Tandai seluruh sesi ini selesai"
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Ambil Semua</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main List of Groups for Hari H */}
      <div className="space-y-3" id="hari-h-distribution-list">
        {filteredGroups.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500">
            <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="font-semibold text-slate-700">Tidak ada data distribusi yang cocok</p>
            <p className="text-xs text-slate-400 mt-1">Coba sesuaikan pencarian atau filter sesi waktu.</p>
          </div>
        ) : (
          filteredGroups.map((group) => {
            // If specific slot selected, render single slot view
            if (selectedSlot !== 'all') {
              const slotData = getSlotInfo(group, selectedSlot);
              const isTaken = slotData.status === 'completed';

              return (
                <div
                  key={group.id}
                  className={`bg-white rounded-xl border transition-all p-4 shadow-2xs ${
                    isTaken 
                      ? 'border-emerald-200 bg-emerald-50/20' 
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Left: Group & PIC Info */}
                    <div className="flex items-start space-x-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                        isTaken ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {group.no}
                      </div>

                      <div>
                        <div className="flex items-center flex-wrap gap-2">
                          <h4 className="font-bold text-sm text-slate-900">
                            {group.groupName}
                          </h4>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            group.category === 'Internal' 
                              ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                              : group.category === 'Buffer'
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : 'bg-teal-50 text-teal-700 border border-teal-200'
                          }`}>
                            {group.category}
                          </span>
                          {(() => {
                            const act = isGroupActivatedByIdCards(group, idCards);
                            if (!act.isActivated) return null;
                            const cardInfo = act.matchedCards.map((c) => `${c.holderName || 'Panitia'} (${c.id})`).join(', ');
                            return (
                              <span 
                                className="inline-flex items-center space-x-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full shadow-2xs"
                                title={`ID Card Aktif: ${cardInfo}`}
                              >
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>Sudah Aktivasi{act.cardCount > 1 ? ` (${act.cardCount} Kartu)` : ''}</span>
                              </span>
                            );
                          })()}
                          {isTaken ? (
                            <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Sudah Diambil</span>
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                              Belum Diambil
                            </span>
                          )}
                        </div>

                        {/* PIC & WA info */}
                        <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                          <span>
                            PIC Pengambil: <strong className="text-slate-800 font-semibold">{group.picName}</strong>
                          </span>
                          {group.picPhone && (
                            <span className="font-mono text-[11px] text-slate-600">
                              WA: {group.picPhone}
                            </span>
                          )}
                        </div>

                        {/* Chips for activated ID cards under this group */}
                        {(() => {
                          const act = isGroupActivatedByIdCards(group, idCards);
                          if (!act.isActivated || act.matchedCards.length === 0) return null;
                          return (
                            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                              <span className="text-[10px] font-bold text-emerald-800 flex items-center gap-1">
                                <Sparkles className="w-3 h-3 text-emerald-600" />
                                Pemegang ID Card Aktif:
                              </span>
                              {act.matchedCards.map((c) => (
                                <span
                                  key={c.id}
                                  className="inline-flex items-center space-x-1 text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 rounded shadow-2xs"
                                  title={`ID: ${c.id} | Area: ${c.areaKerja || '-'} | Waktu Aktivasi: ${c.activatedAt || '-'}`}
                                >
                                  <span className="font-mono font-bold text-emerald-700">{c.id}</span>
                                  <span>&bull;</span>
                                  <span>{c.holderName || 'Panitia'}</span>
                                </span>
                              ))}
                            </div>
                          );
                        })()}

                        {/* Anggota Makan yang diambil oleh PIC */}
                        {(group.members || (group.notes && group.notes.toLowerCase().includes('anggota'))) && (
                          <div className="mt-1.5 flex items-start space-x-1.5 bg-blue-50/70 border border-blue-200/80 rounded-lg px-2.5 py-1 text-[11px] text-blue-900 max-w-xl">
                            <Users className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-bold text-blue-800">Anggota Makan Diambil PIC: </span>
                              <span className="font-medium">
                                {group.members || group.notes?.replace(/^Anggota:\s*/i, '')}
                              </span>
                            </div>
                          </div>
                        )}

                        {group.notes && !group.notes.toLowerCase().startsWith('anggota:') && (
                          <div className="text-[11px] text-slate-400 mt-1 italic">
                            Catatan: {group.notes}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Middle: Menu & Quantity Badge */}
                    <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-200/80 sm:min-w-[240px]">
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                        Jatah Menu Sesi Ini:
                      </div>
                      <div className="flex items-baseline justify-between mt-0.5">
                        <span className="text-xs font-bold text-slate-800">
                          {slotData.menu}
                        </span>
                        <span className="text-sm font-black text-red-600 ml-2">
                          {slotData.qty} Porsi
                        </span>
                      </div>
                      {slotData.pickedAt && (
                        <div className="text-[10px] text-emerald-700 font-medium mt-1 flex items-center justify-between gap-1">
                          <span>Diambil jam: {slotData.pickedAt} {slotData.receiver ? `(${slotData.receiver})` : ''}</span>
                        </div>
                      )}
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center space-x-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      {/* Bukti Foto Button (if exists) */}
                      {slotData.proofPhoto && (
                        <button
                          onClick={() =>
                            setViewingPhoto({
                              url: slotData.proofPhoto!,
                              title: `${group.groupName} - Sesi ${slotData.menu}`,
                              subtitle: `Diambil oleh ${slotData.receiver || group.picName} pada ${slotData.pickedAt || 'Hari H'}`,
                            })
                          }
                          title="Lihat Bukti Foto Pengambilan"
                          className="inline-flex items-center space-x-1 px-2.5 py-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold border border-emerald-300 transition-colors shadow-2xs"
                        >
                          <Camera className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="hidden sm:inline">Bukti Foto</span>
                        </button>
                      )}

                      {/* Kupon / Barcode Card Button */}
                      <button
                        onClick={() =>
                          onOpenBarcodeCard({
                            groupName: group.groupName,
                            picName: group.picName,
                            picPhone: group.picPhone,
                            slotLabel: `${TIME_SLOTS.find((t) => t.key === selectedSlot)?.time} (${TIME_SLOTS.find((t) => t.key === selectedSlot)?.label})`,
                            menu: slotData.menu,
                            qty: slotData.qty,
                            barcodeCode: getBarcodeForSlot(group.no, selectedSlot),
                            status: slotData.status,
                            category: group.category,
                          })
                        }
                        title="Tampilkan Kupon Barcode & QR Code untuk dicetak / scan"
                        className="inline-flex items-center space-x-1 px-2.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors"
                      >
                        <QrCode className="w-3.5 h-3.5 text-slate-600" />
                        <span className="hidden sm:inline">Kupon Barcode</span>
                      </button>

                      {/* WhatsApp Reminder Button */}
                      {!isTaken && group.picPhone && (
                        <button
                          onClick={() => sendWhatsAppReminder(group, selectedSlot)}
                          title="Kirim pengingat WhatsApp ke PIC"
                          className="inline-flex items-center space-x-1 px-2.5 py-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold border border-emerald-200 transition-colors"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">WA PIC</span>
                        </button>
                      )}

                      {/* Toggle Status Button (Opsi 1: Manual Checklist) */}
                      <button
                        onClick={() => onToggleStatus(group.id, selectedSlot, slotData.status)}
                        className={`inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all shadow-2xs ${
                          isTaken
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            : 'bg-red-600 hover:bg-red-700 text-white'
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{isTaken ? 'Batal' : 'Tandai Selesai'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            }

            // Overview mode ('all'): render complete schedule for this group across all slots
            return (
              <div
                key={group.id}
                className="bg-white rounded-xl border border-slate-200 p-4 hover:border-slate-300 transition-all shadow-2xs"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center space-x-3">
                    <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-800 font-bold text-xs flex items-center justify-center">
                      {group.no}
                    </span>
                    <div>
                      <div className="flex items-center flex-wrap gap-2">
                        <h4 className="font-bold text-sm text-slate-900">{group.groupName}</h4>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          group.category === 'Internal' 
                            ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                            : group.category === 'Buffer'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : 'bg-teal-50 text-teal-700 border border-teal-200'
                        }`}>
                          {group.category}
                        </span>
                        {(() => {
                          const act = isGroupActivatedByIdCards(group, idCards);
                          if (!act.isActivated) return null;
                          const cardInfo = act.matchedCards.map((c) => `${c.holderName || 'Panitia'} (${c.id})`).join(', ');
                          return (
                            <span 
                              className="inline-flex items-center space-x-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full shadow-2xs"
                              title={`ID Card Aktif: ${cardInfo}`}
                            >
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Sudah Aktivasi{act.cardCount > 1 ? ` (${act.cardCount} Kartu)` : ''}</span>
                            </span>
                          );
                        })()}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        PIC: <strong className="text-slate-800">{group.picName}</strong>
                        {group.picPhone && <span className="ml-2 font-mono">WA: {group.picPhone}</span>}
                      </div>

                      {/* Chips for activated ID cards under this group */}
                      {(() => {
                        const act = isGroupActivatedByIdCards(group, idCards);
                        if (!act.isActivated || act.matchedCards.length === 0) return null;
                        return (
                          <div className="mt-1 flex flex-wrap items-center gap-1.5">
                            <span className="text-[10px] font-bold text-emerald-800 flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-emerald-600" />
                              Pemegang ID Card Aktif:
                            </span>
                            {act.matchedCards.map((c) => (
                              <span
                                key={c.id}
                                className="inline-flex items-center space-x-1 text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 rounded shadow-2xs"
                                title={`ID: ${c.id} | Area: ${c.areaKerja || '-'} | Waktu Aktivasi: ${c.activatedAt || '-'}`}
                              >
                                <span className="font-mono font-bold text-emerald-700">{c.id}</span>
                                <span>&bull;</span>
                                <span>{c.holderName || 'Panitia'}</span>
                              </span>
                            ))}
                          </div>
                        );
                      })()}

                      {/* Anggota Makan yang diambil oleh PIC */}
                      {(group.members || (group.notes && group.notes.toLowerCase().includes('anggota'))) && (
                        <div className="mt-1 flex items-start space-x-1.5 bg-blue-50/70 border border-blue-200/80 rounded-lg px-2.5 py-0.5 text-[11px] text-blue-900 max-w-xl">
                          <Users className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold text-blue-800">Anggota Makan Diambil PIC: </span>
                            <span className="font-medium">
                              {group.members || group.notes?.replace(/^Anggota:\s*/i, '')}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-[11px] text-slate-400">Total Nilai Konsumsi:</div>
                    <div className="text-xs font-bold text-slate-800">
                      Rp {group.totalAmount.toLocaleString('id-ID')}
                    </div>
                  </div>
                </div>

                {/* Slots Matrix for this group */}
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 mt-3 text-xs">
                  {/* H-1 Siang */}
                  <div className={`p-2.5 rounded-lg border ${
                    (group.h1SiangQty || 0) === 0 
                      ? 'bg-slate-50/50 border-slate-100 text-slate-400' 
                      : group.h1SiangStatus === 'completed'
                      ? 'bg-emerald-50/60 border-emerald-200'
                      : 'bg-amber-50/40 border-amber-200/80'
                  }`}>
                    <div className="text-[10px] font-bold text-amber-800 uppercase flex justify-between">
                      <span>H-1 Siang</span>
                      {(group.h1SiangQty || 0) > 0 && (
                        <span className={group.h1SiangStatus === 'completed' ? 'text-emerald-700 font-bold' : 'text-amber-700'}>
                          {group.h1SiangStatus === 'completed' ? '✓' : '...'}
                        </span>
                      )}
                    </div>
                    <div className="font-semibold text-slate-800 text-[11px] mt-1 truncate" title={group.h1SiangMenu || 'Nasi Ladas'}>
                      {(group.h1SiangQty || 0) > 0 ? (group.h1SiangMenu || 'Nasi Ladas') : '-'}
                    </div>
                    <div className="text-[11px] font-bold text-amber-700 mt-0.5">
                      {(group.h1SiangQty || 0) > 0 ? `${group.h1SiangQty} Porsi` : '-'}
                    </div>
                  </div>

                  {/* H-1 Malam */}
                  <div className={`p-2.5 rounded-lg border ${
                    (group.h1MalamQty || 0) === 0 
                      ? 'bg-slate-50/50 border-slate-100 text-slate-400' 
                      : group.h1MalamStatus === 'completed'
                      ? 'bg-emerald-50/60 border-emerald-200'
                      : 'bg-amber-50/40 border-amber-200/80'
                  }`}>
                    <div className="text-[10px] font-bold text-amber-800 uppercase flex justify-between">
                      <span>H-1 Malam</span>
                      {(group.h1MalamQty || 0) > 0 && (
                        <span className={group.h1MalamStatus === 'completed' ? 'text-emerald-700 font-bold' : 'text-amber-700'}>
                          {group.h1MalamStatus === 'completed' ? '✓' : '...'}
                        </span>
                      )}
                    </div>
                    <div className="font-semibold text-slate-800 text-[11px] mt-1 truncate" title={group.h1MalamMenu || 'Puti Minang'}>
                      {(group.h1MalamQty || 0) > 0 ? (group.h1MalamMenu || 'Puti Minang') : '-'}
                    </div>
                    <div className="text-[11px] font-bold text-amber-700 mt-0.5">
                      {(group.h1MalamQty || 0) > 0 ? `${group.h1MalamQty} Porsi` : '-'}
                    </div>
                  </div>

                  {/* Pagi */}
                  <div className={`p-2.5 rounded-lg border ${
                    group.pagiQty === 0 
                      ? 'bg-slate-50/50 border-slate-100 text-slate-400' 
                      : group.pagiStatus === 'completed'
                      ? 'bg-emerald-50/60 border-emerald-200'
                      : 'bg-white border-slate-200'
                  }`}>
                    <div className="text-[10px] font-bold text-slate-500 uppercase flex justify-between">
                      <span>06.30 Pagi</span>
                      {group.pagiQty > 0 && (
                        <span className={group.pagiStatus === 'completed' ? 'text-emerald-700 font-bold' : 'text-amber-700'}>
                          {group.pagiStatus === 'completed' ? '✓' : '...'}
                        </span>
                      )}
                    </div>
                    <div className="font-semibold text-slate-800 text-[11px] mt-1 truncate" title={group.pagiMenu}>
                      {group.pagiQty > 0 ? group.pagiMenu : '-'}
                    </div>
                    <div className="text-[11px] font-bold text-red-600 mt-0.5">
                      {group.pagiQty > 0 ? `${group.pagiQty} Porsi` : '-'}
                    </div>
                  </div>

                  {/* Snack Pagi */}
                  <div className={`p-2.5 rounded-lg border ${
                    group.snackPagiQty === 0 
                      ? 'bg-slate-50/50 border-slate-100 text-slate-400' 
                      : group.snackPagiStatus === 'completed'
                      ? 'bg-emerald-50/60 border-emerald-200'
                      : 'bg-white border-slate-200'
                  }`}>
                    <div className="text-[10px] font-bold text-slate-500 uppercase flex justify-between">
                      <span>09.30 Snack</span>
                      {group.snackPagiQty > 0 && (
                        <span className={group.snackPagiStatus === 'completed' ? 'text-emerald-700 font-bold' : 'text-amber-700'}>
                          {group.snackPagiStatus === 'completed' ? '✓' : '...'}
                        </span>
                      )}
                    </div>
                    <div className="font-semibold text-slate-800 text-[11px] mt-1 truncate" title={group.snackPagiMenu}>
                      {group.snackPagiQty > 0 ? group.snackPagiMenu : '-'}
                    </div>
                    <div className="text-[11px] font-bold text-red-600 mt-0.5">
                      {group.snackPagiQty > 0 ? `${group.snackPagiQty} Porsi` : '-'}
                    </div>
                  </div>

                  {/* Siang */}
                  <div className={`p-2.5 rounded-lg border ${
                    group.siangQty === 0 
                      ? 'bg-slate-50/50 border-slate-100 text-slate-400' 
                      : group.siangStatus === 'completed'
                      ? 'bg-emerald-50/60 border-emerald-200'
                      : 'bg-white border-slate-200'
                  }`}>
                    <div className="text-[10px] font-bold text-slate-500 uppercase flex justify-between">
                      <span>11.30 Siang</span>
                      {group.siangQty > 0 && (
                        <span className={group.siangStatus === 'completed' ? 'text-emerald-700 font-bold' : 'text-amber-700'}>
                          {group.siangStatus === 'completed' ? '✓' : '...'}
                        </span>
                      )}
                    </div>
                    <div className="font-semibold text-slate-800 text-[11px] mt-1 truncate" title={group.siangMenu}>
                      {group.siangQty > 0 ? group.siangMenu : '-'}
                    </div>
                    <div className="text-[11px] font-bold text-red-600 mt-0.5">
                      {group.siangQty > 0 ? `${group.siangQty} Porsi` : '-'}
                    </div>
                  </div>

                  {/* Snack Siang */}
                  <div className={`p-2.5 rounded-lg border ${
                    group.snackSiangQty === 0 
                      ? 'bg-slate-50/50 border-slate-100 text-slate-400' 
                      : group.snackSiangStatus === 'completed'
                      ? 'bg-emerald-50/60 border-emerald-200'
                      : 'bg-white border-slate-200'
                  }`}>
                    <div className="text-[10px] font-bold text-slate-500 uppercase flex justify-between">
                      <span>15.00 Snack</span>
                      {group.snackSiangQty > 0 && (
                        <span className={group.snackSiangStatus === 'completed' ? 'text-emerald-700 font-bold' : 'text-amber-700'}>
                          {group.snackSiangStatus === 'completed' ? '✓' : '...'}
                        </span>
                      )}
                    </div>
                    <div className="font-semibold text-slate-800 text-[11px] mt-1 truncate" title={group.snackSiangMenu}>
                      {group.snackSiangQty > 0 ? group.snackSiangMenu : '-'}
                    </div>
                    <div className="text-[11px] font-bold text-red-600 mt-0.5">
                      {group.snackSiangQty > 0 ? `${group.snackSiangQty} Porsi` : '-'}
                    </div>
                  </div>

                  {/* Minuman */}
                  <div className={`p-2.5 rounded-lg border ${
                    group.minumanQty === 0 
                      ? 'bg-slate-50/50 border-slate-100 text-slate-400' 
                      : group.minumanStatus === 'completed'
                      ? 'bg-emerald-50/60 border-emerald-200'
                      : 'bg-white border-slate-200'
                  }`}>
                    <div className="text-[10px] font-bold text-slate-500 uppercase flex justify-between">
                      <span>Minuman</span>
                      {group.minumanQty > 0 && (
                        <span className={group.minumanStatus === 'completed' ? 'text-emerald-700 font-bold' : 'text-amber-700'}>
                          {group.minumanStatus === 'completed' ? '✓' : '...'}
                        </span>
                      )}
                    </div>
                    <div className="font-semibold text-slate-800 text-[11px] mt-1 truncate" title={group.minumanMenu}>
                      {group.minumanQty > 0 ? group.minumanMenu : '-'}
                    </div>
                    <div className="text-[11px] font-bold text-blue-600 mt-0.5">
                      {group.minumanQty > 0 ? `${group.minumanQty} Botol/Porsi` : '-'}
                    </div>
                  </div>

                  {/* Malam */}
                  <div className={`p-2.5 rounded-lg border ${
                    group.malamQty === 0 
                      ? 'bg-slate-50/50 border-slate-100 text-slate-400' 
                      : group.malamStatus === 'completed'
                      ? 'bg-emerald-50/60 border-emerald-200'
                      : 'bg-white border-slate-200'
                  }`}>
                    <div className="text-[10px] font-bold text-slate-500 uppercase flex justify-between">
                      <span>17.30 Malam</span>
                      {group.malamQty > 0 && (
                        <span className={group.malamStatus === 'completed' ? 'text-emerald-700 font-bold' : 'text-amber-700'}>
                          {group.malamStatus === 'completed' ? '✓' : '...'}
                        </span>
                      )}
                    </div>
                    <div className="font-semibold text-slate-800 text-[11px] mt-1 truncate" title={group.malamMenu}>
                      {group.malamQty > 0 ? group.malamMenu : '-'}
                    </div>
                    <div className="text-[11px] font-bold text-red-600 mt-0.5">
                      {group.malamQty > 0 ? `${group.malamQty} Porsi` : '-'}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Lightbox / Modal Bukti Foto Pengambilan */}
      {viewingPhoto && (
        <div 
          className="fixed inset-0 z-60 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setViewingPhoto(null)}
        >
          <div 
            className="max-w-lg w-full bg-slate-900 rounded-2xl overflow-hidden border border-slate-700 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3.5 bg-slate-800 flex items-center justify-between border-b border-slate-700 text-white">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold">{viewingPhoto.title}</h4>
                  <p className="text-[10px] text-slate-400">{viewingPhoto.subtitle}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingPhoto(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-2 flex items-center justify-center max-h-[75vh] bg-black">
              <img
                src={viewingPhoto.url}
                alt="Bukti Foto Pengambilan"
                className="max-h-[70vh] w-auto object-contain rounded-lg shadow-inner"
              />
            </div>
            <div className="p-3 bg-slate-800 text-center flex items-center justify-between text-xs text-slate-400">
              <span className="text-[11px] text-emerald-400 font-semibold flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Dokumentasi Resmi Pos Konsumsi</span>
              </span>
              <button
                type="button"
                onClick={() => setViewingPhoto(null)}
                className="px-3 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-xs font-medium transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
