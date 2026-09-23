import React, { useEffect, useRef, useState } from 'react';
import JsBarcode from 'jsbarcode';
import { 
  Printer, 
  X, 
  MessageSquare, 
  QrCode, 
  Barcode as BarcodeIcon, 
  Building, 
  Clock, 
  CheckCircle2,
  Users
} from 'lucide-react';
import { generateQrDataUrl } from '../utils/barcodeUtils';
import { MealTimeSlot } from '../types';

interface BarcodeCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  barcodeData: {
    groupName: string;
    picName: string;
    picPhone: string;
    slotLabel: string;
    menu: string;
    qty: number;
    barcodeCode: string;
    status: string;
    category?: string;
    members?: string;
  } | null;
}

export const BarcodeCardModal: React.FC<BarcodeCardModalProps> = ({
  isOpen,
  onClose,
  barcodeData
}) => {
  const barcodeSvgRef = useRef<SVGSVGElement | null>(null);
  const [qrUrl, setQrUrl] = useState<string>('');

  useEffect(() => {
    if (isOpen && barcodeData) {
      // 1. Generate 1D Barcode with JsBarcode
      if (barcodeSvgRef.current) {
        try {
          JsBarcode(barcodeSvgRef.current, barcodeData.barcodeCode, {
            format: 'CODE128',
            width: 1.8,
            height: 48,
            displayValue: true,
            fontSize: 13,
            font: 'monospace',
            textMargin: 4,
            margin: 6,
            background: '#ffffff',
            lineColor: '#0f172a',
          });
        } catch (e) {
          console.error('Error generating 1D barcode', e);
        }
      }

      // 2. Generate 2D QR Code
      generateQrDataUrl(barcodeData.barcodeCode).then((url) => {
        setQrUrl(url);
      });
    }
  }, [isOpen, barcodeData]);

  if (!isOpen || !barcodeData) return null;

  const handlePrint = () => {
    window.print();
  };

  const shareToWa = () => {
    const cleanPhone = barcodeData.picPhone.startsWith('0') 
      ? '62' + barcodeData.picPhone.slice(1) 
      : barcodeData.picPhone.startsWith('8') 
      ? '62' + barcodeData.picPhone 
      : barcodeData.picPhone;

    const msg = encodeURIComponent(
      `*KARTU BARCODE KONSUMSI HBD*\n\n` +
      `Kepada: *${barcodeData.groupName}*\n` +
      `PIC: *${barcodeData.picName}*\n` +
      `Sesi: *${barcodeData.slotLabel}*\n` +
      `Menu: *${barcodeData.menu}* (${barcodeData.qty} Porsi)\n` +
      `Kode Barcode: *${barcodeData.barcodeCode}*\n\n` +
      `Tunjukkan kartu/kode barcode ini ke petugas Divisi Konsumsi HBD di meja pos konsumsi untuk verifikasi scan barcode pengambilan. Terima kasih!`
    );

    window.open(`https://wa.me/${cleanPhone}?text=${msg}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Controls */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <BarcodeIcon className="w-5 h-5 text-red-600" />
            <h3 className="font-bold text-sm text-slate-900">
              Kupon &amp; Kartu Barcode Konsumsi
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Ticket Area */}
        <div 
          id="printable-barcode-card"
          className="mt-4 bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl p-4 sm:p-5 text-center relative overflow-hidden"
        >
          {/* Badge Header */}
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200/80 pb-2 mb-3">
            <span>HBD - POS KONSUMSI</span>
            <span className="px-2 py-0.5 rounded bg-red-600 text-white">
              {barcodeData.category || 'RESMI'}
            </span>
          </div>

          <h3 className="text-lg font-black text-slate-900 leading-tight">
            {barcodeData.groupName}
          </h3>

          <div className="mt-1 text-xs text-slate-600 flex items-center justify-center space-x-2">
            <span>PIC: <strong>{barcodeData.picName}</strong></span>
            {barcodeData.picPhone && <span>&bull; {barcodeData.picPhone}</span>}
          </div>

          {barcodeData.members && (
            <div className="mt-2 bg-blue-50/80 border border-blue-200/80 rounded-lg p-2 text-left text-[11px] text-blue-900">
              <div className="flex items-center space-x-1 font-bold text-blue-800 mb-0.5">
                <Users className="w-3.5 h-3.5 text-blue-600" />
                <span>Anggota Makan Diambil PIC:</span>
              </div>
              <div className="text-slate-700 leading-tight">
                {barcodeData.members}
              </div>
            </div>
          )}

          <div className="my-3 bg-white p-2.5 rounded-xl border border-slate-200 inline-block w-full text-left">
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Sesi Waktu:</span>
              <strong className="text-red-700">{barcodeData.slotLabel}</strong>
            </div>
            <div className="flex justify-between text-xs mt-1">
              <span className="text-slate-500">Jatah Menu:</span>
              <strong className="text-slate-800">{barcodeData.menu}</strong>
            </div>
            <div className="flex justify-between text-xs mt-1 pt-1 border-t border-slate-100">
              <span className="text-slate-600 font-semibold">Alokasi Porsi:</span>
              <span className="text-base font-black text-red-600">
                {barcodeData.qty} Porsi
              </span>
            </div>
          </div>

          {/* 1D Barcode */}
          <div className="bg-white p-2 rounded-xl border border-slate-200 flex flex-col items-center justify-center">
            <svg ref={barcodeSvgRef} className="max-w-full h-auto"></svg>
          </div>

          {/* 2D QR Code side by side text */}
          {qrUrl && (
            <div className="mt-3 flex items-center justify-center space-x-3 bg-white p-2 rounded-xl border border-slate-200">
              <img 
                src={qrUrl} 
                alt="QR Code" 
                className="w-20 h-20 rounded-md"
                referrerPolicy="no-referrer"
              />
              <div className="text-left text-[11px] text-slate-600 space-y-0.5">
                <div className="font-bold text-slate-800 flex items-center space-x-1">
                  <QrCode className="w-3.5 h-3.5 text-slate-700" />
                  <span>Scan QR / Barcode</span>
                </div>
                <p className="text-slate-500">
                  Scan di pos konsumsi untuk langsung menyelesaikan pengambilan tanpa antre.
                </p>
                <div className="font-mono text-[10px] text-slate-400">
                  {barcodeData.barcodeCode}
                </div>
              </div>
            </div>
          )}

          {/* Status stamp */}
          <div className="mt-3 text-[11px] font-semibold text-slate-500">
            Status:{' '}
            <span className={`inline-block px-2 py-0.5 rounded-full ${
              barcodeData.status === 'completed' || barcodeData.status === 'claimed'
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-amber-100 text-amber-800'
            }`}>
              {barcodeData.status === 'completed' || barcodeData.status === 'claimed'
                ? 'Sudah Diambil'
                : 'Menunggu Pengambilan'}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-4 flex items-center justify-between gap-2">
          {barcodeData.picPhone ? (
            <button
              onClick={shareToWa}
              className="flex-1 inline-flex items-center justify-center space-x-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Kirim ke WhatsApp PIC</span>
            </button>
          ) : (
            <div></div>
          )}

          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Kupon</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
