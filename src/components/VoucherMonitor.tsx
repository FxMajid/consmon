import React, { useState, useMemo } from 'react';
import { VoucherDistributionItem } from '../types';
import { 
  Ticket, 
  CheckCircle2, 
  Clock, 
  Search, 
  MessageSquare, 
  AlertCircle, 
  Receipt, 
  CreditCard,
  Building,
  CheckCheck,
  Scan,
  QrCode
} from 'lucide-react';
import { getBarcodeForVoucher } from '../utils/barcodeUtils';

interface VoucherMonitorProps {
  vouchers: VoucherDistributionItem[];
  onToggleVoucherStatus: (id: string, currentStatus: string) => void;
  onBatchClaimDay: (day: 'H-2' | 'H-1') => void;
  onOpenScanner: () => void;
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

export const VoucherMonitor: React.FC<VoucherMonitorProps> = ({
  vouchers,
  onToggleVoucherStatus,
  onBatchClaimDay,
  onOpenScanner,
  onOpenBarcodeCard
}) => {
  const [selectedDay, setSelectedDay] = useState<'H-2' | 'H-1' | 'all'>('H-1');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'claimed'>('all');

  const filteredVouchers = useMemo(() => {
    return vouchers.filter((v) => {
      if (selectedDay !== 'all' && v.day !== selectedDay) {
        return false;
      }
      if (statusFilter !== 'all' && v.status !== statusFilter) {
        return false;
      }
      const matchesSearch =
        v.groupName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.picName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.menuVendor.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.voucherCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.picPhone.includes(searchQuery);

      return matchesSearch;
    });
  }, [vouchers, selectedDay, statusFilter, searchQuery]);

  // Summary statistics for vouchers
  const stats = useMemo(() => {
    const list = selectedDay === 'all' 
      ? vouchers 
      : vouchers.filter((v) => v.day === selectedDay);

    const totalPax = list.reduce((acc, curr) => acc + (curr.mealType !== 'Minuman' ? curr.qty : 0), 0);
    const claimedPax = list.reduce((acc, curr) => 
      curr.status === 'claimed' && curr.mealType !== 'Minuman' ? acc + curr.qty : acc, 0);

    const totalAmount = list.reduce((acc, curr) => acc + curr.totalPrice, 0);
    const claimedAmount = list.reduce((acc, curr) => 
      curr.status === 'claimed' ? acc + curr.totalPrice : acc, 0);

    return {
      totalPax,
      claimedPax,
      pendingPax: totalPax - claimedPax,
      totalAmount,
      claimedAmount,
      pctPax: totalPax > 0 ? Math.round((claimedPax / totalPax) * 100) : 0,
    };
  }, [vouchers, selectedDay]);

  const sendVoucherWaReminder = (v: VoucherDistributionItem) => {
    const cleanPhone = v.picPhone.startsWith('0') 
      ? '62' + v.picPhone.slice(1) 
      : v.picPhone.startsWith('8') 
      ? '62' + v.picPhone 
      : v.picPhone;

    const msg = encodeURIComponent(
      `Halo Kak/Bpk/Ibu *${v.picName}* (${v.groupName}),\n\n` +
      `Info dari *Divisi Konsumsi HBD*:\n` +
      `Voucher konsumsi *${v.day}* (${v.mealType}) untuk kelompok Anda sudah siap diserahkan.\n` +
      `- Alokasi: *${v.qty} Lembar Voucher / Pax*\n` +
      `- Menu / Vendor: *${v.menuVendor}*\n` +
      `- Estimasi Nilai: *Rp ${v.totalPrice.toLocaleString('id-ID')}*\n` +
      `- Kode Voucher: ${v.voucherCode || 'Tersedia di meja panitia'}\n\n` +
      `Silakan ambil dan tandatangani tanda terima di Pos Konsumsi HBD. Terima kasih!`
    );

    window.open(`https://wa.me/${cleanPhone}?text=${msg}`, '_blank');
  };

  return (
    <div className="space-y-6" id="voucher-monitor-section">
      {/* Informative Banner */}
      <div className="bg-gradient-to-r from-amber-700 via-amber-600 to-yellow-600 rounded-2xl p-5 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 rounded bg-white/20 text-white text-xs font-semibold uppercase tracking-wide">
              Sistem Voucher H-2 &amp; H-1
            </span>
            <span className="text-amber-100 text-xs">Penukaran &amp; Klaim Vendor</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black mt-1 tracking-tight">
            Monitoring Penyerahan &amp; Klaim Voucher
          </h2>
          <p className="text-xs sm:text-sm text-amber-100 mt-1 max-w-2xl">
            Sistem konsumsi masa persiapan (Loading &amp; Gladi Bersih) menggunakan mekanisme <strong>Tukar Voucher</strong> ke merchant rekanan (Ladas, Puti Minang, Bebek Belur, dll).
          </p>
        </div>

        {/* Global summary stats */}
        <div className="bg-white/10 backdrop-blur-xs rounded-xl p-3 sm:px-4 border border-white/20 flex items-center space-x-4 min-w-[220px]">
          <div>
            <div className="text-[11px] text-amber-100 font-medium">Total Voucher</div>
            <div className="text-2xl font-black text-white">{stats.totalPax} pax</div>
          </div>
          <div className="h-9 w-px bg-white/20"></div>
          <div>
            <div className="text-[11px] text-emerald-200 font-medium">Sudah Diserahkan</div>
            <div className="text-2xl font-black text-emerald-200">{stats.claimedPax} pax</div>
          </div>
          <div className="h-9 w-px bg-white/20"></div>
          <div>
            <div className="text-[11px] text-amber-200 font-medium">Total Nilai</div>
            <div className="text-sm font-black text-white">
              Rp {(stats.totalAmount / 1000).toLocaleString('id-ID')}k
            </div>
          </div>
        </div>
      </div>

      {/* Day Selector Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setSelectedDay('H-2')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              selectedDay === 'H-2'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Ticket className="w-3.5 h-3.5" />
            <span>Hari H-2 (Loading Awal)</span>
            <span className={`px-1.5 py-0.2 rounded text-[10px] ${selectedDay === 'H-2' ? 'bg-amber-700 text-white' : 'bg-slate-100 text-slate-600'}`}>
              35 Pax (Rp 875k)
            </span>
          </button>

          <button
            onClick={() => setSelectedDay('H-1')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              selectedDay === 'H-1'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Ticket className="w-3.5 h-3.5" />
            <span>Hari H-1 (Loading &amp; Gladi)</span>
            <span className={`px-1.5 py-0.2 rounded text-[10px] ${selectedDay === 'H-1' ? 'bg-amber-700 text-white' : 'bg-slate-100 text-slate-600'}`}>
              255 Pax (Rp 7,09jt)
            </span>
          </button>

          <button
            onClick={() => setSelectedDay('all')}
            className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
              selectedDay === 'all'
                ? 'bg-slate-800 text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Semua Voucher
          </button>
        </div>

        {/* Batch complete day */}
        {selectedDay !== 'all' && (
          <button
            onClick={() => {
              if (window.confirm(`Tandai semua voucher untuk ${selectedDay} sebagai 'Sudah Diserahkan'?`)) {
                onBatchClaimDay(selectedDay);
              }
            }}
            className="inline-flex items-center space-x-1 px-3 py-2 text-xs font-semibold text-amber-900 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-200 transition-colors"
          >
            <CheckCheck className="w-4 h-4 text-amber-700" />
            <span>Serahkan Semua Voucher {selectedDay}</span>
          </button>
        )}
      </div>

      {/* Context explainer card */}
      <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3.5 text-xs text-amber-900 flex items-start space-x-3">
        <Receipt className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold">Ketentuan Penukaran Voucher {selectedDay !== 'all' ? selectedDay : 'H-2 & H-1'}:</p>
          <p className="text-[11px] text-amber-800 leading-relaxed">
            {selectedDay === 'H-2' ? (
              <span>• Nominal voucher klaim makan: <strong>Rp 25.000 / orang</strong> untuk 30 Panitia MD dan 5 orang OB di venue. Rekanan: Bebek Belur, Bu Ani, Ladas, Puti Minang.</span>
            ) : selectedDay === 'H-1' ? (
              <span>• Siang H-1: Nasi Ladas (Rp 29.500) untuk Panitia MD &amp; Buffer (85 pax), Puti Minang (Rp 22.000) untuk Team SNR (15 pax).<br />• Malam H-1: Nasi Padang Puti Minang (Rp 22.000) untuk seluruh 155 pax (MD, Community, Ronald, SNR, OB, Buffer).</span>
            ) : (
              <span>• Pastikan setiap PIC menandatangani bukti serah terima kupon voucher sebelum dibagikan ke anggota masing-masing.</span>
            )}
          </p>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama kelompok, PIC, vendor, atau kode voucher..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-amber-500 bg-slate-50/50"
          />
        </div>

        <div className="flex items-center space-x-2 text-xs flex-wrap gap-y-2">
          <button
            onClick={onOpenScanner}
            className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold transition-colors shadow-2xs"
            title="Scan Barcode Kupon Voucher"
          >
            <Scan className="w-3.5 h-3.5" />
            <span>Scan Voucher</span>
          </button>

          <span className="text-slate-500 font-medium">Status:</span>
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
              statusFilter === 'all' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Semua
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
              statusFilter === 'pending' ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Belum Diserahkan
          </button>
          <button
            onClick={() => setStatusFilter('claimed')}
            className={`px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
              statusFilter === 'claimed' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Sudah Diserahkan
          </button>
        </div>
      </div>

      {/* Voucher Records List */}
      <div className="space-y-3" id="voucher-records-list">
        {filteredVouchers.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500">
            <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="font-semibold text-slate-700">Tidak ada voucher yang sesuai kriteria</p>
          </div>
        ) : (
          filteredVouchers.map((item) => {
            const isClaimed = item.status === 'claimed';

            return (
              <div
                key={item.id}
                className={`bg-white rounded-xl border transition-all p-4 shadow-2xs ${
                  isClaimed 
                    ? 'border-emerald-200 bg-emerald-50/15' 
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Left info */}
                  <div className="flex items-start space-x-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      isClaimed ? 'bg-emerald-600 text-white' : 'bg-amber-100 text-amber-800'
                    }`}>
                      <Ticket className="w-5 h-5" />
                    </div>

                    <div>
                      <div className="flex items-center flex-wrap gap-2">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-white">
                          {item.day}
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                          {item.mealType}
                        </span>
                        <h4 className="font-bold text-sm text-slate-900">
                          {item.groupName}
                        </h4>
                        {isClaimed ? (
                          <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Voucher Diserahkan</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                            Menunggu Pengambilan
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span>
                          PIC Tukar: <strong className="text-slate-800 font-semibold">{item.picName}</strong>
                        </span>
                        {item.picPhone && (
                          <span className="font-mono text-[11px] text-slate-600">
                            WA: {item.picPhone}
                          </span>
                        )}
                        {item.voucherCode && (
                          <span className="font-mono text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                            {item.voucherCode}
                          </span>
                        )}
                      </div>

                      {item.notes && (
                        <div className="text-[11px] text-slate-400 mt-1 italic">
                          {item.notes}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Middle voucher value */}
                  <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-200/80 sm:min-w-[220px]">
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                      Vendor &amp; Nilai Klaim:
                    </div>
                    <div className="text-xs font-bold text-slate-800 mt-0.5">
                      {item.menuVendor}
                    </div>
                    <div className="flex items-baseline justify-between mt-1 pt-1 border-t border-slate-200/60 text-xs">
                      <span className="font-medium text-slate-600">
                        {item.qty} {item.mealType !== 'Minuman' ? 'Pax' : 'Paket'}
                      </span>
                      <span className="font-black text-amber-700">
                        Rp {item.totalPrice.toLocaleString('id-ID')}
                      </span>
                    </div>
                    {item.claimedAt && (
                      <div className="text-[10px] text-emerald-700 font-medium mt-1">
                        Diserahkan: {item.claimedAt} {item.receiverName ? `(${item.receiverName})` : ''}
                      </div>
                    )}
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center space-x-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    {/* Kupon / Barcode Card Button */}
                    <button
                      onClick={() =>
                        onOpenBarcodeCard({
                          groupName: item.groupName,
                          picName: item.picName,
                          picPhone: item.picPhone,
                          slotLabel: `Voucher ${item.day} - ${item.mealType}`,
                          menu: `${item.menuVendor} (${item.qty} pax)`,
                          qty: item.qty,
                          barcodeCode: getBarcodeForVoucher(item.id, item.voucherCode),
                          status: item.status,
                          category: item.day,
                        })
                      }
                      title="Lihat & Cetak Kupon Barcode Voucher"
                      className="inline-flex items-center space-x-1 px-2.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors"
                    >
                      <QrCode className="w-3.5 h-3.5 text-slate-600" />
                      <span className="hidden sm:inline">Kupon Barcode</span>
                    </button>

                    {!isClaimed && item.picPhone && (
                      <button
                        onClick={() => sendVoucherWaReminder(item)}
                        title="Kirim pengingat WhatsApp ke PIC"
                        className="inline-flex items-center space-x-1 px-3 py-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold border border-emerald-200 transition-colors"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">WhatsApp PIC</span>
                      </button>
                    )}

                    <button
                      onClick={() => onToggleVoucherStatus(item.id, item.status)}
                      className={`inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all shadow-2xs ${
                        isClaimed
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          : 'bg-amber-600 hover:bg-amber-700 text-white'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{isClaimed ? 'Batal Serah' : 'Tandai Diserahkan'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
