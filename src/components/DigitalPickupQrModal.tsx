import React, { useEffect, useRef, useState } from 'react';
import JsBarcode from 'jsbarcode';
import { 
  Printer, 
  X, 
  Download, 
  Share2, 
  CheckCircle2, 
  Smartphone, 
  QrCode, 
  ShieldCheck, 
  Utensils, 
  AlertCircle,
  Copy,
  Check,
  RotateCcw
} from 'lucide-react';
import { IDCardKonsumsi, MealTimeSlot } from '../types';
import { generateQrDataUrl } from '../utils/barcodeUtils';

interface DigitalPickupQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  card: IDCardKonsumsi | null;
  onClaimMeal?: (cardId: string, meal: 'pagi' | 'siang' | 'malam') => void;
  onResetActivation?: (cardId: string) => void;
}

export const DigitalPickupQrModal: React.FC<DigitalPickupQrModalProps> = ({
  isOpen,
  onClose,
  card,
  onClaimMeal,
  onResetActivation,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const barcodeSvgRef = useRef<SVGSVGElement | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && card) {
      // Generate QR Code for pickup
      generateQrDataUrl(card.pickupCode).then((url) => {
        setQrDataUrl(url);
      });

      // Generate 1D barcode
      if (barcodeSvgRef.current) {
        try {
          JsBarcode(barcodeSvgRef.current, card.pickupCode, {
            format: 'CODE128',
            width: 1.8,
            height: 48,
            displayValue: true,
            fontSize: 13,
            lineColor: '#0f172a',
          });
        } catch (e) {
          console.error('Barcode render error', e);
        }
      }
    }
  }, [isOpen, card]);

  if (!isOpen || !card) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `QR_Pengambilan_${card.id}_${(card.holderName || 'Panitia').replace(/\s+/g, '_')}.png`;
    a.click();
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(card.pickupCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareWa = () => {
    const text = encodeURIComponent(
      `*QR PENGAMBILAN KONSUMSI HBD 2026*\n` +
      `👤 Nama: ${card.holderName || '-'}\n` +
      `🏢 Area Kerja: ${card.areaKerja || '-'}\n` +
      `📧 Email: ${card.holderEmail || '-'}\n` +
      `🆔 ID Card: ${card.id} (${card.cardCode})\n` +
      `🔑 Kode Pengambilan: ${card.pickupCode}\n\n` +
      `Tunjukkan kode/QR ini di Pos Konsumsi saat mengambil jatah makan Pagi, Siang, atau Malam.`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
      id="modal-digital-pickup-qr"
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-4 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
              <QrCode className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-sm">QR Pengambilan Konsumsi Digital</h3>
                <span className="bg-emerald-800/60 text-emerald-100 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-emerald-400/30">
                  Aktif
                </span>
              </div>
              <p className="text-[11px] text-emerald-100">
                Alternatif Resmi Pengganti ID Card Fisik yang Hilang
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4">
          {/* Info Card / Badge Simulation */}
          <div className="bg-gradient-to-b from-slate-50 to-slate-100/80 rounded-xl border border-slate-200 p-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5 mb-3">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  ID CARD KONSUMSI HBD
                </span>
                <div className="text-base font-black text-slate-900">
                  {card.holderName || 'Panitia HBD'}
                </div>
              </div>
              <div className="text-right">
                <span className="font-mono text-xs font-bold px-2 py-1 rounded bg-slate-900 text-white">
                  {card.id}
                </span>
                <div className="text-[10px] text-slate-500 mt-0.5">{card.kategori || 'Panitia'}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs mb-3">
              <div>
                <span className="text-[10px] text-slate-400 block">Email Terdaftar:</span>
                <span className="font-medium text-slate-800 break-all text-[11px]">
                  {card.holderEmail || '-'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Area Kerja:</span>
                <span className="font-bold text-slate-800 text-[11px]">{card.areaKerja || '-'}</span>
              </div>
            </div>

            {/* QR Code Presentation */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 text-center my-2 shadow-inner">
              <div className="flex justify-center">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt="QR Pengambilan Konsumsi"
                    className="w-48 h-48 mx-auto rounded-lg border border-slate-100 p-1"
                  />
                ) : (
                  <div className="w-48 h-48 flex items-center justify-center text-xs text-slate-400">
                    Membuat QR Code...
                  </div>
                )}
              </div>

              {/* 1D Barcode code */}
              <div className="flex justify-center mt-2 overflow-x-auto">
                <svg ref={barcodeSvgRef} className="max-w-full h-12"></svg>
              </div>

              <div className="mt-2 flex items-center justify-center space-x-1.5 text-xs text-slate-600 font-mono">
                <span className="font-bold">{card.pickupCode}</span>
                <button
                  onClick={handleCopyCode}
                  title="Salin kode"
                  className="text-slate-400 hover:text-slate-700"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Notice */}
            <div className="bg-emerald-50 rounded-lg p-2.5 border border-emerald-200 flex items-start space-x-2 text-xs text-emerald-900 mt-3">
              <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold">Simpan QR ini di HP Anda:</strong>
                <p className="text-[11px] text-emerald-800 mt-0.5 leading-relaxed">
                  Jika ID Card fisik konsumsi Anda hilang, tunjukkan QR di layar ponsel ini kepada petugas di Pos Konsumsi untuk scan jatah makan.
                </p>
              </div>
            </div>
          </div>

          {/* Hari H Meal Status Checklist */}
          <div className="bg-white rounded-xl border border-slate-200 p-3 text-xs">
            <div className="font-bold text-slate-800 mb-2 flex items-center justify-between">
              <span className="flex items-center space-x-1.5">
                <Utensils className="w-3.5 h-3.5 text-red-600" />
                <span>Status Jatah Konsumsi Hari H:</span>
              </span>
              <span className="text-[10px] text-slate-400 font-normal">Pos Pemeriksaan</span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              {/* Pagi */}
              <div
                className={`p-2 rounded-lg border ${
                  card.claimedMeals?.pagi?.claimed
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                <div className="text-[10px] font-semibold text-slate-500">06.30 Pagi</div>
                <div className="text-xs font-bold mt-0.5">
                  {card.claimedMeals?.pagi?.claimed ? 'Sudah Diambil' : 'Belum'}
                </div>
                {card.claimedMeals?.pagi?.claimedAt && (
                  <div className="text-[9px] text-emerald-700 mt-0.5">
                    {card.claimedMeals.pagi.claimedAt}
                  </div>
                )}
                {onClaimMeal && !card.claimedMeals?.pagi?.claimed && (
                  <button
                    onClick={() => onClaimMeal(card.id, 'pagi')}
                    className="mt-1.5 w-full py-0.5 rounded bg-emerald-600 text-white text-[10px] font-bold hover:bg-emerald-700"
                  >
                    Klaim Pagi
                  </button>
                )}
              </div>

              {/* Siang */}
              <div
                className={`p-2 rounded-lg border ${
                  card.claimedMeals?.siang?.claimed
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                <div className="text-[10px] font-semibold text-slate-500">11.30 Siang</div>
                <div className="text-xs font-bold mt-0.5">
                  {card.claimedMeals?.siang?.claimed ? 'Sudah Diambil' : 'Belum'}
                </div>
                {card.claimedMeals?.siang?.claimedAt && (
                  <div className="text-[9px] text-emerald-700 mt-0.5">
                    {card.claimedMeals.siang.claimedAt}
                  </div>
                )}
                {onClaimMeal && !card.claimedMeals?.siang?.claimed && (
                  <button
                    onClick={() => onClaimMeal(card.id, 'siang')}
                    className="mt-1.5 w-full py-0.5 rounded bg-emerald-600 text-white text-[10px] font-bold hover:bg-emerald-700"
                  >
                    Klaim Siang
                  </button>
                )}
              </div>

              {/* Malam */}
              <div
                className={`p-2 rounded-lg border ${
                  card.claimedMeals?.malam?.claimed
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                <div className="text-[10px] font-semibold text-slate-500">17.30 Malam</div>
                <div className="text-xs font-bold mt-0.5">
                  {card.claimedMeals?.malam?.claimed ? 'Sudah Diambil' : 'Belum'}
                </div>
                {card.claimedMeals?.malam?.claimedAt && (
                  <div className="text-[9px] text-emerald-700 mt-0.5">
                    {card.claimedMeals.malam.claimedAt}
                  </div>
                )}
                {onClaimMeal && !card.claimedMeals?.malam?.claimed && (
                  <button
                    onClick={() => onClaimMeal(card.id, 'malam')}
                    className="mt-1.5 w-full py-0.5 rounded bg-emerald-600 text-white text-[10px] font-bold hover:bg-emerald-700"
                  >
                    Klaim Malam
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 border-t border-slate-200 p-3.5 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={handleDownloadQr}
              className="inline-flex items-center space-x-1 px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Simpan QR</span>
            </button>

            <button
              onClick={handleShareWa}
              className="inline-flex items-center space-x-1 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-800 hover:bg-emerald-100 text-xs font-semibold shadow-2xs"
            >
              <Share2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Kirim WhatsApp</span>
            </button>

            <button
              onClick={handlePrint}
              className="inline-flex items-center space-x-1 px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak</span>
            </button>

            {onResetActivation && (
              <button
                onClick={() => {
                  const confirmed = window.confirm(
                    `Hapus / batalkan data aktivasi untuk ${card.id} (${card.holderName || 'Panitia'})?\n\n` +
                    `Kartu akan dikembalikan ke status "Belum Diaktivasi" dan dapat diaktivasi ulang.`
                  );
                  if (confirmed) {
                    onResetActivation(card.id);
                    onClose();
                  }
                }}
                className="inline-flex items-center space-x-1 px-3 py-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 text-xs font-semibold shadow-2xs transition-colors"
                title="Batalkan aktivasi kartu ini"
              >
                <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                <span>Reset Aktivasi</span>
              </button>
            )}
          </div>

          <button
            onClick={onClose}
            className="inline-flex items-center space-x-1 px-4 py-2 rounded-lg bg-slate-900 hover:bg-black text-white text-xs font-bold shadow-xs transition-colors ml-auto"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Selesai</span>
          </button>
        </div>
      </div>
    </div>
  );
};
