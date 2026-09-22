import React, { useState, useEffect } from 'react';
import { 
  Printer, 
  X, 
  QrCode, 
  CheckCircle2, 
  Smartphone, 
  HelpCircle,
  Filter,
  Sparkles
} from 'lucide-react';
import { IDCardKonsumsi } from '../types';
import { generateQrDataUrl } from '../utils/barcodeUtils';

interface PrintableIdCardsModalProps {
  isOpen: boolean;
  onClose: () => void;
  cards: IDCardKonsumsi[];
  selectedCardId?: string;
  onSelectToActivate?: (card: IDCardKonsumsi) => void;
}

export const PrintableIdCardsModal: React.FC<PrintableIdCardsModalProps> = ({
  isOpen,
  onClose,
  cards,
  selectedCardId,
  onSelectToActivate,
}) => {
  const [filterMode, setFilterMode] = useState<'selected' | 'unactivated' | 'all'>('selected');
  const [qrMap, setQrMap] = useState<Record<string, string>>({});
  const [targetCardId, setTargetCardId] = useState<string>(selectedCardId || (cards[0] ? cards[0].id : ''));

  useEffect(() => {
    if (selectedCardId) {
      setTargetCardId(selectedCardId);
      setFilterMode('selected');
    }
  }, [selectedCardId]);

  // Generate QR codes for all relevant cards
  useEffect(() => {
    if (!isOpen) return;

    const cardsToGenerate = cards.slice(0, 40);
    cardsToGenerate.forEach((c) => {
      if (!qrMap[c.id]) {
        generateQrDataUrl(c.activationCode).then((url) => {
          setQrMap((prev) => ({ ...prev, [c.id]: url }));
        });
      }
    });
  }, [isOpen, cards, qrMap]);

  if (!isOpen) return null;

  const displayCards = 
    filterMode === 'selected'
      ? cards.filter((c) => c.id === targetCardId)
      : filterMode === 'unactivated'
      ? cards.filter((c) => c.status === 'unactivated')
      : cards;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4"
      id="modal-printable-id-cards"
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Header - Screen only */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between shrink-0 print:hidden">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center font-bold text-white shadow-xs">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-base">Cetak Fisik ID Card Konsumsi (QR Aktivasi)</h3>
                <span className="bg-red-900/60 text-red-200 text-[10px] font-bold px-2 py-0.5 rounded border border-red-500/30">
                  Badge Cetak
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Kartu fisik dilengkapi QR Aktivasi. Pemegang wajib scan untuk registrasi &amp; dapatkan QR Pengambilan cadangan.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-sm transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Sekarang</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Toolbar - Screen only */}
        <div className="bg-slate-50 border-b border-slate-200 p-3 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0 print:hidden">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-700">Tampilkan:</span>
            <button
              onClick={() => setFilterMode('selected')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                filterMode === 'selected'
                  ? 'bg-slate-900 text-white'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              Kartu Terpilih ({targetCardId})
            </button>
            <button
              onClick={() => setFilterMode('unactivated')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                filterMode === 'unactivated'
                  ? 'bg-slate-900 text-white'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              Semua Belum Diaktivasi ({cards.filter((c) => c.status === 'unactivated').length})
            </button>
            <button
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                filterMode === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              Semua Kartu ({cards.length})
            </button>
          </div>

          {filterMode === 'selected' && (
            <div className="flex items-center space-x-2">
              <span className="text-slate-500">Pilih ID:</span>
              <select
                value={targetCardId}
                onChange={(e) => setTargetCardId(e.target.value)}
                className="px-2.5 py-1 border border-slate-200 rounded-lg bg-white font-mono font-bold text-slate-800"
              >
                {cards.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.id} - {c.status === 'active' ? `[Aktif: ${c.holderName}]` : '[Siap Diaktivasi]'}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Printable Area - Card Grid */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-100/60 print:bg-white print:p-0 print:overflow-visible">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 print:grid-cols-2 print:gap-4 max-w-3xl mx-auto">
            {displayCards.map((card) => {
              const qrUrl = qrMap[card.id];

              return (
                <div
                  key={card.id}
                  className="bg-white rounded-2xl border-2 border-slate-800 shadow-sm overflow-hidden flex flex-col justify-between print:border-2 print:border-black print:rounded-xl print:shadow-none print:break-inside-avoid relative"
                  style={{ minHeight: '380px' }}
                >
                  {/* Card Header */}
                  <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white p-3.5 text-center relative border-b-2 border-slate-900">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black tracking-widest bg-black/25 px-2 py-0.5 rounded text-white uppercase">
                        HONDA BIKERS DAY 2026
                      </span>
                      <span className="text-[11px] font-mono font-black bg-white text-red-700 px-2 py-0.5 rounded shadow-xs">
                        {card.id}
                      </span>
                    </div>
                    <div className="text-base font-black tracking-tight mt-1.5 uppercase">
                      KARTU KONSUMSI PANITIA
                    </div>
                    <div className="text-[10px] text-red-100 font-semibold tracking-wider uppercase">
                      Akses Konsumsi &bull; {card.kategori || 'Internal'}
                    </div>
                  </div>

                  {/* Card Body - Center Activation QR */}
                  <div className="p-4 text-center flex-1 flex flex-col items-center justify-center space-y-2">
                    <div className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 uppercase">
                      <Smartphone className="w-3 h-3 text-amber-700" />
                      <span>PINDAI UNTUK AKTIVASI KARTU</span>
                    </div>

                    {/* QR Display */}
                    <div className="p-2.5 bg-white border-2 border-dashed border-slate-300 rounded-xl shadow-xs">
                      {qrUrl ? (
                        <img
                          src={qrUrl}
                          alt="QR Aktivasi ID Card"
                          className="w-36 h-36 mx-auto"
                        />
                      ) : (
                        <div className="w-36 h-36 flex items-center justify-center text-xs text-slate-400">
                          Memuat QR...
                        </div>
                      )}
                    </div>

                    <div className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-3 py-1 rounded-md">
                      {card.activationCode}
                    </div>

                    {/* Holder Info if already active */}
                    {card.status === 'active' ? (
                      <div className="w-full bg-emerald-50 border border-emerald-200 rounded-lg p-2 text-center text-emerald-900 text-xs mt-1">
                        <span className="text-[10px] font-bold text-emerald-700 uppercase block">
                          Terdaftar:
                        </span>
                        <div className="font-bold text-sm text-emerald-950">{card.holderName}</div>
                        <div className="text-[10px] text-emerald-800">
                          {card.areaKerja} &bull; {card.holderEmail}
                        </div>
                      </div>
                    ) : (
                      /* Instructions on physical card */
                      <div className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-left text-[11px] text-slate-600 mt-1">
                        <div className="font-bold text-slate-800 mb-0.5 text-[10px] uppercase">
                          Petunjuk Aktivasi Pemegang Kartu:
                        </div>
                        <ol className="list-decimal pl-4 space-y-0.5 text-[10px] text-slate-600">
                          <li>Pindai QR di atas menggunakan kamera smartphone.</li>
                          <li>Masukkan Nama Lengkap, Email, &amp; Area Kerja.</li>
                          <li>
                            Simpan <strong>QR Pengambilan Digital</strong> yang muncul sebagai cadangan jika ID Card fisik ini hilang!
                          </li>
                        </ol>
                      </div>
                    )}
                  </div>

                  {/* Card Footer */}
                  <div className="bg-slate-900 text-white p-2.5 text-center text-[10px] border-t-2 border-slate-900 flex items-center justify-between px-3">
                    <span className="text-slate-400">Pos Konsumsi HBD 2026</span>
                    {onSelectToActivate && card.status === 'unactivated' && (
                      <button
                        onClick={() => {
                          onSelectToActivate(card);
                          onClose();
                        }}
                        className="print:hidden text-[10px] font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 px-2 py-0.5 rounded transition-colors"
                      >
                        Aktivasi Sekarang
                      </button>
                    )}
                    <span className="text-slate-300 font-mono font-bold">{card.cardCode}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Bottom note - Screen only */}
        <div className="bg-white border-t border-slate-200 p-3 px-6 flex items-center justify-between text-xs text-slate-500 shrink-0 print:hidden">
          <div className="flex items-center space-x-2">
            <HelpCircle className="w-4 h-4 text-slate-400" />
            <span>
              Format kartu didesain pas untuk ukuran gantungan lanyard / ID Card panitia standar (portrait).
            </span>
          </div>
          <button
            onClick={handlePrint}
            className="inline-flex items-center space-x-1 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak Halaman Ini</span>
          </button>
        </div>
      </div>
    </div>
  );
};
