import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Sparkles, 
  User, 
  Phone, 
  MapPin, 
  CreditCard, 
  ShieldCheck, 
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  QrCode,
  Smartphone,
  RotateCcw
} from 'lucide-react';
import { IDCardKonsumsi } from '../types';
import { WORK_AREAS } from '../data/idCardData';
import { playBeepSuccess } from '../utils/barcodeUtils';

interface IdCardActivationModalProps {
  isOpen: boolean;
  onClose: () => void;
  card: IDCardKonsumsi | null;
  allCards: IDCardKonsumsi[];
  onActivateCard: (
    cardId: string, 
    data: { name: string; email: string; areaKerja: string }
  ) => IDCardKonsumsi | undefined;
  onResetActivation?: (cardId: string) => void;
  onSuccessOpenQr: (card: IDCardKonsumsi) => void;
}

export const IdCardActivationModal: React.FC<IdCardActivationModalProps> = ({
  isOpen,
  onClose,
  card,
  allCards,
  onActivateCard,
  onResetActivation,
  onSuccessOpenQr,
}) => {
  // 3 Primary User Fields requested:
  // 1. Nama Lengkap (Free Text)
  // 2. Area Kerja (Drop Down sesuai data)
  // 3. No. WhatsApp / Kontak
  const [name, setName] = useState('');
  const [areaKerja, setAreaKerja] = useState(WORK_AREAS[0]);
  const [contact, setContact] = useState('');

  // Optional manual ID card override for committee
  const [selectedCardId, setSelectedCardId] = useState<string>('');
  const [showAdvancedCardPicker, setShowAdvancedCardPicker] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Ref to track if modal was previously open to prevent background sync from wiping user input
  const prevIsOpenRef = useRef(false);
  const lastCardIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Only initialize form fields when the modal opens freshly OR when target card ID changes
    const justOpened = isOpen && !prevIsOpenRef.current;
    const cardChanged = isOpen && card?.id && card.id !== lastCardIdRef.current;

    if (justOpened || cardChanged) {
      if (card) {
        setSelectedCardId(card.id);
        setName(card.holderName || '');
        setContact(card.holderEmail || '');
        setAreaKerja(card.areaKerja || WORK_AREAS[0]);
        lastCardIdRef.current = card.id;
      } else {
        // Auto-assign first available unactivated card or generate next sequence
        const firstUnactivated = allCards.find((c) => c.status === 'unactivated');
        if (firstUnactivated) {
          setSelectedCardId(firstUnactivated.id);
          lastCardIdRef.current = firstUnactivated.id;
        } else {
          // generate next ID
          const nextNum = allCards.length + 1;
          const newId = `IDC-${String(nextNum).padStart(3, '0')}`;
          setSelectedCardId(newId);
          lastCardIdRef.current = newId;
        }
        setName('');
        setContact('');
        setAreaKerja(WORK_AREAS[0]);
      }
      setErrorMsg('');
      setShowAdvancedCardPicker(false);
    }

    prevIsOpenRef.current = isOpen;
    if (!isOpen) {
      lastCardIdRef.current = null;
    }
  }, [isOpen, card?.id]);

  if (!isOpen) return null;

  const currentCard = allCards.find((c) => c.id === selectedCardId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Validate Nama
    if (!name.trim()) {
      setErrorMsg('Nama Lengkap wajib diisi (Free Text)');
      return;
    }

    // 2. Validate Area Kerja
    if (!areaKerja.trim()) {
      setErrorMsg('Silakan pilih Area Kerja / Divisi dari menu dropdown');
      return;
    }

    // 3. Validate Contact (WA / Phone / Email)
    if (!contact.trim()) {
      setErrorMsg('Silakan masukkan Nomor WhatsApp / Kontak aktif Anda');
      return;
    }

    const cardIdToUse = selectedCardId || (card ? card.id : `IDC-${String(allCards.length + 1).padStart(3, '0')}`);

    const updated = onActivateCard(cardIdToUse, {
      name: name.trim(),
      email: contact.trim(),
      areaKerja: areaKerja.trim(),
    });

    playBeepSuccess();

    if (updated) {
      onSuccessOpenQr(updated);
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
      id="modal-id-card-activation"
    >
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-200">
        {/* Header with Mobile Scanner theme */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-slate-900 p-5 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-white/15 flex items-center justify-center shadow-inner">
              <Smartphone className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-black text-base tracking-tight">Formulir Aktivasi Mandiri ID Card</h3>
                <span className="bg-amber-400 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-full uppercase">
                  3 Field Input
                </span>
              </div>
              <p className="text-xs text-blue-100 mt-0.5">
                Input 3 data di bawah untuk mengaktifkan kartu &amp; klaim QR Konsumsi
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

        {/* Info Banner */}
        <div className="bg-blue-50/70 border-b border-blue-100 px-5 py-3 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2 text-blue-900 font-medium">
            <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
            <span>ID Kartu Yang Diaktivasi:</span>
            <span className="font-mono font-bold bg-white px-2.5 py-0.5 rounded-md border border-blue-200 text-blue-800">
              {selectedCardId || 'Auto Assigned'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowAdvancedCardPicker(!showAdvancedCardPicker)}
            className="text-[11px] text-blue-700 hover:text-blue-900 font-semibold underline"
          >
            {showAdvancedCardPicker ? 'Sembunyikan Pilihan ID' : 'Ganti Nomor Kartu Fisik'}
          </button>
        </div>

        {/* Current Active Card Alert / Reset Option */}
        {currentCard?.status === 'active' && (
          <div className="bg-amber-50 border-b border-amber-200 px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-start space-x-2 text-amber-900">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Kartu {currentCard.id} sudah aktif:</span> {currentCard.holderName} ({currentCard.areaKerja})
                <p className="text-[11px] text-amber-800">
                  Anda dapat mengubah data langsung atau menghapus aktivasi agar kartu kembali kosong.
                </p>
              </div>
            </div>
            {onResetActivation && (
              <button
                type="button"
                onClick={() => {
                  const confirmed = window.confirm(
                    `Hapus data aktivasi untuk ${currentCard.id} (${currentCard.holderName})?\n\n` +
                    `Kartu akan kembali ke status "Belum Diaktivasi".`
                  );
                  if (confirmed) {
                    onResetActivation(currentCard.id);
                    setName('');
                    setContact('');
                    setAreaKerja(WORK_AREAS[0]);
                  }
                }}
                className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold shadow-2xs shrink-0 self-start sm:self-center transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset / Hapus Data Ini</span>
              </button>
            )}
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="font-medium">{errorMsg}</span>
            </div>
          )}

          {/* Optional Committee ID Card Selector */}
          {showAdvancedCardPicker && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5 animate-in fade-in">
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                Pilih Nomor Seri ID Card Fisik:
              </label>
              <select
                value={selectedCardId}
                onChange={(e) => {
                  setSelectedCardId(e.target.value);
                  const found = allCards.find((c) => c.id === e.target.value);
                  if (found && found.status === 'active') {
                    setName(found.holderName || '');
                    setContact(found.holderEmail || '');
                    setAreaKerja(found.areaKerja || WORK_AREAS[0]);
                  }
                }}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                {allCards.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.id} - {c.status === 'active' ? `[Aktif: ${c.holderName}]` : '[Siap Diaktivasi]'}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* FIELD 1: NAMA LENGKAP (FREE TEXT) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                1. Nama Lengkap (Free Text) <span className="text-rose-500">*</span>
              </label>
              <span className="text-[10px] text-slate-400 font-medium">Input Nama Anda</span>
            </div>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Ahmad Farhan / Gita Aprillia"
                className="w-full pl-10 pr-3.5 py-2.5 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 font-semibold placeholder:text-slate-400 bg-slate-50/50 focus:bg-white"
                required
                autoFocus
              />
            </div>
          </div>

          {/* FIELD 2: AREA KERJA (DROP DOWN SESUAI DATA) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                2. Area Kerja / Divisi (Drop Down) <span className="text-rose-500">*</span>
              </label>
              <span className="text-[10px] text-blue-600 font-semibold">Pilih Sesuai Pos Anda</span>
            </div>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
              <select
                value={areaKerja}
                onChange={(e) => setAreaKerja(e.target.value)}
                className="w-full pl-10 pr-8 py-2.5 border border-slate-200 rounded-xl text-xs text-slate-900 bg-white font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600 appearance-none cursor-pointer"
                required
              >
                {WORK_AREAS.map((area) => (
                  <option key={area} value={area}>
                    {area}
                  </option>
                ))}
              </select>
              <div className="absolute right-3.5 top-3 pointer-events-none text-slate-400 text-xs">
                ▼
              </div>
            </div>

            {/* Quick click tags for popular areas from data */}
            <div className="flex flex-wrap gap-1 mt-2">
              {['Konsumsi', 'Registrasi', 'Booth Games', 'Backstage', 'Perlengkapan', 'Medis', 'Security', 'Foto Booth', 'Motoran', 'WP'].map((areaTag) => (
                <button
                  type="button"
                  key={areaTag}
                  onClick={() => setAreaKerja(areaTag)}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border transition-all ${
                    areaKerja === areaTag
                      ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                      : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  {areaTag}
                </button>
              ))}
            </div>
          </div>

          {/* FIELD 3: NO WHATSAPP / KONTAK / EMAIL */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                3. Nomor WhatsApp / Kontak / Email <span className="text-rose-500">*</span>
              </label>
              <span className="text-[10px] text-slate-400 font-medium">Pengiriman Bukti &amp; QR</span>
            </div>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="0821xxxxxxxx atau nama@honda-md.id"
                className="w-full pl-10 pr-3.5 py-2.5 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 font-semibold placeholder:text-slate-400 bg-slate-50/50 focus:bg-white font-mono"
                required
              />
            </div>
          </div>

          {/* Output Explanation Banner */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 text-xs text-emerald-950 flex items-start space-x-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <strong className="font-bold text-emerald-900">
                Setelah Aktivasi Selesai:
              </strong>
              <p className="text-[11px] text-emerald-800 mt-0.5 leading-relaxed">
                Kartu ini langsung berstatus <strong>Aktif Terdaftar</strong> dan dapat dilihat di menu <em>ID Card &amp; Aktivasi QR &gt; Aktivasi &amp; Cetak ID Card</em>. QR Pengambilan Digital langsung siap digunakan untuk makan Pagi, Siang, dan Malam.
              </p>
            </div>
          </div>

          {/* Submit Actions */}
          <div className="pt-2 flex items-center justify-end space-x-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-lg shadow-blue-600/20 transition-all cursor-pointer"
            >
              <span>Aktivasi Kartu &amp; Dapatkan QR</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
