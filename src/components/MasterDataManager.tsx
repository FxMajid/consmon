import React, { useState, useMemo } from 'react';
import { 
  HariHGroupDistribution, 
  VoucherDistributionItem, 
  IDCardKonsumsi, 
  MenuDetail,
  MealTimeSlot
} from '../types';
import { 
  Database, 
  Plus, 
  Pencil, 
  Trash2, 
  Search, 
  Filter, 
  RotateCcw, 
  Save, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Utensils, 
  Ticket, 
  CreditCard, 
  BookOpen, 
  Layers, 
  Phone, 
  User, 
  Clock, 
  DollarSign, 
  Copy, 
  Sparkles,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  Info
} from 'lucide-react';
import { isSupabaseConfigured } from '../lib/supabase';

interface MasterDataManagerProps {
  // Hari H
  hariHGroups: HariHGroupDistribution[];
  onSaveHariHGroup: (group: HariHGroupDistribution, isNew: boolean) => Promise<boolean>;
  onDeleteHariHGroup: (id: string, groupNo?: number) => Promise<boolean>;

  // Voucher
  vouchers: VoucherDistributionItem[];
  onSaveVoucher: (voucher: VoucherDistributionItem, isNew: boolean) => Promise<boolean>;
  onDeleteVoucher: (id: string, voucherCode?: string) => Promise<boolean>;

  // ID Cards
  idCards: IDCardKonsumsi[];
  onSaveIdCard: (card: IDCardKonsumsi, isNew: boolean) => Promise<boolean>;
  onDeleteIdCard: (id: string) => Promise<boolean>;

  // Menu Catalog
  menus: MenuDetail[];
  onSaveMenu: (menu: MenuDetail, isNew: boolean) => void;
  onDeleteMenu: (id: string) => void;

  onRefreshCloudData?: () => Promise<void>;
}

type MasterTab = 'hari_h' | 'voucher' | 'id_cards' | 'menu';

