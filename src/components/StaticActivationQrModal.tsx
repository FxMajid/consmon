import React, { useEffect, useState } from 'react';
import { 
  X, 
  QrCode, 
  Printer, 
  Download, 
  Copy, 
  Check, 
  Sparkles, 
  Smartphone, 
  ShieldCheck, 
  ExternalLink,
  ArrowRight,
  Utensils
} from 'lucide-react';
import { generateQrDataUrl } from '../utils/barcodeUtils';

interface StaticActivationQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenActivationForm: () => void;
}

export const StaticActivationQrModal: React.FC<StaticActivationQrModalProps> = ({
  isOpen,
  onClose,
  onOpenActivationForm,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  // Static activation payload: can be URL or static activation string
  const staticActivationCode = 'HBD-STATIC-ACTIVATION';
  const activationUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}${window.location.pathname}?aktivasi=true` 
    : 'https://hbd-konsumsi.event/?aktivasi=true';

  useEffect(() => {
    if (isOpen) {
      // Generate QR encoding the activation URL with fallback code
      generateQrDataUrl(activationUrl).then((url) => {
        setQrDataUrl(url);
      });
    }
  }, [isOpen, activationUrl]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = 'QR_STATIS_AKTIVASI_KONSUMSI_HBD.png';
    a.click();
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(activationUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
      id="modal-static-activation-qr"
    >
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 via-rose-700 to-slate-900 p-4 sm:p-5 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center shadow-inner">
              <QrCode className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-black text-base tracking-tight">QR Statis Aktivasi ID Card</h3>
                <span className="bg-amber-400 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-full uppercase">
                  Mandiri
                </span>
              </div>
              <p className="text-xs text-rose-100 mt-0.5">
                Scan 1 QR untuk semua panitia &bull; Input 3 Field &bull; Dapatkan QR Pengambilan
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Standee Poster Preview */}
        <div className="p-5 sm:p-6 space-y-5">
          {/* Visual Poster Card (Print-friendly) */}
          <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white rounded-2xl p-5 border-2 border-red-500/50 shadow-xl text-center relative overflow-hidden">
            {/* Top decorative badge */}
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-red-600/90 text-white text-[11px] font-black uppercase tracking-wider mb-2">
              <Utensils className="w-3.5 h-3.5" />
              <span>HONDA BIKERS DAY 2026 &bull; POS KONSUMSI</span>
            </div>

            <h4 className="text-lg font-black tracking-tight text-white uppercase">
              Scan QR Untuk Aktivasi ID Card
            </h4>
            <p className="text-xs text-slate-300 mt-1 max-w-xs mx-auto">
              Arahkan kamera HP Anda ke QR Code di bawah untuk mendaftarkan diri &amp; mendapatkan QR Pengambilan Makan.
            </p>

            {/* The Big High-Quality Static QR Code */}
            <div className="bg-white p-4 rounded-2xl inline-block shadow-2xl my-4 border-4 border-slate-800">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="QR Statis Aktivasi Konsumsi HBD"
                  className="w-48 h-48 sm:w-56 sm:h-56 mx-auto object-contain"
                />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center text-slate-400">
                  <span className="text-xs font-semibold">Memuat QR Code...</span>
                </div>
              )}
              <div className="text-[10px] font-mono font-black text-slate-800 tracking-widest mt-1">
                KODE: {staticActivationCode}
              </div>
            </div>

            {/* 3 Step Instructions */}
            <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700 text-left text-xs space-y-1.5">
              <div className="text-[11px] font-bold text-red-400 uppercase tracking-wider flex items-center space-x-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>3 Langkah Cepat Registrasi Mandiri:</span>
              </div>
              <ol className="space-y-1 text-slate-300 text-[11px] list-decimal list-inside">
                <li>
                  <span className="text-white font-semibold">Scan QR</span> di atas dengan kamera smartphone Anda.
                </li>
                <li>
                  Isi <strong className="text-amber-300">Nama</strong> (teks bebas), pilih <strong className="text-amber-300">Area Kerja</strong> (drop-down), &amp; <strong className="text-amber-300">Email</strong>.
                </li>
                <li>
                  Langsung dapatkan <strong className="text-emerald-400">QR Pengambilan Konsumsi Digital</strong> untuk makan Pagi, Siang &amp; Malam!
                </li>
              </ol>
            </div>
          </div>

          {/* Direct CTA: Simulate Scanning or Open Form */}
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center space-x-3 text-left">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h5 className="font-bold text-slate-900 text-xs sm:text-sm">
                  Simulasikan Sebagai User Yang Scan
                </h5>
                <p className="text-[11px] text-slate-600">
                  Buka formulir aktivasi 3-field (Nama, Area Kerja, Email) sekarang juga.
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                onClose();
                onOpenActivationForm();
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all shrink-0"
            >
              <span>Isi Form 3-Field</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handlePrint}
                className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold border border-slate-200 transition-colors"
              >
                <Printer className="w-3.5 h-3.5 text-slate-600" />
                <span>Cetak Standee Meja</span>
              </button>

              <button
                onClick={handleDownloadQr}
                className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold border border-slate-200 transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-slate-600" />
                <span>Unduh Gambar QR</span>
              </button>

              <button
                onClick={handleCopyLink}
                className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold border border-slate-200 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-600" />}
                <span>{copied ? 'Link Tersalin!' : 'Salin Link'}</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
