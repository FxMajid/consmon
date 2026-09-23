import React, { useState, useMemo } from 'react';
import { IndividualAccessCard, IDCardKonsumsi } from '../types';
import { WORK_AREAS } from '../data/idCardData';
import { 
  Users, 
  Search, 
  MessageSquare, 
  Check, 
  X, 
  Smartphone, 
  Building, 
  Shield, 
  Info, 
  ExternalLink, 
  CreditCard, 
  QrCode, 
  Printer, 
  Sparkles, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Scan, 
  Utensils, 
  Filter,
  Activity,
  Download,
  Upload,
  Radio,
  Clock
} from 'lucide-react';

interface KartuAksesTableProps {
  cards: IndividualAccessCard[];
  idCards: IDCardKonsumsi[];
  onOpenActivationModal: (card?: IDCardKonsumsi) => void;
  onOpenDigitalQrModal: (card: IDCardKonsumsi) => void;
  onOpenPrintModal: (cardId?: string) => void;
  onOpenStaticQrModal?: () => void;
  onOpenScanner: () => void;
  onOpenImport?: (category?: 'id_cards' | 'hari_h' | 'vouchers') => void;
  onClaimMeal: (cardId: string, meal: 'pagi' | 'siang' | 'malam') => void;
}

export const KartuAksesTable: React.FC<KartuAksesTableProps> = ({ 
  cards,
  idCards,
  onOpenActivationModal,
  onOpenDigitalQrModal,
  onOpenPrintModal,
  onOpenStaticQrModal,
  onOpenScanner,
  onOpenImport,
  onClaimMeal,
}) => {
  const [subTab, setSubTab] = useState<'id_cards' | 'monitoring_live' | 'master_pic'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('hbd_kartu_akses_subtab');
      if (saved && ['id_cards', 'monitoring_live', 'master_pic'].includes(saved)) {
        return saved as any;
      }
    }
    return 'id_cards';
  });

  const handleSetSubTab = (tab: 'id_cards' | 'monitoring_live' | 'master_pic') => {
    setSubTab(tab);
    localStorage.setItem('hbd_kartu_akses_subtab', tab);
  };

  // ID Cards state filters
  const [idSearchQuery, setIdSearchQuery] = useState('');
  const [idStatusFilter, setIdStatusFilter] = useState<'all' | 'active' | 'unactivated'>('all');
  const [idAreaFilter, setIdAreaFilter] = useState<string>('all');

  // Master PIC state filters
  const [searchQuery, setSearchQuery] = useState('');
  const [kategoriFilter, setKategoriFilter] = useState<'all' | 'Internal' | 'Mobile' | 'Eksternal'>('all');
  const [dayAttendanceFilter, setDayAttendanceFilter] = useState<string>('all');

  // Filtered ID Cards
  const filteredIdCards = useMemo(() => {
    return idCards.filter((card) => {
      if (idStatusFilter !== 'all' && card.status !== idStatusFilter) {
        return false;
      }
      if (idAreaFilter !== 'all' && card.areaKerja !== idAreaFilter) {
        return false;
      }
      if (idSearchQuery.trim()) {
        const q = idSearchQuery.toLowerCase();
        const match =
          card.id.toLowerCase().includes(q) ||
          card.cardCode.toLowerCase().includes(q) ||
          (card.holderName && card.holderName.toLowerCase().includes(q)) ||
          (card.holderEmail && card.holderEmail.toLowerCase().includes(q)) ||
          (card.areaKerja && card.areaKerja.toLowerCase().includes(q));
        if (!match) return false;
      }
      return true;
    });
  }, [idCards, idStatusFilter, idAreaFilter, idSearchQuery]);

  // ID Cards stats
  const idCardStats = useMemo(() => {
    const total = idCards.length;
    const active = idCards.filter((c) => c.status === 'active').length;
    const unactivated = total - active;
    
    // Total meal claims among active cards
    const pagiClaimed = idCards.filter((c) => c.claimedMeals?.pagi?.claimed).length;
    const siangClaimed = idCards.filter((c) => c.claimedMeals?.siang?.claimed).length;
    const malamClaimed = idCards.filter((c) => c.claimedMeals?.malam?.claimed).length;

    return { total, active, unactivated, pagiClaimed, siangClaimed, malamClaimed };
  }, [idCards]);

  // Active / Activated Cards sorted by activation date (most recent first)
  const activatedCards = useMemo(() => {
    return idCards
      .filter((c) => c.status === 'active')
      .sort((a, b) => {
        const dateA = a.activatedAt ? new Date(a.activatedAt).getTime() : 0;
        const dateB = b.activatedAt ? new Date(b.activatedAt).getTime() : 0;
        return dateB - dateA;
      });
  }, [idCards]);

  const filteredActivatedCards = useMemo(() => {
    return activatedCards.filter((card) => {
      if (idAreaFilter !== 'all' && card.areaKerja !== idAreaFilter) {
        return false;
      }
      if (idSearchQuery.trim()) {
        const q = idSearchQuery.toLowerCase();
        return (
          card.id.toLowerCase().includes(q) ||
          card.cardCode.toLowerCase().includes(q) ||
          (card.holderName && card.holderName.toLowerCase().includes(q)) ||
          (card.holderEmail && card.holderEmail.toLowerCase().includes(q)) ||
          (card.areaKerja && card.areaKerja.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [activatedCards, idAreaFilter, idSearchQuery]);

  // Export activated list to CSV
  const handleExportCsv = () => {
    const headers = ['ID Card', 'Nomor Seri', 'Nama Lengkap', 'Email', 'Area Kerja', 'Kategori', 'Waktu Aktivasi', 'Pagi', 'Siang', 'Malam'];
    const rows = activatedCards.map((c) => [
      c.id,
      c.cardCode,
      `"${c.holderName || ''}"`,
      `"${c.holderEmail || ''}"`,
      `"${c.areaKerja || ''}"`,
      c.kategori || 'Internal',
      c.activatedAt || '',
      c.claimedMeals?.pagi?.claimed ? 'Sudah Diambil' : 'Belum',
      c.claimedMeals?.siang?.claimed ? 'Sudah Diambil' : 'Belum',
      c.claimedMeals?.malam?.claimed ? 'Sudah Diambil' : 'Belum',
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `monitoring_aktivasi_idcard_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Master PIC filter
  const filteredCards = useMemo(() => {
    return cards.filter((item) => {
      if (kategoriFilter !== 'all' && item.kategori !== kategoriFilter) {
        return false;
      }
      if (dayAttendanceFilter !== 'all') {
        if (dayAttendanceFilter === 'siangH2' && item.siangH2 !== 'Hadir') return false;
        if (dayAttendanceFilter === 'siangH1' && item.siangH1 !== 'Hadir') return false;
        if (dayAttendanceFilter === 'malamH1' && item.malamH1 !== 'Hadir') return false;
        if (dayAttendanceFilter === 'pagiH' && item.pagiH !== 'Hadir') return false;
        if (dayAttendanceFilter === 'siangH' && item.siangH !== 'Hadir') return false;
        if (dayAttendanceFilter === 'malamH' && item.malamH !== 'Hadir') return false;
      }

      const matchSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.picHbd.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.areaKerja.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.picPengambil.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.kontakWa.includes(searchQuery);

      return matchSearch;
    });
  }, [cards, kategoriFilter, dayAttendanceFilter, searchQuery]);

  const stats = useMemo(() => {
    const totalInternal = cards.filter((c) => c.kategori === 'Internal').reduce((a, b) => a + b.qty, 0);
    const totalMobile = cards.filter((c) => c.kategori === 'Mobile').reduce((a, b) => a + b.qty, 0);
    const totalEksternal = cards.filter((c) => c.kategori === 'Eksternal').reduce((a, b) => a + b.qty, 0);
    return {
      totalInternal,
      totalMobile,
      totalEksternal,
      grandTotal: totalInternal + totalMobile + totalEksternal,
    };
  }, [cards]);

  const openWa = (phone: string, name: string) => {
    if (!phone) return;
    const cleanPhone = phone.startsWith('0') 
      ? '62' + phone.slice(1) 
      : phone.startsWith('8') 
      ? '62' + phone 
      : phone;

    const msg = encodeURIComponent(
      `Halo Kak *${name}*, konfirmasi dari Tim Konsumsi HBD mengenai kartu akses konsumsi panitia.`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${msg}`, '_blank');
  };

  const isHadir = (val: string) => val === 'Hadir';

  return (
    <div className="space-y-6" id="kartu-akses-section">
      {/* Top Header Card */}
      <div className="bg-slate-900 rounded-2xl p-5 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 rounded bg-blue-900 text-blue-200 text-xs font-semibold uppercase tracking-wide">
              Manajemen ID Card &amp; Akses
            </span>
            <span className="text-slate-400 text-xs">Aktivasi QR &bull; Kupon Digital</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black mt-1 tracking-tight">
            ID Card Konsumsi &amp; QR Aktivasi
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            Cetak ID Card fisik dengan QR Aktivasi. Pemegang kartu dapat registrasi nama, email, dan area kerja untuk menerbitkan QR Pengambilan Konsumsi Digital (cadangan sah jika ID card fisik hilang).
          </p>
        </div>

        {/* Quick ID Card Stats */}
        <div className="flex items-center space-x-2 sm:space-x-4 bg-slate-800/90 p-3 rounded-xl border border-slate-700 text-xs shrink-0">
          <div className="text-center px-2">
            <div className="text-[10px] text-slate-400 font-medium">Total ID Card</div>
            <div className="text-base font-bold text-white">{idCardStats.total}</div>
          </div>
          <div className="h-7 w-px bg-slate-700"></div>
          <div className="text-center px-2">
            <div className="text-[10px] text-slate-400 font-medium">Teraktivasi</div>
            <div className="text-base font-bold text-emerald-400">{idCardStats.active}</div>
          </div>
          <div className="h-7 w-px bg-slate-700"></div>
          <div className="text-center px-2">
            <div className="text-[10px] text-slate-400 font-medium">Belum Aktif</div>
            <div className="text-base font-bold text-amber-400">{idCardStats.unactivated}</div>
          </div>
        </div>
      </div>

      {/* Sub Navigation Switcher */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => handleSetSubTab('id_cards')}
          className={`inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-colors ${
            subTab === 'id_cards'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Aktivasi &amp; Cetak ID Card ({idCardStats.total})</span>
        </button>

        <button
          onClick={() => handleSetSubTab('monitoring_live')}
          className={`inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-colors ${
            subTab === 'monitoring_live'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <Activity className="w-4 h-4" />
          <span>Live Monitoring Aktivasi ({idCardStats.active})</span>
        </button>

        <button
          onClick={() => handleSetSubTab('master_pic')}
          className={`inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-colors ${
            subTab === 'master_pic'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Master Alokasi PIC &amp; Jadwal ({cards.length})</span>
        </button>
      </div>

      {/* VIEW 1: ID CARD KONSUMSI & QR AKTIVASI */}
      {subTab === 'id_cards' && (
        <div className="space-y-6">
          {/* Feature Highlight: QR Statis Aktivasi Konsumsi */}
          <div className="bg-gradient-to-r from-red-950 via-slate-900 to-slate-950 text-white rounded-2xl p-5 border border-red-500/40 shadow-md flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center space-x-3.5">
              <div className="w-12 h-12 rounded-2xl bg-red-600/20 border border-red-500/40 flex items-center justify-center shrink-0">
                <QrCode className="w-7 h-7 text-red-400" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Sistem QR Statis
                  </span>
                  <h3 className="font-bold text-base text-white">
                    QR Statis Aktivasi ID Card &amp; Kupon Makan
                  </h3>
                </div>
                <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                  Pasang <strong>1 QR Statis</strong> di meja pos konsumsi / pintu masuk venue. Panitia/staff scan QR &rarr; input <strong>Nama</strong> (free text), pilih <strong>Area Kerja</strong> (drop-down sesuai data), dan <strong>Email</strong> &rarr; sistem otomatis menerbitkan <strong>QR Pengambilan Konsumsi Digital</strong> untuk makan Pagi, Siang &amp; Malam!
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {onOpenStaticQrModal && (
                <button
                  onClick={onOpenStaticQrModal}
                  className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md transition-all"
                >
                  <QrCode className="w-4 h-4" />
                  <span>Lihat &amp; Cetak QR Statis</span>
                </button>
              )}

              <button
                onClick={() => onOpenActivationModal()}
                className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-bold transition-all"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Simulasi Scan (Form 3-Field)</span>
              </button>
            </div>
          </div>

          {/* Visual Workflow Steps Banner */}
          <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-slate-50 border border-blue-200/80 rounded-2xl p-4 sm:p-5">
            <div className="flex items-center space-x-2 mb-3">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
                !
              </span>
              <h3 className="font-bold text-slate-900 text-sm">
                Alur Kerja ID Card Konsumsi &amp; QR Pengambilan Alternatif
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
              <div className="bg-white rounded-xl p-3 border border-blue-100 shadow-2xs">
                <div className="font-bold text-blue-800 flex items-center space-x-1 mb-1">
                  <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 text-[10px] flex items-center justify-center font-bold">1</span>
                  <span>Cetak ID Card Fisik</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  ID Card dicetak dengan <strong>QR Aktivasi</strong> unik per nomor seri kartu fisik.
                </p>
              </div>

              <div className="bg-white rounded-xl p-3 border border-blue-100 shadow-2xs">
                <div className="font-bold text-indigo-800 flex items-center space-x-1 mb-1">
                  <span className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-700 text-[10px] flex items-center justify-center font-bold">2</span>
                  <span>Scan QR Aktivasi</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Pemegang kartu scan QR dengan kamera HP dan mengisi <strong>Nama, Email, &amp; Area Kerja</strong>.
                </p>
              </div>

              <div className="bg-white rounded-xl p-3 border border-emerald-100 shadow-2xs">
                <div className="font-bold text-emerald-800 flex items-center space-x-1 mb-1">
                  <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 text-[10px] flex items-center justify-center font-bold">3</span>
                  <span>Terbit QR Digital</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Setelah aktif, muncul <strong>QR Pengambilan Digital</strong> di layar HP sebagai cadangan jika kartu hilang.
                </p>
              </div>

              <div className="bg-white rounded-xl p-3 border border-teal-100 shadow-2xs">
                <div className="font-bold text-teal-800 flex items-center space-x-1 mb-1">
                  <span className="w-4 h-4 rounded-full bg-teal-100 text-teal-700 text-[10px] flex items-center justify-center font-bold">4</span>
                  <span>Ambil Konsumsi di Pos</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Petugas pos konsumsi scan QR digital atau kartu fisik untuk verifikasi jatah makan Pagi, Siang, Malam.
                </p>
              </div>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {/* Search */}
              <div className="relative min-w-[220px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Cari ID, Nama, Email, Area..."
                  value={idSearchQuery}
                  onChange={(e) => setIdSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-xl text-xs text-slate-900 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              {/* Status Filter */}
              <select
                value={idStatusFilter}
                onChange={(e) => setIdStatusFilter(e.target.value as any)}
                className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs text-slate-700 bg-white font-medium"
              >
                <option value="all">Semua Status ({idCards.length})</option>
                <option value="active">Teraktivasi Saja ({idCardStats.active})</option>
                <option value="unactivated">Belum Diaktivasi ({idCardStats.unactivated})</option>
              </select>

              {/* Area Kerja Filter */}
              <select
                value={idAreaFilter}
                onChange={(e) => setIdAreaFilter(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs text-slate-700 bg-white font-medium max-w-[200px]"
              >
                <option value="all">Semua Area Kerja</option>
                {WORK_AREAS.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              {onOpenStaticQrModal && (
                <button
                  onClick={onOpenStaticQrModal}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs transition-colors"
                >
                  <QrCode className="w-4 h-4" />
                  <span>QR Statis Standee</span>
                </button>
              )}

              <button
                onClick={onOpenScanner}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition-colors shadow-xs"
              >
                <Scan className="w-4 h-4 text-red-400" />
                <span>Scan Barcode / QR</span>
              </button>

              {onOpenImport && (
                <button
                  onClick={() => onOpenImport('id_cards')}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold transition-colors shadow-2xs"
                  title="Import CSV/Excel ID Card & Panitia ke Database Supabase"
                >
                  <Upload className="w-4 h-4 text-indigo-600" />
                  <span>Import Data ID Card</span>
                </button>
              )}

              <button
                onClick={() => onOpenPrintModal()}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 text-xs font-bold transition-colors"
              >
                <Printer className="w-4 h-4 text-slate-600" />
                <span>Cetak ID Card Fisik</span>
              </button>

              <button
                onClick={() => onOpenActivationModal()}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                <span>+ Aktivasi ID Card</span>
              </button>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredIdCards.map((card) => {
              const isCardActive = card.status === 'active';

              return (
                <div
                  key={card.id}
                  className={`bg-white rounded-2xl border p-4 shadow-xs flex flex-col justify-between transition-all hover:shadow-md ${
                    isCardActive ? 'border-slate-200' : 'border-amber-200 bg-amber-50/20'
                  }`}
                >
                  <div>
                    {/* Card Top Row */}
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-slate-900 text-white">
                          {card.id}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-500 uppercase">
                          {card.kategori || 'Internal'}
                        </span>
                      </div>
                      {isCardActive ? (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Aktif Terdaftar</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                          <AlertCircle className="w-3 h-3" />
                          <span>Belum Diaktivasi</span>
                        </span>
                      )}
                    </div>

                    {/* Holder Info */}
                    <div className="py-3">
                      {isCardActive ? (
                        <div className="space-y-1">
                          <h4 className="font-black text-slate-900 text-sm">{card.holderName}</h4>
                          <div className="text-xs font-semibold text-blue-700">{card.areaKerja}</div>
                          <div className="text-[11px] text-slate-600 font-mono">{card.holderEmail}</div>
                          {card.activatedAt && (
                            <div className="text-[10px] text-slate-400 font-medium">
                              Teraktivasi: {card.activatedAt}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="py-2 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                          <QrCode className="w-6 h-6 mx-auto text-slate-300 mb-1" />
                          <div className="text-xs font-semibold text-slate-600">ID Card Siap Diaktivasi</div>
                          <div className="text-[10px] text-slate-400">Scan QR fisik atau klik aktivasi mandiri</div>
                        </div>
                      )}
                    </div>

                    {/* Meal Status on Hari H */}
                    <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100 mb-3">
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                        <span>Jatah Makan Hari H:</span>
                        <span className="text-[9px] font-normal text-slate-400">Status Pengambilan</span>
                      </div>
                      <div className="grid grid-cols-3 gap-1 text-center text-[10px]">
                        <div className={`p-1 rounded ${card.claimedMeals?.pagi?.claimed ? 'bg-emerald-100 text-emerald-900 font-bold' : 'bg-white text-slate-500 border border-slate-200'}`}>
                          Pagi: {card.claimedMeals?.pagi?.claimed ? 'Sudah' : 'Belum'}
                        </div>
                        <div className={`p-1 rounded ${card.claimedMeals?.siang?.claimed ? 'bg-emerald-100 text-emerald-900 font-bold' : 'bg-white text-slate-500 border border-slate-200'}`}>
                          Siang: {card.claimedMeals?.siang?.claimed ? 'Sudah' : 'Belum'}
                        </div>
                        <div className={`p-1 rounded ${card.claimedMeals?.malam?.claimed ? 'bg-emerald-100 text-emerald-900 font-bold' : 'bg-white text-slate-500 border border-slate-200'}`}>
                          Malam: {card.claimedMeals?.malam?.claimed ? 'Sudah' : 'Belum'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-1.5">
                    <button
                      onClick={() => onOpenPrintModal(card.id)}
                      title="Cetak ID Card Fisik (QR Aktivasi)"
                      className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Cetak Fisik</span>
                    </button>

                    {isCardActive ? (
                      <button
                        onClick={() => onOpenDigitalQrModal(card)}
                        title="Tampilkan QR Pengambilan Konsumsi Digital (Backup jika ID Card hilang)"
                        className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-2xs transition-colors"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>QR Digital (Backup)</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => onOpenActivationModal(card)}
                        title="Aktivasi ID Card ini sekarang"
                        className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-2xs transition-colors"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Aktivasi Kartu</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 2: LIVE MONITORING AKTIVASI ID CARD */}
      {subTab === 'monitoring_live' && (
        <div className="space-y-6">
          {/* Header Monitoring & Status Cloud */}
          <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white rounded-2xl p-5 border border-emerald-500/30 shadow-md">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="inline-flex items-center space-x-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
                    <span>Real-time Live Sync</span>
                  </span>
                  <span className="text-slate-400 text-xs">Supabase Cloud Connected</span>
                </div>
                <h3 className="font-bold text-lg text-white mt-1">
                  Live Monitoring Registrasi &amp; Aktivasi ID Card
                </h3>
                <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                  Pantau langsung panitia/staff yang baru saja melakukan aktivasi mandiri melalui scan QR Statis di venue. Data tersinkronisasi otomatis secara real-time ke cloud database Supabase.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleExportCsv}
                  className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Laporan CSV ({activatedCards.length})</span>
                </button>

                {onOpenStaticQrModal && (
                  <button
                    onClick={onOpenStaticQrModal}
                    className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-bold transition-all"
                  >
                    <QrCode className="w-4 h-4 text-emerald-400" />
                    <span>QR Statis Standee</span>
                  </button>
                )}
              </div>
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-5 pt-4 border-t border-slate-800">
              <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700/60">
                <div className="text-[10px] text-slate-400 font-semibold uppercase">Total Kartu</div>
                <div className="text-xl font-black text-white mt-0.5">{idCardStats.total}</div>
                <div className="text-[9px] text-slate-400 mt-0.5">Alokasi Fisik</div>
              </div>

              <div className="bg-emerald-950/40 rounded-xl p-3 border border-emerald-500/30">
                <div className="text-[10px] text-emerald-400 font-semibold uppercase">Teraktivasi</div>
                <div className="text-xl font-black text-emerald-300 mt-0.5">{idCardStats.active}</div>
                <div className="text-[9px] text-emerald-400/80 mt-0.5">
                  {((idCardStats.active / Math.max(1, idCardStats.total)) * 100).toFixed(0)}% Selesai
                </div>
              </div>

              <div className="bg-amber-950/40 rounded-xl p-3 border border-amber-500/30">
                <div className="text-[10px] text-amber-400 font-semibold uppercase">Belum Aktif</div>
                <div className="text-xl font-black text-amber-300 mt-0.5">{idCardStats.unactivated}</div>
                <div className="text-[9px] text-amber-400/80 mt-0.5">Menunggu Scan</div>
              </div>

              <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700/60">
                <div className="text-[10px] text-slate-400 font-semibold uppercase">Makan Pagi</div>
                <div className="text-xl font-black text-blue-400 mt-0.5">
                  {idCardStats.pagiClaimed} <span className="text-xs text-slate-400 font-normal">/ {idCardStats.active}</span>
                </div>
                <div className="text-[9px] text-slate-400 mt-0.5">Terdistribusi</div>
              </div>

              <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700/60">
                <div className="text-[10px] text-slate-400 font-semibold uppercase">Makan Siang</div>
                <div className="text-xl font-black text-blue-400 mt-0.5">
                  {idCardStats.siangClaimed} <span className="text-xs text-slate-400 font-normal">/ {idCardStats.active}</span>
                </div>
                <div className="text-[9px] text-slate-400 mt-0.5">Terdistribusi</div>
              </div>

              <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700/60">
                <div className="text-[10px] text-slate-400 font-semibold uppercase">Makan Malam</div>
                <div className="text-xl font-black text-blue-400 mt-0.5">
                  {idCardStats.malamClaimed} <span className="text-xs text-slate-400 font-normal">/ {idCardStats.active}</span>
                </div>
                <div className="text-[9px] text-slate-400 mt-0.5">Terdistribusi</div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-4 pt-3 border-t border-slate-800/60">
              <div className="flex justify-between text-xs text-slate-300 mb-1 font-medium">
                <span>Progress Registrasi Lapangan</span>
                <span>{idCardStats.active} dari {idCardStats.total} Panitia ({((idCardStats.active / Math.max(1, idCardStats.total)) * 100).toFixed(0)}%)</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-emerald-500 to-teal-400 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${(idCardStats.active / Math.max(1, idCardStats.total)) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-[240px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Cari nama, email, area kerja..."
                  value={idSearchQuery}
                  onChange={(e) => setIdSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-xl text-xs text-slate-900 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <select
                value={idAreaFilter}
                onChange={(e) => setIdAreaFilter(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs text-slate-700 bg-white font-medium max-w-[220px]"
              >
                <option value="all">Semua Area Kerja</option>
                {WORK_AREAS.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>

            <div className="text-xs text-slate-500 font-medium">
              Menampilkan <span className="font-bold text-slate-900">{filteredActivatedCards.length}</span> dari <span className="font-bold text-slate-900">{activatedCards.length}</span> kartu aktif
            </div>
          </div>

          {/* Live Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-3 w-12 text-center">No</th>
                    <th className="py-3 px-3">Waktu Aktivasi</th>
                    <th className="py-3 px-3">ID Card</th>
                    <th className="py-3 px-3">Nama Pemegang</th>
                    <th className="py-3 px-3">Email</th>
                    <th className="py-3 px-3">Area Kerja</th>
                    <th className="py-3 px-2 text-center">Pagi</th>
                    <th className="py-3 px-2 text-center">Siang</th>
                    <th className="py-3 px-2 text-center">Malam</th>
                    <th className="py-3 px-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredActivatedCards.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-slate-400">
                        <Activity className="w-8 h-8 mx-auto text-slate-300 mb-2 opacity-60" />
                        <div className="text-xs font-semibold text-slate-600">Belum Ada Aktivasi yang Sesuai</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Panitia dapat melakukan aktivasi melalui scan QR Statis di pintu masuk venue.
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredActivatedCards.map((card, idx) => (
                      <tr key={card.id} className="hover:bg-emerald-50/40 transition-colors">
                        <td className="py-3 px-3 text-center font-mono text-slate-400 text-[11px]">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-3 text-slate-600 font-mono text-[11px]">
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>{card.activatedAt || '-'}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-900 text-white">
                            {card.id}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-900">{card.holderName || '-'}</div>
                          <div className="text-[10px] text-slate-400 uppercase">{card.kategori || 'Internal'}</div>
                        </td>
                        <td className="py-3 px-3 font-mono text-[11px] text-slate-600">
                          {card.holderEmail || '-'}
                        </td>
                        <td className="py-3 px-3">
                          <span className="inline-block px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-semibold text-[11px] border border-blue-100">
                            {card.areaKerja || '-'}
                          </span>
                        </td>

                        {/* Status Jatah Makan */}
                        <td className="py-3 px-2 text-center">
                          {card.claimedMeals?.pagi?.claimed ? (
                            <span className="inline-flex items-center space-x-0.5 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Sudah</span>
                            </span>
                          ) : (
                            <button
                              onClick={() => onClaimMeal(card.id, 'pagi')}
                              className="px-2 py-0.5 rounded bg-slate-100 hover:bg-emerald-100 text-slate-600 hover:text-emerald-800 text-[10px] font-semibold border border-slate-200 transition-colors"
                            >
                              + Klaim
                            </button>
                          )}
                        </td>

                        <td className="py-3 px-2 text-center">
                          {card.claimedMeals?.siang?.claimed ? (
                            <span className="inline-flex items-center space-x-0.5 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Sudah</span>
                            </span>
                          ) : (
                            <button
                              onClick={() => onClaimMeal(card.id, 'siang')}
                              className="px-2 py-0.5 rounded bg-slate-100 hover:bg-emerald-100 text-slate-600 hover:text-emerald-800 text-[10px] font-semibold border border-slate-200 transition-colors"
                            >
                              + Klaim
                            </button>
                          )}
                        </td>

                        <td className="py-3 px-2 text-center">
                          {card.claimedMeals?.malam?.claimed ? (
                            <span className="inline-flex items-center space-x-0.5 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Sudah</span>
                            </span>
                          ) : (
                            <button
                              onClick={() => onClaimMeal(card.id, 'malam')}
                              className="px-2 py-0.5 rounded bg-slate-100 hover:bg-emerald-100 text-slate-600 hover:text-emerald-800 text-[10px] font-semibold border border-slate-200 transition-colors"
                            >
                              + Klaim
                            </button>
                          )}
                        </td>

                        {/* Aksi */}
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              onClick={() => onOpenDigitalQrModal(card)}
                              title="Lihat Kupon QR Digital"
                              className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-[10px] font-bold transition-colors"
                            >
                              <Smartphone className="w-3 h-3" />
                              <span>QR Digital</span>
                            </button>

                            <button
                              onClick={() => onOpenPrintModal(card.id)}
                              title="Cetak ID Card Fisik"
                              className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200 transition-colors"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: MASTER ALOKASI PIC & JADWAL KEHADIRAN (EXISTING TABLE) */}
      {subTab === 'master_pic' && (
        <div className="space-y-4">
          {/* Informative notice on voucher scheme */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-start space-x-3 text-xs text-amber-900">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Ketentuan Konsumsi H-2, H-1 &amp; H+1 vs Hari H:</span>
              <p className="text-[11px] text-amber-800 mt-0.5">
                Pada hari <strong>H-2, H-1, dan H+1 tidak ada pembagian paket menu makanan</strong> di pos konsumsi karena seluruhnya menggunakan <strong>Skema Kupon Voucher Makan Mandiri</strong> ke merchant rekanan. Distribusi menu makanan catering terjadwal (Pagi, Siang, Snack, Malam) hanya berlangsung pada <strong>Hari H</strong>.
              </p>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Cari nama, PIC, divisi, kontak WA..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-600"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <select
                value={kategoriFilter}
                onChange={(e) => setKategoriFilter(e.target.value as any)}
                className="px-3 py-2 border border-slate-200 rounded-xl text-slate-700 bg-white font-medium"
              >
                <option value="all">Semua Kategori ({cards.length})</option>
                <option value="Internal">Internal Saja</option>
                <option value="Mobile">Mobile Taskforce</option>
                <option value="Eksternal">Eksternal</option>
              </select>

              <select
                value={dayAttendanceFilter}
                onChange={(e) => setDayAttendanceFilter(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-xl text-slate-700 bg-white font-medium"
              >
                <option value="all">Semua Sesi Kehadiran</option>
                <option value="siangH2">Hadir Siang H-2</option>
                <option value="siangH1">Hadir Siang H-1</option>
                <option value="malamH1">Hadir Malam H-1</option>
                <option value="pagiH">Hadir Pagi Hari H</option>
                <option value="siangH">Hadir Siang Hari H</option>
                <option value="malamH">Hadir Malam Hari H</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-3 w-12 text-center">No</th>
                    <th className="py-3 px-3">Nama / Entitas</th>
                    <th className="py-3 px-3">PIC Lapangan</th>
                    <th className="py-3 px-3">PIC Pengambil &amp; WA</th>
                    <th className="py-3 px-2 text-center">Qty</th>
                    <th className="py-3 px-2 text-center">
                      <span>Siang H-2</span>
                      <span className="block text-[9px] font-normal text-amber-600">Voucher</span>
                    </th>
                    <th className="py-3 px-2 text-center">
                      <span>Siang H-1</span>
                      <span className="block text-[9px] font-normal text-amber-600">Voucher</span>
                    </th>
                    <th className="py-3 px-2 text-center">
                      <span>Malam H-1</span>
                      <span className="block text-[9px] font-normal text-amber-600">Voucher</span>
                    </th>
                    <th className="py-3 px-2 text-center">Pagi H</th>
                    <th className="py-3 px-2 text-center">Siang H</th>
                    <th className="py-3 px-2 text-center">Malam H</th>
                    <th className="py-3 px-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredCards.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="py-8 text-center text-slate-400">
                        Tidak ada data yang cocok dengan kriteria pencarian.
                      </td>
                    </tr>
                  ) : (
                    filteredCards.map((row) => (
                      <tr key={row.no} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2.5 px-3 text-center font-mono text-slate-400 text-[11px]">
                          {row.no}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-900">{row.name}</div>
                          <div className="text-[10px] text-slate-400">{row.employee}</div>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-slate-800">{row.picHbd}</div>
                          <div className="text-[10px] text-slate-400">{row.areaKerja}</div>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-medium text-slate-800">
                            {row.picPengambil || '-'}
                          </div>
                          {row.kontakWa && (
                            <div className="text-[10px] font-mono text-slate-500">
                              {row.kontakWa}
                            </div>
                          )}
                        </td>
                        <td className="py-2.5 px-2 text-center font-bold text-slate-800">
                          {row.qty}
                        </td>
                        
                        {/* Attendance Pills */}
                        <td className="py-2.5 px-2 text-center">
                          <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            isHadir(row.siangH2) ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-400'
                          }`}>
                            {isHadir(row.siangH2) ? '✓' : '-'}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            isHadir(row.siangH1) ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-400'
                          }`}>
                            {isHadir(row.siangH1) ? '✓' : '-'}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            isHadir(row.malamH1) ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-400'
                          }`}>
                            {isHadir(row.malamH1) ? '✓' : '-'}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            isHadir(row.pagiH) ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-400'
                          }`}>
                            {isHadir(row.pagiH) ? '✓' : '-'}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            isHadir(row.siangH) ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-400'
                          }`}>
                            {isHadir(row.siangH) ? '✓' : '-'}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            isHadir(row.malamH) ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-400'
                          }`}>
                            {isHadir(row.malamH) ? '✓' : '-'}
                          </span>
                        </td>

                        <td className="py-2.5 px-3 text-right">
                          {row.kontakWa && (
                            <button
                              onClick={() => openWa(row.kontakWa, row.name)}
                              title="Chat PIC via WhatsApp"
                              className="inline-flex items-center space-x-1 px-2 py-1 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-[10px] font-semibold transition-colors"
                            >
                              <MessageSquare className="w-3 h-3" />
                              <span>WA</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