export const MasterDataManager: React.FC<MasterDataManagerProps> = ({
  hariHGroups,
  onSaveHariHGroup,
  onDeleteHariHGroup,
  vouchers,
  onSaveVoucher,
  onDeleteVoucher,
  idCards,
  onSaveIdCard,
  onDeleteIdCard,
  menus,
  onSaveMenu,
  onDeleteMenu,
  onRefreshCloudData,
}) => {
  const [activeTab, setActiveTab] = useState<MasterTab>('hari_h');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Common Notification
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // =========================================================================
  // 1. MASTER HARI H STATE & LOGIC
  // =========================================================================
  const [hariHSearch, setHariHSearch] = useState('');
  const [hariHCategoryFilter, setHariHCategoryFilter] = useState<'all' | 'Internal' | 'Eksternal' | 'Buffer'>('all');
  const [hariHModalOpen, setHariHModalOpen] = useState(false);
  const [editingHariH, setEditingHariH] = useState<HariHGroupDistribution | null>(null);
  const [isNewHariH, setIsNewHariH] = useState(false);

  const filteredHariH = useMemo(() => {
    return hariHGroups.filter((item) => {
      if (hariHCategoryFilter !== 'all' && item.category !== hariHCategoryFilter) {
        return false;
      }
      if (hariHSearch.trim()) {
        const q = hariHSearch.toLowerCase();
        const match =
          item.no.toString().includes(q) ||
          item.groupName.toLowerCase().includes(q) ||
          item.picName.toLowerCase().includes(q) ||
          item.picPhone.includes(q);
        if (!match) return false;
      }
      return true;
    }).sort((a, b) => a.no - b.no);
  }, [hariHGroups, hariHCategoryFilter, hariHSearch]);

  const handleOpenHariHCreate = () => {
    const nextNo = hariHGroups.length > 0 ? Math.max(...hariHGroups.map((g) => g.no)) + 1 : 1;
    setEditingHariH({
      id: `h-grp-custom-${Date.now()}`,
      no: nextNo,
      groupName: '',
      picName: '',
      picPhone: '',
      category: nextNo >= 40 ? (nextNo === 64 ? 'Buffer' : 'Eksternal') : 'Internal',
      pagiQty: 0,
      pagiMenu: 'Nasi Uduk Eyang Rita',
      pagiStatus: 'pending',
      snackPagiQty: 0,
      snackPagiMenu: 'Roti Kamura',
      snackPagiStatus: 'pending',
      siangQty: 0,
      siangMenu: nextNo >= 40 ? 'Nasi Ayam Bu Ani' : 'Bebek Belur',
      siangStatus: 'pending',
      snackSiangQty: 0,
      snackSiangMenu: 'Umurais',
      snackSiangStatus: 'pending',
      minumanQty: 0,
      minumanMenu: 'Iso Plus / Mineral Botol',
      minumanStatus: 'pending',
      malamQty: 0,
      malamMenu: nextNo >= 40 ? 'Mbok Jum' : 'Ayam Penyet Surabaya',
      malamStatus: 'pending',
      totalAmount: 0,
      notes: '',
    });
    setIsNewHariH(true);
    setHariHModalOpen(true);
  };

  const handleOpenHariHEdit = (group: HariHGroupDistribution) => {
    setEditingHariH({ ...group });
    setIsNewHariH(false);
    setHariHModalOpen(true);
  };

  const handleSaveHariH = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingHariH) return;

    if (!editingHariH.groupName.trim()) {
      showNotification('error', 'Nama Divisi / Kelompok harus diisi');
      return;
    }

    const success = await onSaveHariHGroup(editingHariH, isNewHariH);
    if (success) {
      showNotification('success', `Berhasil ${isNewHariH ? 'menambahkan' : 'memperbarui'} data divisi "${editingHariH.groupName}"`);
      setHariHModalOpen(false);
      setEditingHariH(null);
    } else {
      showNotification('error', 'Gagal menyimpan data ke database');
    }
  };

  const handleDeleteHariH = async (group: HariHGroupDistribution) => {
    if (window.confirm(`Hapus data divisi #${group.no} "${group.groupName}"? Data ini akan dihapus dari sistem dan Supabase.`)) {
      const success = await onDeleteHariHGroup(group.id, group.no);
      if (success) {
        showNotification('success', `Data #${group.no} "${group.groupName}" berhasil dihapus.`);
      } else {
        showNotification('error', 'Gagal menghapus data dari database.');
      }
    }
  };

  // =========================================================================
  // 2. MASTER VOUCHER STATE & LOGIC
  // =========================================================================
  const [voucherSearch, setVoucherSearch] = useState('');
  const [voucherDayFilter, setVoucherDayFilter] = useState<'all' | 'H-2' | 'H-1' | 'H+1'>('all');
  const [voucherMealFilter, setVoucherMealFilter] = useState<string>('all');
  const [voucherModalOpen, setVoucherModalOpen] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<VoucherDistributionItem | null>(null);
  const [isNewVoucher, setIsNewVoucher] = useState(false);

  const filteredVouchers = useMemo(() => {
    return vouchers.filter((item) => {
      if (voucherDayFilter !== 'all' && item.day !== voucherDayFilter) {
        return false;
      }
      if (voucherMealFilter !== 'all' && item.mealType !== voucherMealFilter) {
        return false;
      }
      if (voucherSearch.trim()) {
        const q = voucherSearch.toLowerCase();
        const match =
          (item.voucherCode && item.voucherCode.toLowerCase().includes(q)) ||
          item.groupName.toLowerCase().includes(q) ||
          item.picName.toLowerCase().includes(q) ||
          item.menuVendor.toLowerCase().includes(q) ||
          item.id.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [vouchers, voucherDayFilter, voucherMealFilter, voucherSearch]);

  const handleOpenVoucherCreate = () => {
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const newCode = `VCH-H1-${randomSuffix}`;
    setEditingVoucher({
      id: `vch-custom-${Date.now()}`,
      day: 'H-1',
      groupNo: 1,
      groupName: '',
      picName: '',
      picPhone: '',
      mealType: 'Makan Siang',
      qty: 1,
      menuVendor: 'Bebek Belur',
      unitPrice: 31000,
      totalPrice: 31000,
      status: 'pending',
      voucherCode: newCode,
      notes: '',
    });
    setIsNewVoucher(true);
    setVoucherModalOpen(true);
  };

  const handleOpenVoucherEdit = (v: VoucherDistributionItem) => {
    setEditingVoucher({ ...v });
    setIsNewVoucher(false);
    setVoucherModalOpen(true);
  };

  const handleSaveVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVoucher) return;

    if (!editingVoucher.groupName.trim() || !editingVoucher.picName.trim()) {
      showNotification('error', 'Nama Kelompok dan PIC harus diisi');
      return;
    }

    const totalPrice = (editingVoucher.qty || 1) * (editingVoucher.unitPrice || 0);
    const itemToSave = { ...editingVoucher, totalPrice };

    const success = await onSaveVoucher(itemToSave, isNewVoucher);
    if (success) {
      showNotification('success', `Voucher "${itemToSave.voucherCode || itemToSave.id}" berhasil disimpan.`);
      setVoucherModalOpen(false);
      setEditingVoucher(null);
    } else {
      showNotification('error', 'Gagal menyimpan voucher ke database');
    }
  };

  const handleDeleteVoucherItem = async (v: VoucherDistributionItem) => {
    if (window.confirm(`Hapus voucher "${v.voucherCode || v.id}" untuk ${v.groupName}?`)) {
      const success = await onDeleteVoucher(v.id, v.voucherCode);
      if (success) {
        showNotification('success', `Voucher "${v.voucherCode || v.id}" berhasil dihapus.`);
      } else {
        showNotification('error', 'Gagal menghapus voucher dari database.');
      }
    }
  };

  // =========================================================================
  // 3. MASTER ID CARD STATE & LOGIC
  // =========================================================================
  const [idCardSearch, setIdCardSearch] = useState('');
  const [idCardStatusFilter, setIdCardStatusFilter] = useState<'all' | 'active' | 'unactivated'>('all');
  const [idCardCategoryFilter, setIdCardCategoryFilter] = useState<string>('all');
  const [idCardModalOpen, setIdCardModalOpen] = useState(false);
  const [editingIdCard, setEditingIdCard] = useState<IDCardKonsumsi | null>(null);
  const [isNewIdCard, setIsNewIdCard] = useState(false);

  const filteredIdCards = useMemo(() => {
    return idCards.filter((card) => {
      if (idCardStatusFilter !== 'all' && card.status !== idCardStatusFilter) {
        return false;
      }
      if (idCardCategoryFilter !== 'all' && card.kategori !== idCardCategoryFilter) {
        return false;
      }
      if (idCardSearch.trim()) {
        const q = idCardSearch.toLowerCase();
        const match =
          card.id.toLowerCase().includes(q) ||
          card.cardCode.toLowerCase().includes(q) ||
          (card.holderName && card.holderName.toLowerCase().includes(q)) ||
          (card.areaKerja && card.areaKerja.toLowerCase().includes(q)) ||
          (card.holderEmail && card.holderEmail.toLowerCase().includes(q));
        if (!match) return false;
      }
      return true;
    });
  }, [idCards, idCardStatusFilter, idCardCategoryFilter, idCardSearch]);

  const handleOpenIdCardCreate = () => {
    const nextIndex = idCards.length + 1;
    const padded = String(nextIndex).padStart(3, '0');
    setEditingIdCard({
      id: `IDC-${padded}`,
      cardCode: `HBD-ID-${padded}`,
      activationCode: `HBD-ACT-IDC-${padded}`,
      pickupCode: `HBD-PICKUP-IDC-${padded}`,
      status: 'unactivated',
      holderName: '',
      holderEmail: '',
      areaKerja: 'Panitia MD',
      kategori: 'Panitia',
      notes: '',
      claimedMeals: {
        pagi: { claimed: false },
        siang: { claimed: false },
        malam: { claimed: false },
      },
    });
    setIsNewIdCard(true);
    setIdCardModalOpen(true);
  };

  const handleOpenIdCardEdit = (card: IDCardKonsumsi) => {
    setEditingIdCard({ ...card });
    setIsNewIdCard(false);
    setIdCardModalOpen(true);
  };

  const handleSaveIdCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingIdCard) return;

    if (!editingIdCard.id.trim() || !editingIdCard.cardCode.trim()) {
      showNotification('error', 'ID Card dan Nomor Kartu harus diisi');
      return;
    }

    const success = await onSaveIdCard(editingIdCard, isNewIdCard);
    if (success) {
      showNotification('success', `ID Card ${editingIdCard.id} (${editingIdCard.holderName || 'Belum diisi nama'}) berhasil disimpan.`);
      setIdCardModalOpen(false);
      setEditingIdCard(null);
    } else {
      showNotification('error', 'Gagal menyimpan data ID Card ke Supabase');
    }
  };

  const handleDeleteIdCardItem = async (card: IDCardKonsumsi) => {
    if (window.confirm(`Hapus ID Card "${card.id}" (${card.holderName || 'Tanpa Nama'})?`)) {
      const success = await onDeleteIdCard(card.id);
      if (success) {
        showNotification('success', `ID Card ${card.id} berhasil dihapus.`);
      } else {
        showNotification('error', 'Gagal menghapus ID Card.');
      }
    }
  };

  // =========================================================================
  // 4. MASTER MENU CATALOG STATE & LOGIC
  // =========================================================================
  const [menuSearch, setMenuSearch] = useState('');
  const [menuCategoryFilter, setMenuCategoryFilter] = useState<'all' | 'makan' | 'snack' | 'minum'>('all');
  const [menuModalOpen, setMenuModalOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState<MenuDetail | null>(null);
  const [isNewMenu, setIsNewMenu] = useState(false);

  const filteredMenus = useMemo(() => {
    return menus.filter((m) => {
      if (menuCategoryFilter !== 'all' && m.category !== menuCategoryFilter) {
        return false;
      }
      if (menuSearch.trim()) {
        const q = menuSearch.toLowerCase();
        const match =
          m.name.toLowerCase().includes(q) ||
          m.vendor.toLowerCase().includes(q) ||
          m.timeLabel.toLowerCase().includes(q) ||
          (m.description && m.description.toLowerCase().includes(q));
        if (!match) return false;
      }
      return true;
    });
  }, [menus, menuCategoryFilter, menuSearch]);

  const handleOpenMenuCreate = () => {
    setEditingMenu({
      id: `menu_custom_${Date.now()}`,
      name: '',
      vendor: '',
      price: 25000,
      timeSlot: 'siang',
      timeLabel: '11.30 WIB',
      description: '',
      category: 'makan',
    });
    setIsNewMenu(true);
    setMenuModalOpen(true);
  };

  const handleOpenMenuEdit = (m: MenuDetail) => {
    setEditingMenu({ ...m });
    setIsNewMenu(false);
    setMenuModalOpen(true);
  };

  const handleSaveMenu = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMenu) return;

    if (!editingMenu.name.trim() || !editingMenu.vendor.trim()) {
      showNotification('error', 'Nama Menu dan Vendor harus diisi');
      return;
    }

    onSaveMenu(editingMenu, isNewMenu);
    showNotification('success', `Menu "${editingMenu.name}" berhasil disimpan.`);
    setMenuModalOpen(false);
    setEditingMenu(null);
  };

  const handleDeleteMenuItem = (m: MenuDetail) => {
    if (window.confirm(`Hapus menu "${m.name}" (${m.vendor}) dari katalog?`)) {
      onDeleteMenu(m.id);
      showNotification('success', `Menu "${m.name}" dihapus dari katalog.`);
    }
  };

  // Refresh handler
  const handleRefresh = async () => {
    if (onRefreshCloudData) {
      setIsRefreshing(true);
      await onRefreshCloudData();
      setIsRefreshing(false);
      showNotification('info', 'Data berhasil disinkronkan dengan database Supabase.');
    }
  };

  const isCloudActive = isSupabaseConfigured();

  return (
    <div className="space-y-6" id="master-data-manager">
      {/* Top Banner & Stats */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-2xl p-5 text-white shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-md bg-indigo-500/30 border border-indigo-400/40 text-indigo-200 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5" />
                Master Data Management
              </span>
              <span className="text-xs text-slate-300">
                CRUD System Terintegrasi
              </span>
              {isCloudActive ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1 animate-pulse" />
                  Supabase Connected
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Penyimpanan Lokal
                </span>
              )}
            </div>
            <h2 className="text-2xl font-black mt-2 tracking-tight flex items-center gap-2">
              Pusat Pengelolaan Data Master (CRUD)
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-3xl">
              Tambah, edit, sesuaikan porsi/jadwal, atau hapus data Kelompok Hari H, Voucher Mandiri, ID Card Peserta, dan Rekanan Menu Vendor secara langsung dengan sinkronisasi database.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {onRefreshCloudData && (
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-xs font-semibold text-white transition-all shadow-xs"
                title="Refresh dan reload data dari database cloud Supabase"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>{isRefreshing ? 'Menyinkronkan...' : 'Sinkron Cloud'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-700/60">
          <div 
            onClick={() => setActiveTab('hari_h')}
            className={`cursor-pointer p-3 rounded-xl border transition-all ${
              activeTab === 'hari_h' 
                ? 'bg-white/15 border-red-400/60 ring-1 ring-red-400/40' 
                : 'bg-white/5 border-white/10 hover:bg-white/10'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-300 font-medium">Hari H (Divisi)</span>
              <Clock className="w-4 h-4 text-red-400" />
            </div>
            <div className="text-xl font-bold mt-1 text-white">{hariHGroups.length} Kelompok</div>
            <div className="text-[10px] text-slate-400">Total 6 Waktu Distribusi</div>
          </div>

          <div 
            onClick={() => setActiveTab('voucher')}
            className={`cursor-pointer p-3 rounded-xl border transition-all ${
              activeTab === 'voucher' 
                ? 'bg-white/15 border-amber-400/60 ring-1 ring-amber-400/40' 
                : 'bg-white/5 border-white/10 hover:bg-white/10'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-300 font-medium">Voucher Mandiri</span>
              <Ticket className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-xl font-bold mt-1 text-white">{vouchers.length} Kupon</div>
            <div className="text-[10px] text-slate-400">Fase H-2, H-1 &amp; H+1</div>
          </div>

          <div 
            onClick={() => setActiveTab('id_cards')}
            className={`cursor-pointer p-3 rounded-xl border transition-all ${
              activeTab === 'id_cards' 
                ? 'bg-white/15 border-blue-400/60 ring-1 ring-blue-400/40' 
                : 'bg-white/5 border-white/10 hover:bg-white/10'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-300 font-medium">ID Card Peserta</span>
              <CreditCard className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-xl font-bold mt-1 text-white">{idCards.length} Kartu</div>
            <div className="text-[10px] text-slate-400">QR Fisik &amp; Digital</div>
          </div>

          <div 
            onClick={() => setActiveTab('menu')}
            className={`cursor-pointer p-3 rounded-xl border transition-all ${
              activeTab === 'menu' 
                ? 'bg-white/15 border-emerald-400/60 ring-1 ring-emerald-400/40' 
                : 'bg-white/5 border-white/10 hover:bg-white/10'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-300 font-medium">Menu &amp; Vendor</span>
              <BookOpen className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-xl font-bold mt-1 text-white">{menus.length} Menu</div>
            <div className="text-[10px] text-slate-400">Makan, Snack &amp; Minum</div>
          </div>
        </div>
      </div>

      {/* Floating Notification */}
      {notification && (
        <div className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between gap-2 shadow-sm animate-in fade-in slide-in-from-top-2 ${
          notification.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
            : notification.type === 'error'
            ? 'bg-rose-50 text-rose-800 border-rose-200'
            : 'bg-indigo-50 text-indigo-800 border-indigo-200'
        }`}>
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
          <button 
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center space-x-1 border-b border-slate-200 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('hari_h')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-t-xl text-xs font-bold border-b-2 transition-all ${
            activeTab === 'hari_h'
              ? 'border-red-600 text-red-600 bg-white shadow-2xs'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Master Distribusi Hari H ({hariHGroups.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('voucher')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-t-xl text-xs font-bold border-b-2 transition-all ${
            activeTab === 'voucher'
              ? 'border-amber-600 text-amber-600 bg-white shadow-2xs'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <Ticket className="w-4 h-4" />
          <span>Master Voucher Mandiri ({vouchers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('id_cards')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-t-xl text-xs font-bold border-b-2 transition-all ${
            activeTab === 'id_cards'
              ? 'border-blue-600 text-blue-600 bg-white shadow-2xs'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Master ID Card ({idCards.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('menu')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-t-xl text-xs font-bold border-b-2 transition-all ${
            activeTab === 'menu'
              ? 'border-emerald-600 text-emerald-600 bg-white shadow-2xs'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Master Menu &amp; Vendor ({menus.length})</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: MASTER DISTRIBUSI HARI H */}
      {/* ========================================================================= */}
      {activeTab === 'hari_h' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={hariHSearch}
                onChange={(e) => setHariHSearch(e.target.value)}
                placeholder="Cari nomor, divisi, nama PIC, atau nomor WA..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-red-500 bg-slate-50/50"
              />
            </div>

            <div className="flex items-center flex-wrap gap-2 w-full sm:w-auto justify-between sm:justify-end">
              <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg text-xs">
                <button
                  onClick={() => setHariHCategoryFilter('all')}
                  className={`px-2.5 py-1 rounded font-medium transition-colors ${
                    hariHCategoryFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Semua
                </button>
                <button
                  onClick={() => setHariHCategoryFilter('Internal')}
                  className={`px-2.5 py-1 rounded font-medium transition-colors ${
                    hariHCategoryFilter === 'Internal' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Internal (1-39)
                </button>
                <button
                  onClick={() => setHariHCategoryFilter('Eksternal')}
                  className={`px-2.5 py-1 rounded font-medium transition-colors ${
                    hariHCategoryFilter === 'Eksternal' ? 'bg-white text-teal-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Eksternal (40+)
                </button>
                <button
                  onClick={() => setHariHCategoryFilter('Buffer')}
                  className={`px-2.5 py-1 rounded font-medium transition-colors ${
                    hariHCategoryFilter === 'Buffer' ? 'bg-white text-purple-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Buffer (64)
                </button>
              </div>

              <button
                onClick={handleOpenHariHCreate}
                className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Divisi Baru</span>
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-3 w-12 text-center">No</th>
                    <th className="py-3 px-3 min-w-[220px]">Kelompok / Divisi</th>
                    <th className="py-3 px-3 min-w-[140px]">PIC &amp; Kontak</th>
                    <th className="py-3 px-3 text-center">Kategori</th>
                    <th className="py-3 px-3 text-center">Pagi</th>
                    <th className="py-3 px-3 text-center">Snk Pagi</th>
                    <th className="py-3 px-3 text-center">Siang</th>
                    <th className="py-3 px-3 text-center">Snk Sore</th>
                    <th className="py-3 px-3 text-center">Minum</th>
                    <th className="py-3 px-3 text-center">Malam</th>
                    <th className="py-3 px-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredHariH.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-8 text-center text-slate-400">
                        Tidak ada data yang sesuai filter / pencarian.
                      </td>
                    </tr>
                  ) : (
                    filteredHariH.map((group) => {
                      const totalPorsi = (group.pagiQty || 0) + (group.snackPagiQty || 0) + (group.siangQty || 0) + (group.snackSiangQty || 0) + (group.minumanQty || 0) + (group.malamQty || 0);
                      return (
                        <tr key={group.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-3 text-center font-bold text-slate-700">
                            {group.no}
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-bold text-slate-900">{group.groupName}</div>
                            {group.notes && (
                              <div className="text-[10px] text-slate-400 mt-0.5 truncate max-w-xs" title={group.notes}>
                                {group.notes}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-semibold text-slate-800">{group.picName}</div>
                            <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400" />
                              {group.picPhone || '-'}
                            </div>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              group.category === 'Internal'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : group.category === 'Buffer'
                                ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                : 'bg-teal-50 text-teal-700 border border-teal-200'
                            }`}>
                              {group.category}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-center">
                            <span className={`font-semibold ${group.pagiQty > 0 ? 'text-slate-800' : 'text-slate-300'}`}>
                              {group.pagiQty || 0}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-center">
                            <span className={`font-semibold ${group.snackPagiQty > 0 ? 'text-slate-800' : 'text-slate-300'}`}>
                              {group.snackPagiQty || 0}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-center">
                            <span className={`font-semibold ${group.siangQty > 0 ? 'text-slate-800' : 'text-slate-300'}`}>
                              {group.siangQty || 0}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-center">
                            <span className={`font-semibold ${group.snackSiangQty > 0 ? 'text-slate-800' : 'text-slate-300'}`}>
                              {group.snackSiangQty || 0}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-center">
                            <span className={`font-semibold ${group.minumanQty > 0 ? 'text-slate-800' : 'text-slate-300'}`}>
                              {group.minumanQty || 0}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-center">
                            <span className={`font-semibold ${group.malamQty > 0 ? 'text-slate-800' : 'text-slate-300'}`}>
                              {group.malamQty || 0}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end space-x-1">
                              <button
                                onClick={() => handleOpenHariHEdit(group)}
                                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 hover:text-slate-900 transition-colors"
                                title="Edit data divisi"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteHariH(group)}
                                className="p-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-600 hover:text-rose-700 transition-colors"
                                title="Hapus data divisi"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
              <span>Menampilkan <strong>{filteredHariH.length}</strong> dari <strong>{hariHGroups.length}</strong> kelompok</span>
              <span className="text-[11px] text-slate-400">Pembaruan langsung disinkronkan ke Supabase</span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2: MASTER VOUCHER */}
      {/* ========================================================================= */}
      {activeTab === 'voucher' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={voucherSearch}
                onChange={(e) => setVoucherSearch(e.target.value)}
                placeholder="Cari kode voucher, nama penerima, PIC, vendor..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-amber-500 bg-slate-50/50"
              />
            </div>

            <div className="flex items-center flex-wrap gap-2 w-full sm:w-auto justify-between sm:justify-end">
              <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg text-xs">
                <button
                  onClick={() => setVoucherDayFilter('all')}
                  className={`px-2.5 py-1 rounded font-medium transition-colors ${
                    voucherDayFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Semua Fase
                </button>
                <button
                  onClick={() => setVoucherDayFilter('H-2')}
                  className={`px-2.5 py-1 rounded font-medium transition-colors ${
                    voucherDayFilter === 'H-2' ? 'bg-white text-amber-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  H-2
                </button>
                <button
                  onClick={() => setVoucherDayFilter('H-1')}
                  className={`px-2.5 py-1 rounded font-medium transition-colors ${
                    voucherDayFilter === 'H-1' ? 'bg-white text-amber-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  H-1
                </button>
                <button
                  onClick={() => setVoucherDayFilter('H+1')}
                  className={`px-2.5 py-1 rounded font-medium transition-colors ${
                    voucherDayFilter === 'H+1' ? 'bg-white text-amber-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  H+1
                </button>
              </div>

              <button
                onClick={handleOpenVoucherCreate}
                className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Voucher Baru</span>
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-3">Kode Voucher</th>
                    <th className="py-3 px-3 text-center">Fase</th>
                    <th className="py-3 px-3">Kelompok / Penerima</th>
                    <th className="py-3 px-3">PIC Pengambil</th>
                    <th className="py-3 px-3">Waktu &amp; Menu Vendor</th>
                    <th className="py-3 px-3 text-center">Porsi</th>
                    <th className="py-3 px-3 text-right">Harga Satuan</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredVouchers.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-400">
                        Tidak ada voucher yang sesuai filter / pencarian.
                      </td>
                    </tr>
                  ) : (
                    filteredVouchers.map((v) => (
                      <tr key={v.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-3 font-mono font-bold text-amber-800">
                          {v.voucherCode || v.id}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                            {v.day}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-semibold text-slate-900">
                          {v.groupName}
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-medium text-slate-800">{v.picName}</div>
                          <div className="text-[11px] text-slate-500 font-mono">{v.picPhone || '-'}</div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-medium text-slate-900">{v.menuVendor}</div>
                          <div className="text-[10px] text-slate-500">{v.mealType}</div>
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-slate-800">
                          {v.qty}
                        </td>
                        <td className="py-3 px-3 text-right font-medium text-slate-700">
                          Rp {(v.unitPrice || 0).toLocaleString('id-ID')}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            v.status === 'claimed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : v.status === 'cancelled'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}>
                            {v.status === 'claimed' ? 'Diklaim' : v.status === 'cancelled' ? 'Batal' : 'Pending'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end space-x-1">
                            <button
                              onClick={() => handleOpenVoucherEdit(v)}
                              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 hover:text-slate-900 transition-colors"
                              title="Edit voucher"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteVoucherItem(v)}
                              className="p-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-600 hover:text-rose-700 transition-colors"
                              title="Hapus voucher"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
              <span>Menampilkan <strong>{filteredVouchers.length}</strong> dari <strong>{vouchers.length}</strong> voucher</span>
              <span className="text-[11px] text-slate-400">Perubahan voucher disinkronkan ke Supabase</span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 3: MASTER ID CARD */}
      {/* ========================================================================= */}
      {activeTab === 'id_cards' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={idCardSearch}
                onChange={(e) => setIdCardSearch(e.target.value)}
                placeholder="Cari ID Card, nomor kartu, nama pemegang, divisi..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
              />
            </div>

            <div className="flex items-center flex-wrap gap-2 w-full sm:w-auto justify-between sm:justify-end">
              <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg text-xs">
                <button
                  onClick={() => setIdCardStatusFilter('all')}
                  className={`px-2.5 py-1 rounded font-medium transition-colors ${
                    idCardStatusFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Semua Status
                </button>
                <button
                  onClick={() => setIdCardStatusFilter('active')}
                  className={`px-2.5 py-1 rounded font-medium transition-colors ${
                    idCardStatusFilter === 'active' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Aktif
                </button>
                <button
                  onClick={() => setIdCardStatusFilter('unactivated')}
                  className={`px-2.5 py-1 rounded font-medium transition-colors ${
                    idCardStatusFilter === 'unactivated' ? 'bg-white text-amber-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Belum Aktif
                </button>
              </div>

              <button
                onClick={handleOpenIdCardCreate}
                className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah ID Card</span>
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-3">ID Card</th>
                    <th className="py-3 px-3">Nomor Kartu Fisik</th>
                    <th className="py-3 px-3">Nama Pemegang</th>
                    <th className="py-3 px-3">Divisi / Area Kerja</th>
                    <th className="py-3 px-3 text-center">Kategori</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-3 text-center">Hak Makan</th>
                    <th className="py-3 px-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredIdCards.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        Tidak ada data ID Card yang sesuai.
                      </td>
                    </tr>
                  ) : (
                    filteredIdCards.map((card) => {
                      const meals = card.claimedMeals || {};
                      return (
                        <tr key={card.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-3 font-mono font-bold text-blue-900">
                            {card.id}
                          </td>
                          <td className="py-3 px-3 font-mono text-slate-600">
                            {card.cardCode}
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-bold text-slate-900">{card.holderName || <span className="text-slate-400 italic">Belum Diaktivasi</span>}</div>
                            {card.holderEmail && <div className="text-[10px] text-slate-400">{card.holderEmail}</div>}
                          </td>
                          <td className="py-3 px-3 text-slate-700">
                            {card.areaKerja || '-'}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                              {card.kategori || 'Internal'}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              card.status === 'active' 
                                ? 'bg-emerald-100 text-emerald-800' 
                                : 'bg-slate-100 text-slate-600'
                            }`}>
                              {card.status === 'active' ? 'Aktif' : 'Belum Aktif'}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <div className="flex items-center justify-center space-x-1 text-[10px]">
                              <span className={`px-1.5 py-0.5 rounded ${meals.pagi?.claimed ? 'bg-emerald-100 text-emerald-800 font-bold' : 'bg-slate-100 text-slate-500'}`} title="Pagi">
                                P
                              </span>
                              <span className={`px-1.5 py-0.5 rounded ${meals.siang?.claimed ? 'bg-emerald-100 text-emerald-800 font-bold' : 'bg-slate-100 text-slate-500'}`} title="Siang">
                                S
                              </span>
                              <span className={`px-1.5 py-0.5 rounded ${meals.malam?.claimed ? 'bg-emerald-100 text-emerald-800 font-bold' : 'bg-slate-100 text-slate-500'}`} title="Malam">
                                M
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end space-x-1">
                              <button
                                onClick={() => handleOpenIdCardEdit(card)}
                                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 hover:text-slate-900 transition-colors"
                                title="Edit ID card"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteIdCardItem(card)}
                                className="p-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-600 hover:text-rose-700 transition-colors"
                                title="Hapus ID card"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
              <span>Menampilkan <strong>{filteredIdCards.length}</strong> dari <strong>{idCards.length}</strong> ID Card</span>
              <span className="text-[11px] text-slate-400">Tersinkron dengan tabel id_cards_konsumsi</span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 4: MASTER MENU & REKANAN VENDOR */}
      {/* ========================================================================= */}
      {activeTab === 'menu' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={menuSearch}
                onChange={(e) => setMenuSearch(e.target.value)}
                placeholder="Cari nama menu, vendor, harga, deskripsi..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-slate-50/50"
              />
            </div>

            <div className="flex items-center flex-wrap gap-2 w-full sm:w-auto justify-between sm:justify-end">
              <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg text-xs">
                <button
                  onClick={() => setMenuCategoryFilter('all')}
                  className={`px-2.5 py-1 rounded font-medium transition-colors ${
                    menuCategoryFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Semua
                </button>
                <button
                  onClick={() => setMenuCategoryFilter('makan')}
                  className={`px-2.5 py-1 rounded font-medium transition-colors ${
                    menuCategoryFilter === 'makan' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Makanan
                </button>
                <button
                  onClick={() => setMenuCategoryFilter('snack')}
                  className={`px-2.5 py-1 rounded font-medium transition-colors ${
                    menuCategoryFilter === 'snack' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Snack
                </button>
                <button
                  onClick={() => setMenuCategoryFilter('minum')}
                  className={`px-2.5 py-1 rounded font-medium transition-colors ${
                    menuCategoryFilter === 'minum' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Minuman
                </button>
              </div>

              <button
                onClick={handleOpenMenuCreate}
                className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Menu Baru</span>
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-3">Nama Menu</th>
                    <th className="py-3 px-3">Vendor Penyedia</th>
                    <th className="py-3 px-3 text-center">Kategori</th>
                    <th className="py-3 px-3">Jadwal Sesi / Waktu</th>
                    <th className="py-3 px-3 text-right">Harga Satuan</th>
                    <th className="py-3 px-3">Deskripsi / Sasaran</th>
                    <th className="py-3 px-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredMenus.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        Tidak ada menu yang sesuai pencarian.
                      </td>
                    </tr>
                  ) : (
                    filteredMenus.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-3 font-bold text-slate-900">
                          {m.name}
                        </td>
                        <td className="py-3 px-3 font-semibold text-slate-700">
                          {m.vendor}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            m.category === 'makan' 
                              ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                              : m.category === 'snack'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-sky-50 text-sky-700 border border-sky-200'
                          }`}>
                            {m.category === 'makan' ? 'Makanan Utama' : m.category === 'snack' ? 'Snack' : 'Minuman'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-600 font-mono text-[11px]">
                          {m.timeLabel} ({m.timeSlot})
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-emerald-700">
                          Rp {m.price.toLocaleString('id-ID')}
                        </td>
                        <td className="py-3 px-3 text-slate-500 max-w-xs truncate" title={m.description}>
                          {m.description || '-'}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end space-x-1">
                            <button
                              onClick={() => handleOpenMenuEdit(m)}
                              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 hover:text-slate-900 transition-colors"
                              title="Edit menu"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteMenuItem(m)}
                              className="p-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-600 hover:text-rose-700 transition-colors"
                              title="Hapus menu"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
              <span>Menampilkan <strong>{filteredMenus.length}</strong> menu</span>
              <span className="text-[11px] text-slate-400">Standarisasi konsumsi konsmon</span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL EDIT / CREATE: HARI H GROUP */}
      {/* ========================================================================= */}
      {hariHModalOpen && editingHariH && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center font-bold">
                  <Clock className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">
                    {isNewHariH ? 'Tambah Kelompok Distribusi Hari H' : `Edit Divisi #${editingHariH.no} - ${editingHariH.groupName}`}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Konfigurasi PIC, nomor kontak, kategori, dan kuota porsi per sesi waktu makan
                  </p>
                </div>
              </div>
              <button
                onClick={() => setHariHModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveHariH} className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
              {/* Basic Info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nomor Urut (No)</label>
                  <input
                    type="number"
                    required
                    value={editingHariH.no}
                    onChange={(e) => {
                      const num = parseInt(e.target.value) || 1;
                      const autoCat = num === 64 ? 'Buffer' : (num >= 40 ? 'Eksternal' : 'Internal');
                      setEditingHariH({ ...editingHariH, no: num, category: autoCat });
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-red-500 font-bold"
                  />
                  <span className="text-[10px] text-slate-400">No 1-39 Internal, 40-63 Eksternal, 64 Buffer</span>
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Nama Kelompok / Divisi</label>
                  <input
                    type="text"
                    required
                    value={editingHariH.groupName}
                    onChange={(e) => setEditingHariH({ ...editingHariH, groupName: e.target.value })}
                    placeholder="Contoh: Panitia MD - Divisi Konsumsi"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-red-500 font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nama PIC Pengambil</label>
                  <input
                    type="text"
                    required
                    value={editingHariH.picName}
                    onChange={(e) => setEditingHariH({ ...editingHariH, picName: e.target.value })}
                    placeholder="Nama PIC"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nomor HP / WhatsApp</label>
                  <input
                    type="text"
                    value={editingHariH.picPhone}
                    onChange={(e) => setEditingHariH({ ...editingHariH, picPhone: e.target.value })}
                    placeholder="Contoh: 82183856996"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-red-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kategori</label>
                  <select
                    value={editingHariH.category}
                    onChange={(e) => setEditingHariH({ ...editingHariH, category: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-red-500 font-semibold"
                  >
                    <option value="Internal">Internal (Panitia MD)</option>
                    <option value="Eksternal">Eksternal (Vendor/Keamanan/Talent)</option>
                    <option value="Buffer">Buffer (Cadangan Panitia)</option>
                  </select>
                </div>
              </div>

              {/* Meal Slots Configuration */}
              <div className="pt-2 border-t border-slate-200">
                <h4 className="font-bold text-slate-800 text-xs mb-2 flex items-center gap-1.5">
                  <Utensils className="w-4 h-4 text-red-600" />
                  Alokasi Porsi &amp; Menu Setiap Sesi Waktu (Hari H)
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  {/* Pagi */}
                  <div>
                    <label className="block font-semibold text-slate-700 text-[11px] mb-0.5">Porsi Sarapan Pagi (06.30)</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min="0"
                        value={editingHariH.pagiQty}
                        onChange={(e) => setEditingHariH({ ...editingHariH, pagiQty: parseInt(e.target.value) || 0 })}
                        className="w-20 px-2 py-1.5 rounded-lg border border-slate-300 font-bold text-center"
                      />
                      <input
                        type="text"
                        value={editingHariH.pagiMenu}
                        onChange={(e) => setEditingHariH({ ...editingHariH, pagiMenu: e.target.value })}
                        placeholder="Menu Pagi"
                        className="flex-1 px-2 py-1.5 rounded-lg border border-slate-300 text-slate-800"
                      />
                    </div>
                  </div>

                  {/* Snack Pagi */}
                  <div>
                    <label className="block font-semibold text-slate-700 text-[11px] mb-0.5">Porsi Snack Pagi (09.30)</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min="0"
                        value={editingHariH.snackPagiQty}
                        onChange={(e) => setEditingHariH({ ...editingHariH, snackPagiQty: parseInt(e.target.value) || 0 })}
                        className="w-20 px-2 py-1.5 rounded-lg border border-slate-300 font-bold text-center"
                      />
                      <input
                        type="text"
                        value={editingHariH.snackPagiMenu}
                        onChange={(e) => setEditingHariH({ ...editingHariH, snackPagiMenu: e.target.value })}
                        placeholder="Menu Snack Pagi"
                        className="flex-1 px-2 py-1.5 rounded-lg border border-slate-300 text-slate-800"
                      />
                    </div>
                  </div>

                  {/* Siang */}
                  <div>
                    <label className="block font-semibold text-slate-700 text-[11px] mb-0.5">Porsi Makan Siang (11.30)</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min="0"
                        value={editingHariH.siangQty}
                        onChange={(e) => setEditingHariH({ ...editingHariH, siangQty: parseInt(e.target.value) || 0 })}
                        className="w-20 px-2 py-1.5 rounded-lg border border-slate-300 font-bold text-center"
                      />
                      <input
                        type="text"
                        value={editingHariH.siangMenu}
                        onChange={(e) => setEditingHariH({ ...editingHariH, siangMenu: e.target.value })}
                        placeholder="Menu Siang"
                        className="flex-1 px-2 py-1.5 rounded-lg border border-slate-300 text-slate-800"
                      />
                    </div>
                  </div>

                  {/* Snack Siang */}
                  <div>
                    <label className="block font-semibold text-slate-700 text-[11px] mb-0.5">Porsi Snack Sore (15.00)</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min="0"
                        value={editingHariH.snackSiangQty}
                        onChange={(e) => setEditingHariH({ ...editingHariH, snackSiangQty: parseInt(e.target.value) || 0 })}
                        className="w-20 px-2 py-1.5 rounded-lg border border-slate-300 font-bold text-center"
                      />
                      <input
                        type="text"
                        value={editingHariH.snackSiangMenu}
                        onChange={(e) => setEditingHariH({ ...editingHariH, snackSiangMenu: e.target.value })}
                        placeholder="Menu Snack Sore"
                        className="flex-1 px-2 py-1.5 rounded-lg border border-slate-300 text-slate-800"
                      />
                    </div>
                  </div>

                  {/* Minuman */}
                  <div>
                    <label className="block font-semibold text-slate-700 text-[11px] mb-0.5">Porsi Minuman (All Time)</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min="0"
                        value={editingHariH.minumanQty}
                        onChange={(e) => setEditingHariH({ ...editingHariH, minumanQty: parseInt(e.target.value) || 0 })}
                        className="w-20 px-2 py-1.5 rounded-lg border border-slate-300 font-bold text-center"
                      />
                      <input
                        type="text"
                        value={editingHariH.minumanMenu}
                        onChange={(e) => setEditingHariH({ ...editingHariH, minumanMenu: e.target.value })}
                        placeholder="Menu Minuman"
                        className="flex-1 px-2 py-1.5 rounded-lg border border-slate-300 text-slate-800"
                      />
                    </div>
                  </div>

                  {/* Malam */}
                  <div>
                    <label className="block font-semibold text-slate-700 text-[11px] mb-0.5">Porsi Makan Malam (17.30)</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min="0"
                        value={editingHariH.malamQty}
                        onChange={(e) => setEditingHariH({ ...editingHariH, malamQty: parseInt(e.target.value) || 0 })}
                        className="w-20 px-2 py-1.5 rounded-lg border border-slate-300 font-bold text-center"
                      />
                      <input
                        type="text"
                        value={editingHariH.malamMenu}
                        onChange={(e) => setEditingHariH({ ...editingHariH, malamMenu: e.target.value })}
                        placeholder="Menu Malam"
                        className="flex-1 px-2 py-1.5 rounded-lg border border-slate-300 text-slate-800"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Catatan Tambahan / Lokasi Pengambilan</label>
                <textarea
                  rows={2}
                  value={editingHariH.notes || ''}
                  onChange={(e) => setEditingHariH({ ...editingHariH, notes: e.target.value })}
                  placeholder="Contoh: Titik kumpul di booth modifikasi / diambil setelah apel pagi"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-red-500"
                />
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setHariHModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold shadow-xs"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan ke Database</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL EDIT / CREATE: VOUCHER */}
      {/* ========================================================================= */}
      {voucherModalOpen && editingVoucher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl max-w-xl w-full flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-amber-600 flex items-center justify-center font-bold">
                  <Ticket className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">
                    {isNewVoucher ? 'Tambah Voucher Mandiri Baru' : `Edit Voucher ${editingVoucher.voucherCode || editingVoucher.id}`}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Kupon makan mandiri H-2, H-1, atau H+1
                  </p>
                </div>
              </div>
              <button
                onClick={() => setVoucherModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveVoucher} className="p-5 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kode Voucher</label>
                  <input
                    type="text"
                    required
                    value={editingVoucher.voucherCode || ''}
                    onChange={(e) => setEditingVoucher({ ...editingVoucher, voucherCode: e.target.value })}
                    placeholder="Contoh: VCH-H1-001"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono font-bold text-amber-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Fase Hari</label>
                  <select
                    value={editingVoucher.day}
                    onChange={(e) => setEditingVoucher({ ...editingVoucher, day: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-semibold"
                  >
                    <option value="H-2">H-2 (Loading &amp; Setup Awal)</option>
                    <option value="H-1">H-1 (Gladi Bersih &amp; Briefing)</option>
                    <option value="H+1">H+1 (Bongkaran &amp; Closing)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nama Kelompok / Divisi</label>
                  <input
                    type="text"
                    required
                    value={editingVoucher.groupName}
                    onChange={(e) => setEditingVoucher({ ...editingVoucher, groupName: e.target.value })}
                    placeholder="Contoh: Vendor Sound &amp; Stage"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nama PIC Pengambil</label>
                  <input
                    type="text"
                    required
                    value={editingVoucher.picName}
                    onChange={(e) => setEditingVoucher({ ...editingVoucher, picName: e.target.value })}
                    placeholder="Nama PIC"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nomor WhatsApp PIC</label>
                  <input
                    type="text"
                    value={editingVoucher.picPhone}
                    onChange={(e) => setEditingVoucher({ ...editingVoucher, picPhone: e.target.value })}
                    placeholder="Contoh: 81234567890"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Sesi Waktu Makan</label>
                  <select
                    value={editingVoucher.mealType}
                    onChange={(e) => setEditingVoucher({ ...editingVoucher, mealType: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-semibold"
                  >
                    <option value="Makan Siang">Makan Siang</option>
                    <option value="Makan Malam">Makan Malam</option>
                    <option value="Minuman">Minuman</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kuota Porsi</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={editingVoucher.qty}
                    onChange={(e) => setEditingVoucher({ ...editingVoucher, qty: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-bold text-center"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Menu Rekanan Vendor</label>
                  <input
                    type="text"
                    required
                    value={editingVoucher.menuVendor}
                    onChange={(e) => setEditingVoucher({ ...editingVoucher, menuVendor: e.target.value })}
                    placeholder="Contoh: Bebek Belur"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Harga Satuan (Rp)</label>
                  <input
                    type="number"
                    min="0"
                    value={editingVoucher.unitPrice}
                    onChange={(e) => setEditingVoucher({ ...editingVoucher, unitPrice: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-right"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status Voucher</label>
                  <select
                    value={editingVoucher.status}
                    onChange={(e) => setEditingVoucher({ ...editingVoucher, status: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-semibold"
                  >
                    <option value="pending">Pending (Belum Diambil)</option>
                    <option value="claimed">Claimed (Sudah Diambil)</option>
                    <option value="cancelled">Cancelled (Dibatalkan)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Total Nilai</label>
                  <div className="px-3 py-2 rounded-lg bg-slate-100 font-bold text-slate-800">
                    Rp {((editingVoucher.qty || 1) * (editingVoucher.unitPrice || 0)).toLocaleString('id-ID')}
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Catatan</label>
                <input
                  type="text"
                  value={editingVoucher.notes || ''}
                  onChange={(e) => setEditingVoucher({ ...editingVoucher, notes: e.target.value })}
                  placeholder="Catatan voucher"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setVoucherModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-xs"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Voucher</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL EDIT / CREATE: ID CARD */}
      {/* ========================================================================= */}
      {idCardModalOpen && editingIdCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl max-w-xl w-full flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold">
                  <CreditCard className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">
                    {isNewIdCard ? 'Tambah ID Card Peserta / Panitia' : `Edit Kartu ${editingIdCard.id}`}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Aktivasi QR, divisi, dan status konsumsi kartu fisik/digital
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIdCardModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveIdCard} className="p-5 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ID Kartu (Sistem)</label>
                  <input
                    type="text"
                    required
                    value={editingIdCard.id}
                    onChange={(e) => setEditingIdCard({ ...editingIdCard, id: e.target.value })}
                    placeholder="Contoh: IDC-065"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nomor Fisik Kartu</label>
                  <input
                    type="text"
                    required
                    value={editingIdCard.cardCode}
                    onChange={(e) => setEditingIdCard({ ...editingIdCard, cardCode: e.target.value })}
                    placeholder="Contoh: HBD-ID-065"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono font-bold text-blue-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nama Pemegang Kartu</label>
                  <input
                    type="text"
                    value={editingIdCard.holderName || ''}
                    onChange={(e) => setEditingIdCard({ ...editingIdCard, holderName: e.target.value })}
                    placeholder="Nama Lengkap"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Divisi / Area Kerja</label>
                  <input
                    type="text"
                    value={editingIdCard.areaKerja || ''}
                    onChange={(e) => setEditingIdCard({ ...editingIdCard, areaKerja: e.target.value })}
                    placeholder="Contoh: Panitia MD, Booth Games, dsb"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email / Kontak</label>
                  <input
                    type="text"
                    value={editingIdCard.holderEmail || ''}
                    onChange={(e) => setEditingIdCard({ ...editingIdCard, holderEmail: e.target.value })}
                    placeholder="email@example.com"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kategori Peserta</label>
                  <select
                    value={editingIdCard.kategori || 'Internal'}
                    onChange={(e) => setEditingIdCard({ ...editingIdCard, kategori: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-semibold"
                  >
                    <option value="Internal">Internal (Panitia MD)</option>
                    <option value="Panitia">Panitia Lapangan</option>
                    <option value="Mobile">Mobile (Kupon Bergerak)</option>
                    <option value="Eksternal">Eksternal</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status Aktivasi</label>
                  <select
                    value={editingIdCard.status}
                    onChange={(e) => setEditingIdCard({ ...editingIdCard, status: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-semibold"
                  >
                    <option value="unactivated">Belum Aktif (Perlu Scan QR)</option>
                    <option value="active">Aktif (Sudah Diaktivasi)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kode Aktivasi Standee</label>
                  <input
                    type="text"
                    value={editingIdCard.activationCode}
                    onChange={(e) => setEditingIdCard({ ...editingIdCard, activationCode: e.target.value })}
                    placeholder="Kode QR Aktivasi"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-[11px]"
                  />
                </div>
              </div>

              {/* Status Hak Makan Claimed */}
              <div className="pt-2 border-t border-slate-200">
                <label className="block font-semibold text-slate-700 mb-1">Status Pengambilan Makan (Hari H)</label>
                <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={editingIdCard.claimedMeals?.pagi?.claimed || false}
                      onChange={(e) => setEditingIdCard({
                        ...editingIdCard,
                        claimedMeals: {
                          ...editingIdCard.claimedMeals,
                          pagi: { claimed: e.target.checked }
                        }
                      })}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="font-medium text-slate-800">Sarapan Pagi</span>
                  </label>

                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={editingIdCard.claimedMeals?.siang?.claimed || false}
                      onChange={(e) => setEditingIdCard({
                        ...editingIdCard,
                        claimedMeals: {
                          ...editingIdCard.claimedMeals,
                          siang: { claimed: e.target.checked }
                        }
                      })}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="font-medium text-slate-800">Makan Siang</span>
                  </label>

                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={editingIdCard.claimedMeals?.malam?.claimed || false}
                      onChange={(e) => setEditingIdCard({
                        ...editingIdCard,
                        claimedMeals: {
                          ...editingIdCard.claimedMeals,
                          malam: { claimed: e.target.checked }
                        }
                      })}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="font-medium text-slate-800">Makan Malam</span>
                  </label>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIdCardModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan ID Card</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL EDIT / CREATE: MENU CATALOG */}
      {/* ========================================================================= */}
      {menuModalOpen && editingMenu && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl max-w-xl w-full flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center font-bold">
                  <BookOpen className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">
                    {isNewMenu ? 'Tambah Menu & Vendor Baru' : `Edit Menu: ${editingMenu.name}`}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Katalog standarisasi konsumsi dan harga rekanan vendor
                  </p>
                </div>
              </div>
              <button
                onClick={() => setMenuModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMenu} className="p-5 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nama Menu</label>
                  <input
                    type="text"
                    required
                    value={editingMenu.name}
                    onChange={(e) => setEditingMenu({ ...editingMenu, name: e.target.value })}
                    placeholder="Contoh: Bebek Belur"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Vendor Penyedia</label>
                  <input
                    type="text"
                    required
                    value={editingMenu.vendor}
                    onChange={(e) => setEditingMenu({ ...editingMenu, vendor: e.target.value })}
                    placeholder="Nama Warung / Vendor"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kategori</label>
                  <select
                    value={editingMenu.category}
                    onChange={(e) => setEditingMenu({ ...editingMenu, category: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-semibold"
                  >
                    <option value="makan">Makanan Utama</option>
                    <option value="snack">Snack</option>
                    <option value="minum">Minuman</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Slot Waktu</label>
                  <select
                    value={editingMenu.timeSlot}
                    onChange={(e) => setEditingMenu({ ...editingMenu, timeSlot: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-semibold"
                  >
                    <option value="pagi">Pagi (Sarapan)</option>
                    <option value="snack_pagi">Snack Pagi</option>
                    <option value="siang">Siang (Lunch)</option>
                    <option value="snack_siang">Snack Sore</option>
                    <option value="minuman">Minuman</option>
                    <option value="malam">Malam (Dinner)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Label Jam</label>
                  <input
                    type="text"
                    value={editingMenu.timeLabel}
                    onChange={(e) => setEditingMenu({ ...editingMenu, timeLabel: e.target.value })}
                    placeholder="Contoh: 11.30 WIB"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Harga Satuan per Porsi (Rp)</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={editingMenu.price}
                  onChange={(e) => setEditingMenu({ ...editingMenu, price: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono font-bold text-emerald-800 text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Deskripsi &amp; Sasaran Penerima</label>
                <textarea
                  rows={2}
                  value={editingMenu.description || ''}
                  onChange={(e) => setEditingMenu({ ...editingMenu, description: e.target.value })}
                  placeholder="Deskripsi menu dan kelompok penerima..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setMenuModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Menu</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
