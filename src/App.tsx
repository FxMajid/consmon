import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { HariHMonitor } from './components/HariHMonitor';
import { VoucherMonitor } from './components/VoucherMonitor';
import { KartuAksesTable } from './components/KartuAksesTable';
import { MenuCatalog } from './components/MenuCatalog';
import { BudgetSummary } from './components/BudgetSummary';
import { PickupModal } from './components/PickupModal';
import { BarcodeScannerModal } from './components/BarcodeScannerModal';
import { BarcodeCardModal } from './components/BarcodeCardModal';
import { IdCardActivationModal } from './components/IdCardActivationModal';
import { DigitalPickupQrModal } from './components/DigitalPickupQrModal';
import { PrintableIdCardsModal } from './components/PrintableIdCardsModal';
import { StaticActivationQrModal } from './components/StaticActivationQrModal';
import { SupabaseConfigModal } from './components/SupabaseConfigModal';
import { DataImportModal, ImportCategory } from './components/DataImportModal';
import { isSupabaseConfigured, getSupabase } from './lib/supabase';
import { 
  fetchIdCardsFromSupabase, 
  upsertIdCardToSupabase, 
  bulkUpsertIdCardsToSupabase,
  fetchHariHFromSupabase, 
  upsertHariHToSupabase, 
  bulkUpsertHariHToSupabase,
  deleteHariHGroupFromSupabase,
  fetchVouchersFromSupabase, 
  upsertVoucherToSupabase 
} from './lib/supabaseService';

import { 
  HariHGroupDistribution, 
  VoucherDistributionItem, 
  MealTimeSlot,
  IDCardKonsumsi
} from './types';
import { 
  INITIAL_HARI_H_GROUPS, 
  INITIAL_VOUCHER_DATA, 
  INDIVIDUAL_ACCESS_CARDS,
  BUDGET_SUMMARY
} from './data/consumptionData';
import { INITIAL_ID_CARDS } from './data/idCardData';

