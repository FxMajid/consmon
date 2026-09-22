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
  Filter
} from 'lucide-react';

interface KartuAksesTableProps {
  cards: IndividualAccessCard[];
  idCards: IDCardKonsumsi[];
  onOpenActivationModal: (card?: IDCardKonsumsi) => void;
  onOpenDigitalQrModal: (card: IDCardKonsumsi) => void;
  onOpenPrintModal: (cardId?: string) => void;
  onOpenStaticQrModal?: () => void;
  onOpenScanner: () => void;
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
  onClaimMeal,
}) => {
  const [subTab, setSubTab] = useState<'id_cards' | 'master_pic'>('id_cards');

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
    return { total, active, unactivated };
  }, [idCards]);

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
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setSubTab('id_cards')}
          className={`inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-colors ${
            subTab === 'id_cards'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Aktivasi &amp; Cetak ID Card Konsumsi ({idCardStats.total})</span>
        </button>

        <button
          onClick={() => setSubTab('master_pic')}
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
                          <div className="text-xs font-medium text-blue-700">{card.areaKerja}</div>
                          <div className="text-[11px] text-slate-500 font-mono">{card.holderEmail}</div>
                        </div>
                      ) : (
                        <div className="py-2 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                          <QrCode className="w-6 h-6 mx-auto text-slate-300 mb-1" />
                          <div className="text-xs font-semibold text-slate-600">ID Card Siap Diaktivasi</div>
                          <div className="text-[10px] text-slate-400">Scan QR fisik atau klik aktivasi manual</div>
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

      {/* VIEW 2: MASTER ALOKASI PIC & JADWAL KEHADIRAN (EXISTING TABLE) */}
      {subTab === 'master_pic' && (
        <div className="space-y-4">
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
                    <th className="py-3 px-2 text-center">Siang H-2</th>
                    <th className="py-3 px-2 text-center">Siang H-1</th>
                    <th className="py-3 px-2 text-center">Malam H-1</th>
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
