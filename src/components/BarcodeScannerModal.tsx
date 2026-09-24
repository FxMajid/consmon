import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { 
  Scan, 
  X, 
  Camera, 
  CheckCircle2, 
  AlertTriangle, 
  Keyboard, 
  RefreshCw, 
  Sparkles,
  Utensils,
  Ticket,
  Search,
  Volume2,
  Users
} from 'lucide-react';
import { 
  HariHGroupDistribution, 
  VoucherDistributionItem, 
  MealTimeSlot,
  IDCardKonsumsi
} from '../types';
import { playBeepSuccess, playBeepWarning, getBarcodeForSlot } from '../utils/barcodeUtils';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  hariHGroups: HariHGroupDistribution[];
  vouchers: VoucherDistributionItem[];
  idCards?: IDCardKonsumsi[];
  activeSlot: MealTimeSlot;
  onConfirmPickupHariH: (groupId: string, slot: MealTimeSlot, receiverName: string, note?: string) => void;
  onConfirmClaimVoucher: (voucherId: string, receiverName: string) => void;
  onOpenActivationModal?: (card?: IDCardKonsumsi) => void;
  onClaimIdCardMeal?: (cardId: string, meal: 'pagi' | 'siang' | 'malam') => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  hariHGroups,
  vouchers,
  idCards = [],
  activeSlot,
  onConfirmPickupHariH,
  onConfirmClaimVoucher,
  onOpenActivationModal,
  onClaimIdCardMeal,
}) => {
  const [manualCode, setManualCode] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scannerMode, setScannerMode] = useState<'camera' | 'manual'>('camera');
  
  // Selected slot for scan interpretation
  const [scanSlot, setScanSlot] = useState<MealTimeSlot>(activeSlot);

  // Scan detection result
  const [scanResult, setScanResult] = useState<{
    type: 'hari_h' | 'voucher' | 'id_card_activation' | 'id_card_pickup' | 'not_found';
    group?: HariHGroupDistribution;
    voucher?: VoucherDistributionItem;
    idCard?: IDCardKonsumsi;
    slot?: MealTimeSlot;
    menu?: string;
    qty?: number;
    status?: string;
    pickedAt?: string;
    receiver?: string;
    rawCode: string;
  } | null>(null);

  const [receiverName, setReceiverName] = useState('');
  const [receiverNote, setReceiverNote] = useState('');
  const [autoConfirm, setAutoConfirm] = useState(false);

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const readerElementId = 'barcode-reader-container';

  // Sync scanSlot with activeSlot when modal opens
  useEffect(() => {
    if (isOpen) {
      setScanSlot(activeSlot);
      setScanResult(null);
      setManualCode('');
      setReceiverName('');
      setReceiverNote('');
    }
  }, [isOpen, activeSlot]);

  // Handle Barcode String decoding
  const processDecodedString = (decodedText: string) => {
    const cleanText = decodedText.trim().toUpperCase();

    // 1. Check if format is HBD-H-{no}-{slot}
    // e.g. HBD-H-01-SIANG, HBD-H-01-H1SIANG, HBD-H-1-PAGI
    const hariHMatch = cleanText.match(/^HBD-H-(\d+)-(H1SIANG|H1MALAM|PAGI|SNACKPAGI|SIANG|SNACKSIANG|MINUM|MALAM)$/i);
    if (hariHMatch) {
      const groupNo = parseInt(hariHMatch[1], 10);
      const slotCode = hariHMatch[2].toUpperCase();
      let matchedSlot: MealTimeSlot = 'siang';
      if (slotCode === 'H1SIANG') matchedSlot = 'h1_siang';
      else if (slotCode === 'H1MALAM') matchedSlot = 'h1_malam';
      else if (slotCode === 'PAGI') matchedSlot = 'pagi';
      else if (slotCode === 'SNACKPAGI') matchedSlot = 'snack_pagi';
      else if (slotCode === 'SIANG') matchedSlot = 'siang';
      else if (slotCode === 'SNACKSIANG') matchedSlot = 'snack_siang';
      else if (slotCode === 'MINUM') matchedSlot = 'minuman';
      else if (slotCode === 'MALAM') matchedSlot = 'malam';

      const foundGroup = hariHGroups.find((g) => g.no === groupNo);
      if (foundGroup) {
        evaluateHariHMatch(foundGroup, matchedSlot, decodedText);
        return;
      }
    }

    // 2. Check if format is HBD-GRP-{no} or GRP-{no} or number
    const groupOnlyMatch = cleanText.match(/^(?:HBD-GRP-|GRP-|#)?(\d+)$/i);
    if (groupOnlyMatch) {
      const groupNo = parseInt(groupOnlyMatch[1], 10);
      const foundGroup = hariHGroups.find((g) => g.no === groupNo);
      if (foundGroup) {
        evaluateHariHMatch(foundGroup, scanSlot, decodedText);
        return;
      }
    }

    // 2.5 Check Static Activation QR (e.g. HBD-STATIC-ACTIVATION or URL containing aktivasi)
    if (cleanText.includes('STATIC-ACTIVATION') || cleanText.includes('AKTIVASI') || cleanText.includes('HBD-STATIC')) {
      playBeepSuccess();
      const firstUnactivated = idCards.find((c) => c.status === 'unactivated');
      const fallbackId = firstUnactivated ? firstUnactivated.id : `IDC-${String(idCards.length + 1).padStart(3, '0')}`;
      const targetCard = firstUnactivated || {
        id: fallbackId,
        cardCode: `HBD-ID-${fallbackId}`,
        activationCode: 'HBD-STATIC-ACTIVATION',
        pickupCode: `HBD-PICKUP-${fallbackId}`,
        status: 'unactivated' as const,
      };

      if (onOpenActivationModal) {
        onClose();
        onOpenActivationModal(targetCard);
        return;
      }

      setScanResult({
        type: 'id_card_activation',
        idCard: targetCard,
        rawCode: decodedText,
      });
      return;
    }

    // 3. Check ID Card Activation Code (e.g. HBD-ACT-IDC-007)
    if (cleanText.includes('HBD-ACT-') || cleanText.startsWith('ACT-')) {
      const cardIdPart = cleanText.replace('HBD-ACT-', '').replace('ACT-', '');
      const foundCard = idCards.find(
        (c) =>
          c.id.toUpperCase() === cardIdPart ||
          c.activationCode.toUpperCase() === cleanText ||
          c.cardCode.toUpperCase() === cardIdPart ||
          `IDC-${cardIdPart}` === c.id.toUpperCase()
      ) || {
        id: cardIdPart.startsWith('IDC-') ? cardIdPart : `IDC-${cardIdPart}`,
        cardCode: `HBD-ID-${cardIdPart}`,
        activationCode: cleanText,
        pickupCode: `HBD-PICKUP-${cardIdPart}`,
        status: 'unactivated' as const,
      };

      playBeepSuccess();
      setScanResult({
        type: 'id_card_activation',
        idCard: foundCard,
        rawCode: decodedText,
      });
      return;
    }

    // 4. Check ID Card Digital Pickup Code (e.g. HBD-PICKUP-IDC-001 or IDC-001)
    if (cleanText.includes('HBD-PICKUP-') || (cleanText.startsWith('IDC-') && !cleanText.includes('ACT'))) {
      const cardIdPart = cleanText.replace('HBD-PICKUP-', '');
      const foundCard = idCards.find(
        (c) =>
          c.id.toUpperCase() === cardIdPart ||
          c.pickupCode.toUpperCase() === cleanText ||
          c.id.toUpperCase() === cleanText
      );

      if (foundCard) {
        if (foundCard.status === 'unactivated') {
          playBeepWarning();
        } else {
          playBeepSuccess();
        }
        setScanResult({
          type: 'id_card_pickup',
          idCard: foundCard,
          rawCode: decodedText,
        });
        return;
      }
    }

    // 5. Check Voucher codes (e.g. VOUCH-H1-MD-S01 or VOUCH-H2-MD-01)
    const foundVoucher = vouchers.find(
      (v) =>
        v.voucherCode?.toUpperCase().includes(cleanText) ||
        `VOUCH-${v.day}-${v.groupNo}`.toUpperCase() === cleanText ||
        v.id.toUpperCase() === cleanText
    );

    if (foundVoucher) {
      if (foundVoucher.status === 'claimed') {
        playBeepWarning();
      } else {
        playBeepSuccess();
      }
      setScanResult({
        type: 'voucher',
        voucher: foundVoucher,
        qty: foundVoucher.qty,
        status: foundVoucher.status,
        pickedAt: foundVoucher.claimedAt,
        receiver: foundVoucher.receiverName,
        rawCode: decodedText,
      });
      setReceiverName(foundVoucher.picName);
      return;
    }

    // 4. Fallback search by Group Name / PIC
    const fuzzyGroup = hariHGroups.find(
      (g) =>
        g.groupName.toUpperCase().includes(cleanText) ||
        g.picName.toUpperCase().includes(cleanText) ||
        g.id.toUpperCase() === cleanText
    );
    if (fuzzyGroup) {
      evaluateHariHMatch(fuzzyGroup, scanSlot, decodedText);
      return;
    }

    // Not found
    playBeepWarning();
    setScanResult({
      type: 'not_found',
      rawCode: decodedText,
    });
  };

  const evaluateHariHMatch = (group: HariHGroupDistribution, slot: MealTimeSlot, rawCode: string) => {
    let qty = 0;
    let menu = '';
    let status = 'pending';
    let pickedAt: string | undefined;
    let receiver: string | undefined;

    if (slot === 'h1_siang') { qty = group.h1SiangQty || 0; menu = group.h1SiangMenu || 'Nasi Ladas'; status = group.h1SiangStatus || 'pending'; pickedAt = group.h1SiangPickedAt; receiver = group.h1SiangReceiver; }
    else if (slot === 'h1_malam') { qty = group.h1MalamQty || 0; menu = group.h1MalamMenu || 'Nasi Padang Puti Minang'; status = group.h1MalamStatus || 'pending'; pickedAt = group.h1MalamPickedAt; receiver = group.h1MalamReceiver; }
    else if (slot === 'pagi') { qty = group.pagiQty; menu = group.pagiMenu; status = group.pagiStatus; pickedAt = group.pagiPickedAt; receiver = group.pagiReceiver; }
    else if (slot === 'snack_pagi') { qty = group.snackPagiQty; menu = group.snackPagiMenu; status = group.snackPagiStatus; pickedAt = group.snackPagiPickedAt; receiver = group.snackPagiReceiver; }
    else if (slot === 'siang') { qty = group.siangQty; menu = group.siangMenu; status = group.siangStatus; pickedAt = group.siangPickedAt; receiver = group.siangReceiver; }
    else if (slot === 'snack_siang') { qty = group.snackSiangQty; menu = group.snackSiangMenu; status = group.snackSiangStatus; pickedAt = group.snackSiangPickedAt; receiver = group.snackSiangReceiver; }
    else if (slot === 'minuman') { qty = group.minumanQty; menu = group.minumanMenu; status = group.minumanStatus; pickedAt = group.minumanPickedAt; receiver = group.minumanReceiver; }
    else if (slot === 'malam') { qty = group.malamQty; menu = group.malamMenu; status = group.malamStatus; pickedAt = group.malamPickedAt; receiver = group.malamReceiver; }

    if (status === 'completed') {
      playBeepWarning();
    } else {
      playBeepSuccess();
    }

    setScanResult({
      type: 'hari_h',
      group,
      slot,
      menu,
      qty,
      status,
      pickedAt,
      receiver,
      rawCode,
    });
    setReceiverName(group.picName);

    // If autoConfirm is on and status is pending, confirm immediately
    if (autoConfirm && status !== 'completed') {
      onConfirmPickupHariH(group.id, slot, group.picName, 'Auto-scan barcode');
    }
  };

  // Start Camera
  const startCamera = async () => {
    try {
      setCameraError(null);
      setCameraActive(true);

      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode(readerElementId);
      }

      await html5QrCodeRef.current.start(
        { facingMode: 'environment' },
        {
          fps: 15,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          processDecodedString(decodedText);
        },
        (errorMessage) => {
          // ignore stream parse errors
        }
      );
    } catch (err: unknown) {
      console.error('Camera start error:', err);
      const msg = err instanceof Error ? err.message : String(err);
      setCameraError(`Kamera tidak dapat diakses (${msg}). Silakan gunakan input manual / USB barcode scanner.`);
      setCameraActive(false);
      setScannerMode('manual');
    }
  };

  // Stop Camera
  const stopCamera = async () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      } catch (e) {
        console.error('Error stopping camera:', e);
      }
    }
    setCameraActive(false);
  };

  useEffect(() => {
    if (isOpen && scannerMode === 'camera') {
      // Delay slightly to ensure element is in DOM
      const timer = setTimeout(() => {
        startCamera();
      }, 300);
      return () => {
        clearTimeout(timer);
        stopCamera();
      };
    } else {
      stopCamera();
    }
  }, [isOpen, scannerMode]);

  // Submit manual code
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      processDecodedString(manualCode.trim());
    }
  };

  const handleConfirmAction = () => {
    if (!scanResult) return;
    if (scanResult.type === 'hari_h' && scanResult.group && scanResult.slot) {
      onConfirmPickupHariH(
        scanResult.group.id,
        scanResult.slot,
        receiverName || scanResult.group.picName,
        receiverNote
      );
      // reset result
      setScanResult(null);
      setManualCode('');
    } else if (scanResult.type === 'voucher' && scanResult.voucher) {
      onConfirmClaimVoucher(
        scanResult.voucher.id,
        receiverName || scanResult.voucher.picName
      );
      setScanResult(null);
      setManualCode('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full p-4 sm:p-6 shadow-2xl border border-slate-200 my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-red-600 text-white flex items-center justify-center shadow-xs">
              <Scan className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-slate-900 flex items-center space-x-2">
                <span>Scan Barcode / QR Konsumsi</span>
                <span className="px-2 py-0.2 rounded text-[10px] font-bold bg-red-100 text-red-700">
                  Opsi 2
                </span>
              </h3>
              <p className="text-[11px] text-slate-500">
                Pindai kupon panitia atau gunakan USB scanner
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Slot Target Selector */}
        <div className="mt-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-slate-700">Sesi Waktu Terpilih:</span>
            <select
              value={scanSlot}
              onChange={(e) => setScanSlot(e.target.value as MealTimeSlot)}
              className="px-2 py-1 rounded-lg border border-slate-300 font-bold text-red-700 bg-white"
            >
              <option value="h1_siang">11.30 H-1 Siang</option>
              <option value="h1_malam">17.30 H-1 Malam</option>
              <option value="pagi">06.30 Pagi (Sarapan)</option>
              <option value="snack_pagi">09.30 Snack Pagi</option>
              <option value="siang">11.30 Makan Siang</option>
              <option value="snack_siang">15.00 Snack Sore</option>
              <option value="minuman">Minuman &amp; Isotonik</option>
              <option value="malam">17.30 Makan Malam</option>
            </select>
          </div>

          <div className="flex items-center space-x-1 text-slate-600">
            <button
              onClick={() => setScannerMode('camera')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors flex items-center space-x-1 ${
                scannerMode === 'camera' ? 'bg-red-600 text-white' : 'bg-white border border-slate-200'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Kamera</span>
            </button>
            <button
              onClick={() => setScannerMode('manual')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors flex items-center space-x-1 ${
                scannerMode === 'manual' ? 'bg-slate-800 text-white' : 'bg-white border border-slate-200'
              }`}
            >
              <Keyboard className="w-3.5 h-3.5" />
              <span>Input / USB Gun</span>
            </button>
          </div>
        </div>

        {/* Scanner Area */}
        <div className="mt-4">
          {scannerMode === 'camera' ? (
            <div className="relative rounded-xl overflow-hidden bg-black aspect-video sm:aspect-4/3 flex flex-col items-center justify-center border border-slate-800">
              <div id={readerElementId} className="w-full h-full"></div>

              {/* Scanning visual overlay overlaying the camera */}
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6">
                <div className="w-56 h-56 border-2 border-red-500/80 rounded-2xl relative shadow-lg shadow-red-500/20">
                  <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-white"></div>
                  <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-white"></div>
                  <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-white"></div>
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-white"></div>
                  {/* Laser line animation */}
                  <div className="w-full h-0.5 bg-red-500 animate-pulse top-1/2 absolute shadow-xs shadow-red-500"></div>
                </div>
                <div className="mt-3 bg-black/60 backdrop-blur-xs text-white text-[11px] font-medium px-3 py-1 rounded-full border border-white/20">
                  Arahkan barcode / QR panitia ke dalam kotak
                </div>
              </div>

              {cameraError && (
                <div className="absolute inset-0 bg-slate-900/90 text-white p-4 flex flex-col items-center justify-center text-center">
                  <AlertTriangle className="w-8 h-8 text-amber-400 mb-2" />
                  <p className="text-xs font-semibold text-slate-200 max-w-sm">{cameraError}</p>
                  <button
                    onClick={() => setScannerMode('manual')}
                    className="mt-3 px-3 py-1.5 bg-red-600 text-white text-xs font-bold rounded-lg"
                  >
                    Gunakan Input Kode Barcode
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <form onSubmit={handleManualSubmit} className="space-y-3">
                <label className="block text-xs font-bold text-slate-700">
                  Ketik Kode Barcode atau Gunakan Barcode Gun Scanner:
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    placeholder="Contoh: HBD-H-01-SIANG atau HBD-GRP-01 atau VOUCH-H1-SNR-S01"
                    className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-red-500 bg-white font-mono"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-lg flex items-center space-x-1 shrink-0"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>Verifikasi</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-500">
                  Alat barcode gun scanner otomatis memindai dan menekan Enter.
                </p>
              </form>
            </div>
          )}
        </div>

        {/* Quick Simulation Buttons (Convenience for testing) */}
        <div className="mt-3 pt-3 border-t border-slate-100">
          <div className="text-[11px] font-semibold text-slate-500 mb-1.5 flex items-center space-x-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Shortcut Simulasi Scan Barcode Panitia:</span>
          </div>
          <div className="flex flex-wrap gap-1.5 text-[10px]">
            <button
              onClick={() => processDecodedString('HBD-H-01-SIANG')}
              className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium"
            >
              Panitia MD (Siang Bebek Belur)
            </button>
            <button
              onClick={() => processDecodedString('HBD-H-02-SIANG')}
              className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium"
            >
              Community (Siang Bu Ani)
            </button>
            <button
              onClick={() => processDecodedString('HBD-H-10-SIANG')}
              className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium"
            >
              SNR (Siang Bu Ani)
            </button>
            <button
              onClick={() => processDecodedString('HBD-H-11-SIANG')}
              className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium"
            >
              OB (Siang Bebek Belur)
            </button>
            <button
              onClick={() => processDecodedString('VOUCH-H1-MD-S01')}
              className="px-2 py-1 rounded bg-amber-50 hover:bg-amber-100 text-amber-800 font-medium border border-amber-200"
            >
              Voucher H-1 MD Ladas
            </button>
            <button
              onClick={() => processDecodedString('HBD-STATIC-ACTIVATION')}
              className="px-2 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-800 font-bold border border-rose-300 flex items-center space-x-1"
            >
              <span>⚡ [Scan QR Statis] Aktivasi 3-Field</span>
            </button>
            <button
              onClick={() => processDecodedString('HBD-ACT-IDC-007')}
              className="px-2 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-800 font-medium border border-blue-200"
            >
              [Aktivasi ID Card] IDC-007
            </button>
            <button
              onClick={() => processDecodedString('HBD-PICKUP-IDC-001')}
              className="px-2 py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-medium border border-emerald-200"
            >
              [Pickup QR Digital] IDC-001
            </button>
          </div>
        </div>

        {/* Scan Result Feedback Card */}
        {scanResult && (
          <div className="mt-4 pt-3 border-t border-slate-100 animate-in fade-in slide-in-from-bottom-2 duration-150">
            {scanResult.type === 'not_found' ? (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 text-rose-800 flex items-start space-x-3 text-xs">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold">Barcode Tidak Dikenali</h4>
                  <p className="text-[11px] mt-0.5 text-rose-700">
                    Kode &quot;{scanResult.rawCode}&quot; tidak cocok dengan daftar kartu akses panitia, voucher, atau ID card terdaftar.
                  </p>
                </div>
              </div>
            ) : scanResult.type === 'id_card_activation' && scanResult.idCard ? (
              /* ID Card Activation Detected */
              <div className="bg-blue-50 border border-blue-300 rounded-xl p-4 text-xs text-blue-950">
                <div className="flex items-center justify-between pb-2 border-b border-blue-200">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                    <span className="font-bold">
                      QR AKTIVASI ID CARD KONSUMSI TERDETEKSI
                    </span>
                  </div>
                  <span className="font-mono text-[10px] bg-white px-1.5 py-0.5 rounded font-bold text-blue-900">
                    {scanResult.idCard.id}
                  </span>
                </div>

                <div className="mt-2.5 space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-blue-700">Status Kartu:</span>
                    <strong className={scanResult.idCard.status === 'active' ? 'text-emerald-700' : 'text-amber-700'}>
                      {scanResult.idCard.status === 'active' ? 'Sudah Terdaftar (Aktif)' : 'Belum Diaktivasi (Siap Pakai)'}
                    </strong>
                  </div>
                  {scanResult.idCard.holderName && (
                    <div className="flex justify-between">
                      <span className="text-blue-700">Pemegang Saat Ini:</span>
                      <strong className="text-slate-900">{scanResult.idCard.holderName}</strong>
                    </div>
                  )}
                  {scanResult.idCard.areaKerja && (
                    <div className="flex justify-between">
                      <span className="text-blue-700">Area Kerja:</span>
                      <span className="font-semibold text-slate-800">{scanResult.idCard.areaKerja}</span>
                    </div>
                  )}
                </div>

                <div className="mt-3 pt-2.5 border-t border-blue-200 flex justify-end space-x-2">
                  <button
                    onClick={() => setScanResult(null)}
                    className="px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 font-medium"
                  >
                    Tutup
                  </button>
                  <button
                    onClick={() => {
                      if (onOpenActivationModal) {
                        onOpenActivationModal(scanResult.idCard);
                        onClose();
                      }
                    }}
                    className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center space-x-1 shadow-sm"
                  >
                    <span>
                      {scanResult.idCard.status === 'active' ? 'Lihat / Edit Aktivasi' : 'Isi Form Aktivasi Sekarang'}
                    </span>
                  </button>
                </div>
              </div>
            ) : scanResult.type === 'id_card_pickup' && scanResult.idCard ? (
              /* ID Card Digital Backup Pickup Detected */
              <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-4 text-xs text-emerald-950">
                <div className="flex items-center justify-between pb-2 border-b border-emerald-200">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-bold">
                      QR PENGAMBILAN KONSUMSI DIGITAL DITERIMA
                    </span>
                  </div>
                  <span className="font-mono text-[10px] bg-white px-1.5 py-0.5 rounded font-bold text-emerald-900">
                    {scanResult.idCard.id}
                  </span>
                </div>

                <div className="mt-2.5 space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-emerald-800">Nama Pemegang:</span>
                    <strong className="text-slate-900 text-sm">
                      {scanResult.idCard.holderName || 'Panitia'}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-emerald-800">Email:</span>
                    <span className="text-slate-700 font-mono text-[11px]">
                      {scanResult.idCard.holderEmail || '-'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-emerald-800">Area Kerja:</span>
                    <span className="font-bold text-slate-800">{scanResult.idCard.areaKerja || '-'}</span>
                  </div>

                  {/* Meal Status Checklist */}
                  <div className="pt-2 mt-2 border-t border-emerald-200">
                    <div className="text-[11px] font-bold text-emerald-900 mb-1">
                      Status Jatah Makan Hari H:
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 text-center">
                      <div className={`p-1.5 rounded border ${scanResult.idCard.claimedMeals?.pagi?.claimed ? 'bg-emerald-100 border-emerald-300' : 'bg-white border-slate-200'}`}>
                        <div className="text-[10px] font-semibold text-slate-600">Pagi (06.30)</div>
                        <div className="text-[11px] font-bold">
                          {scanResult.idCard.claimedMeals?.pagi?.claimed ? 'Sudah' : 'Belum'}
                        </div>
                        {onClaimIdCardMeal && !scanResult.idCard.claimedMeals?.pagi?.claimed && (
                          <button
                            onClick={() => {
                              onClaimIdCardMeal(scanResult.idCard!.id, 'pagi');
                              setScanResult(null);
                            }}
                            className="mt-1 w-full py-0.5 rounded bg-emerald-600 text-white text-[10px] font-bold"
                          >
                            Serahkan
                          </button>
                        )}
                      </div>

                      <div className={`p-1.5 rounded border ${scanResult.idCard.claimedMeals?.siang?.claimed ? 'bg-emerald-100 border-emerald-300' : 'bg-white border-slate-200'}`}>
                        <div className="text-[10px] font-semibold text-slate-600">Siang (11.30)</div>
                        <div className="text-[11px] font-bold">
                          {scanResult.idCard.claimedMeals?.siang?.claimed ? 'Sudah' : 'Belum'}
                        </div>
                        {onClaimIdCardMeal && !scanResult.idCard.claimedMeals?.siang?.claimed && (
                          <button
                            onClick={() => {
                              onClaimIdCardMeal(scanResult.idCard!.id, 'siang');
                              setScanResult(null);
                            }}
                            className="mt-1 w-full py-0.5 rounded bg-emerald-600 text-white text-[10px] font-bold"
                          >
                            Serahkan
                          </button>
                        )}
                      </div>

                      <div className={`p-1.5 rounded border ${scanResult.idCard.claimedMeals?.malam?.claimed ? 'bg-emerald-100 border-emerald-300' : 'bg-white border-slate-200'}`}>
                        <div className="text-[10px] font-semibold text-slate-600">Malam (17.30)</div>
                        <div className="text-[11px] font-bold">
                          {scanResult.idCard.claimedMeals?.malam?.claimed ? 'Sudah' : 'Belum'}
                        </div>
                        {onClaimIdCardMeal && !scanResult.idCard.claimedMeals?.malam?.claimed && (
                          <button
                            onClick={() => {
                              onClaimIdCardMeal(scanResult.idCard!.id, 'malam');
                              setScanResult(null);
                            }}
                            className="mt-1 w-full py-0.5 rounded bg-emerald-600 text-white text-[10px] font-bold"
                          >
                            Serahkan
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2 flex justify-end">
                  <button
                    onClick={() => setScanResult(null)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-700 text-white font-bold text-xs hover:bg-emerald-800"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            ) : (
              <div className={`rounded-xl p-4 border text-xs ${
                scanResult.status === 'completed' || scanResult.status === 'claimed'
                  ? 'bg-amber-50/80 border-amber-300 text-amber-950'
                  : 'bg-emerald-50/90 border-emerald-300 text-emerald-950'
              }`}>
                {/* Status Header */}
                <div className="flex items-center justify-between pb-2 border-b border-black/10">
                  <div className="flex items-center space-x-2">
                    {scanResult.status === 'completed' || scanResult.status === 'claimed' ? (
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    )}
                    <span className="font-bold">
                      {scanResult.status === 'completed' || scanResult.status === 'claimed'
                        ? 'PERINGATAN: KONSUMSI INI SUDAH DIAMBIL SEBELUMNYA!'
                        : 'BARCODE TERVERIFIKASI - SIAP DIAMBIL'}
                    </span>
                  </div>
                  <span className="font-mono text-[10px] bg-white/70 px-1.5 py-0.5 rounded">
                    {scanResult.rawCode}
                  </span>
                </div>

                {/* Details */}
                <div className="mt-2.5 space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Penerima:</span>
                    <strong className="text-slate-900">
                      {scanResult.group?.groupName || scanResult.voucher?.groupName}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">PIC Penanggung Jawab:</span>
                    <span className="font-semibold text-slate-800">
                      {scanResult.group?.picName || scanResult.voucher?.picName} ({scanResult.group?.picPhone || scanResult.voucher?.picPhone})
                    </span>
                  </div>

                  {/* Anggota Makan / Penerima Porsi */}
                  {(scanResult.group?.members || scanResult.voucher?.members || 
                    (scanResult.group?.notes && scanResult.group.notes.toLowerCase().includes('anggota')) ||
                    (scanResult.voucher?.notes && scanResult.voucher.notes.toLowerCase().includes('anggota'))) && (
                    <div className="bg-white/80 p-2 rounded-lg border border-slate-200 flex items-start space-x-1.5 text-[11px] text-blue-900">
                      <Users className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-blue-800">Anggota Makan Diambil PIC: </span>
                        <span>
                          {scanResult.group?.members || scanResult.voucher?.members || 
                           (scanResult.group?.notes ? scanResult.group.notes.replace(/^Anggota:\s*/i, '') : scanResult.voucher?.notes?.replace(/^Anggota:\s*/i, ''))}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span className="text-slate-600">Jatah Menu:</span>
                    <span className="font-bold text-slate-900">
                      {scanResult.menu || scanResult.voucher?.menuVendor}
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline pt-1 border-t border-black/5">
                    <span className="text-slate-600 font-medium">Jumlah Porsi:</span>
                    <span className="text-base font-black text-red-600">
                      {scanResult.qty} Porsi / Pax
                    </span>
                  </div>

                  {/* Warning if already picked up */}
                  {(scanResult.pickedAt || scanResult.receiver) && (
                    <div className="mt-2 bg-amber-100 p-2 rounded-lg text-amber-900 text-[11px]">
                      Telah diambil pada: <strong>{scanResult.pickedAt}</strong> oleh <strong>{scanResult.receiver || 'PIC'}</strong>.
                    </div>
                  )}
                </div>

                {/* Confirm Form (if not completed) */}
                {scanResult.status !== 'completed' && scanResult.status !== 'claimed' && (
                  <div className="mt-3 pt-3 border-t border-black/10 space-y-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                        Nama Yang Mengambil (Bila Diwakilkan):
                      </label>
                      <input
                        type="text"
                        value={receiverName}
                        onChange={(e) => setReceiverName(e.target.value)}
                        placeholder="Nama pengambil di meja pos"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                      />
                    </div>

                    <div className="flex justify-end space-x-2 pt-1">
                      <button
                        onClick={() => setScanResult(null)}
                        className="px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 font-medium"
                      >
                        Batal
                      </button>
                      <button
                        onClick={handleConfirmAction}
                        className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center space-x-1 shadow-sm"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Selesaikan Pengambilan</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