export default function App() {
  const [activeTab, setActiveTab] = useState<'hari_h' | 'voucher' | 'kartu_akses' | 'menu' | 'budget'>('hari_h');

  // Persistence in localStorage
  const [hariHGroups, setHariHGroups] = useState<HariHGroupDistribution[]>(() => {
    const saved = localStorage.getItem('hbd_hari_h_groups');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (
          Array.isArray(parsed) &&
          (parsed.some((g: any) => g.id === 'h-grp-1' || g.groupName === 'Panitia MD' || g.picName === '16 PIC Internal') ||
            parsed.length < 30)
        ) {
          localStorage.setItem('hbd_hari_h_groups', JSON.stringify(INITIAL_HARI_H_GROUPS));
          return INITIAL_HARI_H_GROUPS;
        }
        return parsed;
      } catch (e) {
        console.error('Error parsing saved hari_h groups', e);
      }
    }
    return INITIAL_HARI_H_GROUPS;
  });

  const [vouchers, setVouchers] = useState<VoucherDistributionItem[]>(() => {
    const saved = localStorage.getItem('hbd_vouchers');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing saved vouchers', e);
      }
    }
    return INITIAL_VOUCHER_DATA;
  });

  const [idCards, setIdCards] = useState<IDCardKonsumsi[]>(() => {
    const saved = localStorage.getItem('hbd_id_cards');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // If saved data contains legacy pre-filled test names, reset to blank unactivated cards
        if (
          Array.isArray(parsed) &&
          parsed.some(
            (c: any) =>
              c.holderName === 'FEBRIANESA PARENGKUAN' ||
              c.holderName === 'Raditya Pratama' ||
              c.holderName === 'Citra Kirana Lestari' ||
              c.holderName === 'TRIDOYO AFIT WIJAYA' ||
              c.holderName === 'MARIA APRICHRISNA'
          )
        ) {
          localStorage.setItem('hbd_id_cards', JSON.stringify(INITIAL_ID_CARDS));
          return INITIAL_ID_CARDS;
        }
        return parsed;
      } catch (e) {
        console.error('Error parsing saved ID cards', e);
      }
    }
    return INITIAL_ID_CARDS;
  });

  // Modal state for ID Card Activation
  const [activationModalState, setActivationModalState] = useState<{
    isOpen: boolean;
    card: IDCardKonsumsi | null;
  }>({
    isOpen: false,
    card: null,
  });

  // Modal state for Digital Pickup QR
  const [digitalQrModalState, setDigitalQrModalState] = useState<{
    isOpen: boolean;
    card: IDCardKonsumsi | null;
  }>({
    isOpen: false,
    card: null,
  });

  // Modal state for Printable ID Cards
  const [printCardsModalState, setPrintCardsModalState] = useState<{
    isOpen: boolean;
    selectedCardId?: string;
  }>({
    isOpen: false,
  });

  // Modal state for Static QR Activation (Standee/Poster)
  const [isStaticQrModalOpen, setIsStaticQrModalOpen] = useState(false);

  // Modal state for Supabase Database Configuration & Status
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);

  // Modal state for Data Import (CSV/TSV/JSON -> Supabase & Local)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importModalCategory, setImportModalCategory] = useState<ImportCategory>('id_cards');

  const handleOpenImport = (category?: ImportCategory) => {
    setImportModalCategory(category || 'id_cards');
    setIsImportModalOpen(true);
  };

  const handleImportIdCards = (newCards: IDCardKonsumsi[], mode: 'replace' | 'merge') => {
    if (mode === 'replace') {
      setIdCards(newCards);
    } else {
      setIdCards((prev) => {
        const map = new Map<string, IDCardKonsumsi>();
        prev.forEach((c) => map.set(c.id, c));
        newCards.forEach((c) => map.set(c.id, c));
        return Array.from(map.values()).sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
      });
    }
  };

  const handleImportHariH = (newGroups: HariHGroupDistribution[], mode: 'replace' | 'merge') => {
    if (mode === 'replace') {
      setHariHGroups(newGroups);
    } else {
      setHariHGroups((prev) => {
        const map = new Map<string, HariHGroupDistribution>();
        prev.forEach((g) => map.set(g.id || String(g.no), g));
        newGroups.forEach((g) => map.set(g.id || String(g.no), g));
        return Array.from(map.values()).sort((a, b) => a.no - b.no);
      });
    }
  };

  const handleImportVouchers = (newVouchers: VoucherDistributionItem[], mode: 'replace' | 'merge') => {
    if (mode === 'replace') {
      setVouchers(newVouchers);
    } else {
      setVouchers((prev) => {
        const map = new Map<string, VoucherDistributionItem>();
        prev.forEach((v) => map.set(v.id, v));
        newVouchers.forEach((v) => map.set(v.id, v));
        return Array.from(map.values());
      });
    }
  };

  // Modal state for detailed check-in
  const [modalData, setModalData] = useState<{
    isOpen: boolean;
    groupId: string;
    slot: MealTimeSlot;
    groupName: string;
    picName: string;
    menu: string;
    qty: number;
    timeSlotLabel: string;
  }>({
    isOpen: false,
    groupId: '',
    slot: 'siang',
    groupName: '',
    picName: '',
    menu: '',
    qty: 0,
    timeSlotLabel: '',
  });

  // Barcode Scanner Modal State
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Barcode Card Modal State
  const [barcodeCardData, setBarcodeCardData] = useState<{
    groupName: string;
    picName: string;
    picPhone: string;
    slotLabel: string;
    menu: string;
    qty: number;
    barcodeCode: string;
    status: string;
    category?: string;
  } | null>(null);

  // Save to localStorage whenever states change
  useEffect(() => {
    localStorage.setItem('hbd_hari_h_groups', JSON.stringify(hariHGroups));
  }, [hariHGroups]);

  useEffect(() => {
    localStorage.setItem('hbd_vouchers', JSON.stringify(vouchers));
  }, [vouchers]);

  useEffect(() => {
    localStorage.setItem('hbd_id_cards', JSON.stringify(idCards));
  }, [idCards]);

  // Helper to safely merge cloud cards with local state
  const mergeCards = (localList: IDCardKonsumsi[], cloudList: IDCardKonsumsi[]): IDCardKonsumsi[] => {
    const map = new Map<string, IDCardKonsumsi>();
    localList.forEach((c) => map.set(c.id, c));
    cloudList.forEach((c) => map.set(c.id, c));
    return Array.from(map.values()).sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
  };

  // Initial cloud sync & Real-time multi-device subscription from Supabase
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    // 1. Initial Load
    fetchIdCardsFromSupabase().then((cloudCards) => {
      if (cloudCards && cloudCards.length > 0) {
        const hasLegacyNames = cloudCards.some(
          (c) =>
            c.holderName === 'FEBRIANESA PARENGKUAN' ||
            c.holderName === 'Raditya Pratama' ||
            c.holderName === 'Citra Kirana Lestari' ||
            c.holderName === 'TRIDOYO AFIT WIJAYA' ||
            c.holderName === 'MARIA APRICHRISNA'
        );
        if (hasLegacyNames) {
          bulkUpsertIdCardsToSupabase(INITIAL_ID_CARDS);
          setIdCards(INITIAL_ID_CARDS);
          localStorage.setItem('hbd_id_cards', JSON.stringify(INITIAL_ID_CARDS));
        } else {
          setIdCards((prev) => mergeCards(prev, cloudCards));
        }
      }
    });

    fetchHariHFromSupabase().then(async (cloudHariH) => {
      if (cloudHariH && cloudHariH.length > 0) {
        if (
          cloudHariH.some((g) => g.id === 'h-grp-1' || g.groupName === 'Panitia MD' || g.picName === '16 PIC Internal') ||
          cloudHariH.length < 30
        ) {
          // Obsolete combined Panitia MD row found in Supabase - auto-migrate to detailed PIC groups
          await deleteHariHGroupFromSupabase('h-grp-1');
          await bulkUpsertHariHToSupabase(INITIAL_HARI_H_GROUPS);
          setHariHGroups(INITIAL_HARI_H_GROUPS);
          localStorage.setItem('hbd_hari_h_groups', JSON.stringify(INITIAL_HARI_H_GROUPS));
        } else {
          setHariHGroups(cloudHariH);
        }
      } else {
        bulkUpsertHariHToSupabase(INITIAL_HARI_H_GROUPS);
      }
    });

    fetchVouchersFromSupabase().then((cloudVouchers) => {
      if (cloudVouchers && cloudVouchers.length > 0) {
        setVouchers(cloudVouchers);
      }
    });

    // 2. Real-time Channel Subscriptions
    const client = getSupabase();
    if (!client) return;

    const idCardChannel = client
      .channel('realtime_id_cards')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'id_cards_konsumsi' },
        () => {
          fetchIdCardsFromSupabase().then((cloudCards) => {
            if (cloudCards && cloudCards.length > 0) {
              setIdCards((prev) => mergeCards(prev, cloudCards));
            }
          });
        }
      )
      .subscribe();

    const hariHChannel = client
      .channel('realtime_hari_h')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'hari_h_distributions' },
        () => {
          fetchHariHFromSupabase().then((cloudHariH) => {
            if (cloudHariH && cloudHariH.length > 0) {
              setHariHGroups(cloudHariH);
            }
          });
        }
      )
      .subscribe();

    // 3. Heartbeat polling every 8s as fallback
    const interval = setInterval(() => {
      fetchIdCardsFromSupabase().then((cloudCards) => {
        if (cloudCards && cloudCards.length > 0) {
          setIdCards((prev) => mergeCards(prev, cloudCards));
        }
      });
    }, 8000);

    return () => {
      client.removeChannel(idCardChannel);
      client.removeChannel(hariHChannel);
      clearInterval(interval);
    };
  }, []);

  // Ref to track if initial URL action was already processed
  const urlHandledRef = React.useRef(false);

  // Auto-detect ?aktivasi=true or #aktivasi in URL (when panitia scans the static QR code with phone camera)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleUrlActions = () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const hash = window.location.hash || '';

        const isAktivasi = 
          urlParams.get('aktivasi') === 'true' || 
          urlParams.get('register') === 'true' || 
          urlParams.get('scan') === 'aktivasi' ||
          urlParams.has('act') ||
          hash.toLowerCase().includes('aktivasi');

        if (isAktivasi && !urlHandledRef.current) {
          urlHandledRef.current = true;
          const cardIdParam = urlParams.get('cardId') || urlParams.get('id');
          let targetCard: IDCardKonsumsi | null = null;
          if (cardIdParam) {
            targetCard = idCards.find((c) => c.id.toUpperCase() === cardIdParam.toUpperCase()) || null;
          }
          if (!targetCard) {
            targetCard = idCards.find((c) => c.status === 'unactivated') || null;
          }

          setActiveTab('kartu_akses');
          setActivationModalState({
            isOpen: true,
            card: targetCard,
          });

          // Clean up URL parameters cleanly to prevent re-triggering
          try {
            window.history.replaceState({}, document.title, window.location.pathname);
          } catch (e) {
            // ignore
          }
        }

        // Support direct digital QR pickup link: ?pickup=IDC-001 or ?digital=IDC-001
        const pickupParam = urlParams.get('pickup') || urlParams.get('digital') || urlParams.get('qr');
        if (pickupParam && !urlHandledRef.current) {
          urlHandledRef.current = true;
          const matched = idCards.find(
            (c) =>
              c.id.toUpperCase() === pickupParam.toUpperCase() ||
              c.pickupCode.toUpperCase() === pickupParam.toUpperCase()
          );
          if (matched) {
            setActiveTab('kartu_akses');
            setDigitalQrModalState({
              isOpen: true,
              card: matched,
            });
            try {
              window.history.replaceState({}, document.title, window.location.pathname);
            } catch (e) {
              // ignore
            }
          }
        }
      } catch (err) {
        console.error('Error handling URL params:', err);
      }
    };

    handleUrlActions();
    window.addEventListener('popstate', handleUrlActions);
    return () => window.removeEventListener('popstate', handleUrlActions);
  }, [idCards]);

  // Overall Statistics
  const globalStats = useMemo(() => {
    let totalPorsiHariH = 0;
    let diambilHariH = 0;

    hariHGroups.forEach((g) => {
      const slots: MealTimeSlot[] = ['pagi', 'snack_pagi', 'siang', 'snack_siang', 'minuman', 'malam'];
      slots.forEach((s) => {
        let q = 0;
        let st = 'pending';
        if (s === 'pagi') { q = g.pagiQty; st = g.pagiStatus; }
        else if (s === 'snack_pagi') { q = g.snackPagiQty; st = g.snackPagiStatus; }
        else if (s === 'siang') { q = g.siangQty; st = g.siangStatus; }
        else if (s === 'snack_siang') { q = g.snackSiangQty; st = g.snackSiangStatus; }
        else if (s === 'minuman') { q = g.minumanQty; st = g.minumanStatus; }
        else if (s === 'malam') { q = g.malamQty; st = g.malamStatus; }

        totalPorsiHariH += q;
        if (st === 'completed') diambilHariH += q;
      });
    });

    const totalVoucher = vouchers.reduce((acc, curr) => 
      curr.mealType !== 'Minuman' ? acc + curr.qty : acc, 0);
    const claimedVoucher = vouchers.reduce((acc, curr) => 
      curr.status === 'claimed' && curr.mealType !== 'Minuman' ? acc + curr.qty : acc, 0);

    return {
      totalPorsiHariH,
      diambilHariH,
      sisaHariH: totalPorsiHariH - diambilHariH,
      totalVoucher,
      claimedVoucher,
    };
  }, [hariHGroups, vouchers]);

  // Handlers for Hari H
  const handleToggleHariHStatus = (groupId: string, slot: MealTimeSlot, currentStatus: string) => {
    if (currentStatus === 'completed') {
      // Revert to pending
      setHariHGroups((prev) =>
        prev.map((g) => {
          if (g.id !== groupId) return g;
          const updated = { ...g };
          if (slot === 'pagi') { updated.pagiStatus = 'pending'; updated.pagiPickedAt = undefined; updated.pagiReceiver = undefined; }
          else if (slot === 'snack_pagi') { updated.snackPagiStatus = 'pending'; updated.snackPagiPickedAt = undefined; updated.snackPagiReceiver = undefined; }
          else if (slot === 'siang') { updated.siangStatus = 'pending'; updated.siangPickedAt = undefined; updated.siangReceiver = undefined; }
          else if (slot === 'snack_siang') { updated.snackSiangStatus = 'pending'; updated.snackSiangPickedAt = undefined; updated.snackSiangReceiver = undefined; }
          else if (slot === 'minuman') { updated.minumanStatus = 'pending'; updated.minumanPickedAt = undefined; updated.minumanReceiver = undefined; }
          else if (slot === 'malam') { updated.malamStatus = 'pending'; updated.malamPickedAt = undefined; updated.malamReceiver = undefined; }
          return updated;
        })
      );
    } else {
      // Open quick modal
      const group = hariHGroups.find((g) => g.id === groupId);
      if (!group) return;

      let menu = '';
      let qty = 0;
      let timeSlotLabel = '';

      if (slot === 'pagi') { menu = group.pagiMenu; qty = group.pagiQty; timeSlotLabel = '06.30 Pagi (Sarapan)'; }
      else if (slot === 'snack_pagi') { menu = group.snackPagiMenu; qty = group.snackPagiQty; timeSlotLabel = '09.30 Snack Pagi'; }
      else if (slot === 'siang') { menu = group.siangMenu; qty = group.siangQty; timeSlotLabel = '11.30 Makan Siang'; }
      else if (slot === 'snack_siang') { menu = group.snackSiangMenu; qty = group.snackSiangQty; timeSlotLabel = '15.00 Snack Sore'; }
      else if (slot === 'minuman') { menu = group.minumanMenu; qty = group.minumanQty; timeSlotLabel = 'Minuman Isotonik & Air'; }
      else if (slot === 'malam') { menu = group.malamMenu; qty = group.malamQty; timeSlotLabel = '17.30 Makan Malam'; }

      setModalData({
        isOpen: true,
        groupId,
        slot,
        groupName: group.groupName,
        picName: group.picName,
        menu,
        qty,
        timeSlotLabel,
      });
    }
  };

  const handleConfirmModal = (receiverName: string, note: string) => {
    const timeStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    setHariHGroups((prev) =>
      prev.map((g) => {
        if (g.id !== modalData.groupId) return g;
        const updated = { ...g };
        const slot = modalData.slot;

        if (slot === 'pagi') { updated.pagiStatus = 'completed'; updated.pagiPickedAt = timeStr; updated.pagiReceiver = receiverName; }
        else if (slot === 'snack_pagi') { updated.snackPagiStatus = 'completed'; updated.snackPagiPickedAt = timeStr; updated.snackPagiReceiver = receiverName; }
        else if (slot === 'siang') { updated.siangStatus = 'completed'; updated.siangPickedAt = timeStr; updated.siangReceiver = receiverName; }
        else if (slot === 'snack_siang') { updated.snackSiangStatus = 'completed'; updated.snackSiangPickedAt = timeStr; updated.snackSiangReceiver = receiverName; }
        else if (slot === 'minuman') { updated.minumanStatus = 'completed'; updated.minumanPickedAt = timeStr; updated.minumanReceiver = receiverName; }
        else if (slot === 'malam') { updated.malamStatus = 'completed'; updated.malamPickedAt = timeStr; updated.malamReceiver = receiverName; }

        if (note) {
          updated.notes = updated.notes ? `${updated.notes} | ${note}` : note;
        }
        return updated;
      })
    );
  };

  const handleBatchCompleteSlot = (slot: MealTimeSlot) => {
    const timeStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    setHariHGroups((prev) =>
      prev.map((g) => {
        const updated = { ...g };
        if (slot === 'pagi' && updated.pagiQty > 0) { updated.pagiStatus = 'completed'; updated.pagiPickedAt = timeStr; }
        else if (slot === 'snack_pagi' && updated.snackPagiQty > 0) { updated.snackPagiStatus = 'completed'; updated.snackPagiPickedAt = timeStr; }
        else if (slot === 'siang' && updated.siangQty > 0) { updated.siangStatus = 'completed'; updated.siangPickedAt = timeStr; }
        else if (slot === 'snack_siang' && updated.snackSiangQty > 0) { updated.snackSiangStatus = 'completed'; updated.snackSiangPickedAt = timeStr; }
        else if (slot === 'minuman' && updated.minumanQty > 0) { updated.minumanStatus = 'completed'; updated.minumanPickedAt = timeStr; }
        else if (slot === 'malam' && updated.malamQty > 0) { updated.malamStatus = 'completed'; updated.malamPickedAt = timeStr; }
        return updated;
      })
    );
  };

  // Handlers for Voucher
  const handleToggleVoucherStatus = (id: string, currentStatus: string) => {
    const timeStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    setVouchers((prev) =>
      prev.map((v) => {
        if (v.id !== id) return v;
        return {
          ...v,
          status: currentStatus === 'claimed' ? 'pending' : 'claimed',
          claimedAt: currentStatus === 'claimed' ? undefined : timeStr,
        };
      })
    );
  };

  const handleBatchClaimDay = (day: 'H-2' | 'H-1') => {
    const timeStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    setVouchers((prev) =>
      prev.map((v) => {
        if (v.day !== day) return v;
        return {
          ...v,
          status: 'claimed',
          claimedAt: timeStr,
        };
      })
    );
  };

  // Scanner Pickup Handlers
  const handleScannerConfirmHariH = (
    groupId: string,
    slot: MealTimeSlot,
    receiverName: string,
    note?: string
  ) => {
    const timeStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    setHariHGroups((prev) =>
      prev.map((g) => {
        if (g.id !== groupId) return g;
        if (slot === 'pagi') {
          return {
            ...g,
            pagiStatus: 'completed',
            pagiPickedAt: timeStr,
            pagiReceiver: receiverName || g.picName,
            pagiNotes: note,
          };
        } else if (slot === 'siang') {
          return {
            ...g,
            siangStatus: 'completed',
            siangPickedAt: timeStr,
            siangReceiver: receiverName || g.picName,
            siangNotes: note,
          };
        } else if (slot === 'malam') {
          return {
            ...g,
            malamStatus: 'completed',
            malamPickedAt: timeStr,
            malamReceiver: receiverName || g.picName,
            malamNotes: note,
          };
        }
        return g;
      })
    );
  };

  const handleScannerConfirmVoucher = (voucherId: string, receiverName: string) => {
    const timeStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    setVouchers((prev) =>
      prev.map((v) => {
        if (v.id !== voucherId) return v;
        return {
          ...v,
          status: 'claimed',
          claimedAt: timeStr,
          receiverName: receiverName || v.picName,
        };
      })
    );
  };

  // ID Card Activation Handler
  const handleActivateIdCard = (
    cardId: string,
    data: { name: string; email: string; areaKerja: string }
  ): IDCardKonsumsi => {
    const timeStr = new Date().toLocaleString('id-ID', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });

    const existing = idCards.find((c) => c.id === cardId);
    let activatedCard: IDCardKonsumsi;

    if (existing) {
      activatedCard = {
        ...existing,
        status: 'active',
        holderName: data.name,
        holderEmail: data.email,
        areaKerja: data.areaKerja,
        activatedAt: timeStr,
        claimedMeals: existing.claimedMeals || {
          pagi: { claimed: false },
          siang: { claimed: false },
          malam: { claimed: false },
        },
      };
      setIdCards((prev) => prev.map((c) => (c.id === cardId ? activatedCard : c)));
    } else {
      activatedCard = {
        id: cardId,
        cardCode: `HBD-ID-${cardId}`,
        activationCode: `HBD-ACT-${cardId}`,
        pickupCode: `HBD-PICKUP-${cardId}`,
        status: 'active',
        holderName: data.name,
        holderEmail: data.email,
        areaKerja: data.areaKerja,
        activatedAt: timeStr,
        kategori: 'Internal',
        claimedMeals: {
          pagi: { claimed: false },
          siang: { claimed: false },
          malam: { claimed: false },
        },
      };
      setIdCards((prev) => [activatedCard, ...prev]);
    }

    // Close activation modal and immediately open Digital Pickup QR Modal as the next step
    setActivationModalState({ isOpen: false, card: null });
    setDigitalQrModalState({
      isOpen: true,
      card: activatedCard,
    });

    // Sync with Supabase if configured
    if (isSupabaseConfigured()) {
      upsertIdCardToSupabase(activatedCard);
    }

    return activatedCard;
  };

  // ID Card Meal Claim Handler
  const handleClaimIdCardMeal = (cardId: string, meal: 'pagi' | 'siang' | 'malam') => {
    const timeStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    setIdCards((prev) =>
      prev.map((c) => {
        if (c.id === cardId) {
          const currentClaimed = c.claimedMeals || {
            pagi: { claimed: false },
            siang: { claimed: false },
            malam: { claimed: false },
          };
          const updated = {
            ...c,
            claimedMeals: {
              ...currentClaimed,
              [meal]: { claimed: true, claimedAt: timeStr },
            },
          };

          if (isSupabaseConfigured()) {
            upsertIdCardToSupabase(updated);
          }

          return updated;
        }
        return c;
      })
    );

    // Also update currently open digital QR modal if displaying this card
    setDigitalQrModalState((prev) => {
      if (prev.card && prev.card.id === cardId) {
        const currentClaimed = prev.card.claimedMeals || {
          pagi: { claimed: false },
          siang: { claimed: false },
          malam: { claimed: false },
        };
        return {
          ...prev,
          card: {
            ...prev.card,
            claimedMeals: {
              ...currentClaimed,
              [meal]: { claimed: true, claimedAt: timeStr },
            },
          },
        };
      }
      return prev;
    });
  };

  // Reset Data to Factory Default
  const handleResetData = () => {
    if (window.confirm('Reset seluruh status pengambilan Hari H, voucher, dan ID Card ke kondisi awal?')) {
      localStorage.removeItem('hbd_hari_h_groups');
      localStorage.removeItem('hbd_vouchers');
      localStorage.removeItem('hbd_id_cards');
      setHariHGroups(INITIAL_HARI_H_GROUPS);
      setVouchers(INITIAL_VOUCHER_DATA);
      setIdCards(INITIAL_ID_CARDS);
    }
  };

  // Export CSV
  const handleExportCsv = () => {
    const headers = [
      'No',
      'Kelompok / Divisi',
      'Kategori',
      'PIC Pengambil',
      'Kontak WA',
      'Pagi Qty',
      'Pagi Menu',
      'Pagi Status',
      'Siang Qty',
      'Siang Menu',
      'Siang Status',
      'Malam Qty',
      'Malam Menu',
      'Malam Status',
      'Total Nilai Rp'
    ];

    const rows = hariHGroups.map((g) => [
      g.no,
      `"${g.groupName}"`,
      g.category,
      `"${g.picName}"`,
      g.picPhone,
      g.pagiQty,
      `"${g.pagiMenu}"`,
      g.pagiStatus,
      g.siangQty,
      `"${g.siangMenu}"`,
      g.siangStatus,
      g.malamQty,
      `"${g.malamMenu}"`,
      g.malamStatus,
      g.totalAmount
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `monitoring_konsumsi_hbd_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col antialiased">
      {/* App Header & Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        stats={globalStats}
        onResetData={handleResetData}
        onExportCsv={handleExportCsv}
        onOpenScanner={() => setIsScannerOpen(true)}
        onOpenSupabaseConfig={() => setIsSupabaseModalOpen(true)}
        onOpenImport={handleOpenImport}
      />

      {/* Main Content Area */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1">
        {activeTab === 'hari_h' && (
          <HariHMonitor
            groups={hariHGroups}
            onToggleStatus={handleToggleHariHStatus}
            onBatchCompleteSlot={handleBatchCompleteSlot}
            onOpenScanner={() => setIsScannerOpen(true)}
            onOpenImport={handleOpenImport}
            onOpenBarcodeCard={(data) => setBarcodeCardData(data)}
          />
        )}

        {activeTab === 'voucher' && (
          <VoucherMonitor
            vouchers={vouchers}
            onToggleVoucherStatus={handleToggleVoucherStatus}
            onBatchClaimDay={handleBatchClaimDay}
            onOpenScanner={() => setIsScannerOpen(true)}
            onOpenImport={handleOpenImport}
            onOpenBarcodeCard={(data) => setBarcodeCardData(data)}
          />
        )}

        {activeTab === 'kartu_akses' && (
          <KartuAksesTable 
            cards={INDIVIDUAL_ACCESS_CARDS}
            idCards={idCards}
            onOpenActivationModal={(card) => setActivationModalState({ isOpen: true, card: card || null })}
            onOpenDigitalQrModal={(card) => setDigitalQrModalState({ isOpen: true, card })}
            onOpenPrintModal={(cardId) => setPrintCardsModalState({ isOpen: true, selectedCardId: cardId })}
            onOpenStaticQrModal={() => setIsStaticQrModalOpen(true)}
            onOpenScanner={() => setIsScannerOpen(true)}
            onOpenImport={handleOpenImport}
            onClaimMeal={handleClaimIdCardMeal}
          />
        )}

        {activeTab === 'menu' && (
          <MenuCatalog />
        )}

        {activeTab === 'budget' && (
          <BudgetSummary />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            Sistem Operasional Distribusi Konsumsi HBD &bull; Pos Utama Konsumsi Panitia
          </span>
          <span className="text-[11px] text-slate-400">
            Total Porsi Hari H: <strong>{globalStats.totalPorsiHariH}</strong> &bull; Sisa Budget: <strong>Rp {BUDGET_SUMMARY.sisaBudget.toLocaleString('id-ID')}</strong>
          </span>
        </div>
      </footer>

      {/* Modal for marking pickup manual */}
      <PickupModal
        isOpen={modalData.isOpen}
        onClose={() => setModalData((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={handleConfirmModal}
        groupName={modalData.groupName}
        picName={modalData.picName}
        menu={modalData.menu}
        qty={modalData.qty}
        timeSlotLabel={modalData.timeSlotLabel}
      />

      {/* Barcode Scanner Modal for Camera / USB Barcode Gun */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        hariHGroups={hariHGroups}
        vouchers={vouchers}
        idCards={idCards}
        activeSlot="siang"
        onConfirmPickupHariH={handleScannerConfirmHariH}
        onConfirmClaimVoucher={handleScannerConfirmVoucher}
        onOpenActivationModal={(card) => {
          setIsScannerOpen(false);
          setActivationModalState({ isOpen: true, card: card || null });
        }}
        onClaimIdCardMeal={handleClaimIdCardMeal}
      />

      {/* Barcode & QR Code Card for Printing / Displaying */}
      <BarcodeCardModal
        isOpen={barcodeCardData !== null}
        onClose={() => setBarcodeCardData(null)}
        barcodeData={barcodeCardData}
      />

      {/* Modal Aktivasi ID Card Konsumsi (Input Nama, Email, Area Kerja) */}
      <IdCardActivationModal
        isOpen={activationModalState.isOpen}
        onClose={() => setActivationModalState({ isOpen: false, card: null })}
        card={activationModalState.card}
        allCards={idCards}
        onActivateCard={handleActivateIdCard}
        onSuccessOpenQr={(card) => {
          setActivationModalState({ isOpen: false, card: null });
          setDigitalQrModalState({ isOpen: true, card });
        }}
      />

      {/* Modal QR Pengambilan Konsumsi Digital (Alternatif jika ID Card fisik hilang) */}
      <DigitalPickupQrModal
        isOpen={digitalQrModalState.isOpen}
        onClose={() => setDigitalQrModalState({ isOpen: false, card: null })}
        card={digitalQrModalState.card}
        onClaimMeal={handleClaimIdCardMeal}
      />

      {/* Modal Cetak Fisik ID Card Konsumsi beserta QR Aktivasi */}
      <PrintableIdCardsModal
        isOpen={printCardsModalState.isOpen}
        onClose={() => setPrintCardsModalState({ isOpen: false })}
        cards={idCards}
        selectedCardId={printCardsModalState.selectedCardId}
        onSelectToActivate={(card) => {
          setPrintCardsModalState({ isOpen: false });
          setActivationModalState({ isOpen: true, card });
        }}
      />

      {/* Modal QR Statis Aktivasi ID Card (Standee Meja / Poster Pos) */}
      <StaticActivationQrModal
        isOpen={isStaticQrModalOpen}
        onClose={() => setIsStaticQrModalOpen(false)}
        onOpenActivationForm={() => {
          setIsStaticQrModalOpen(false);
          setActivationModalState({ isOpen: true, card: null });
        }}
      />

      {/* Modal Konfigurasi Integrasi Database Supabase */}
      <SupabaseConfigModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
        idCards={idCards}
        hariHGroups={hariHGroups}
        vouchers={vouchers}
      />

      {/* Modal Import Data (CSV/TSV/JSON ke Supabase & Local State) */}
      <DataImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        initialCategory={importModalCategory}
        onImportIdCards={handleImportIdCards}
        onImportHariH={handleImportHariH}
        onImportVouchers={handleImportVouchers}
        currentIdCardsCount={idCards.length}
        currentHariHCount={hariHGroups.length}
        currentVouchersCount={vouchers.length}
      />
    </div>
  );
}
