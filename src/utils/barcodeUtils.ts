import { MealTimeSlot, HariHGroupDistribution, VoucherDistributionItem } from '../types';
import QRCode from 'qrcode';

// Audio feedback using Web Audio API (cross-browser, no external asset files needed)
export const playBeepSuccess = () => {
  try {
    const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
    osc.frequency.exponentialRampToValueAtTime(1320, audioCtx.currentTime + 0.1); // E6

    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.2);
  } catch (e) {
    console.warn('Audio feedback not available', e);
  }
};

export const playBeepWarning = () => {
  try {
    const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, audioCtx.currentTime); // A3
    osc.frequency.setValueAtTime(180, audioCtx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.4, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.35);
  } catch (e) {
    console.warn('Audio feedback not available', e);
  }
};

// Generate barcode code format
export const getBarcodeForSlot = (groupNo: number, slot: MealTimeSlot): string => {
  const slotCode = 
    slot === 'pagi' ? 'PAGI' :
    slot === 'snack_pagi' ? 'SNACKPAGI' :
    slot === 'siang' ? 'SIANG' :
    slot === 'snack_siang' ? 'SNACKSIANG' :
    slot === 'minuman' ? 'MINUM' : 'MALAM';

  return `HBD-H-${String(groupNo).padStart(2, '0')}-${slotCode}`;
};

export const getBarcodeForGroupGeneral = (groupNo: number): string => {
  return `HBD-GRP-${String(groupNo).padStart(2, '0')}`;
};

export const getBarcodeForVoucher = (
  v: VoucherDistributionItem | string,
  voucherCode?: string
): string => {
  if (typeof v === 'string') {
    return voucherCode ? voucherCode.split(' ')[0] : v;
  }
  if (v.voucherCode) {
    return v.voucherCode.split(' ')[0]; // first code
  }
  return `VOUCH-${v.day}-${v.groupNo}`;
};

export const getBarcodeForIdCardActivation = (cardId: string): string => {
  return `HBD-ACT-${cardId.toUpperCase()}`;
};

export const getBarcodeForIdCardPickup = (cardId: string): string => {
  return `HBD-PICKUP-${cardId.toUpperCase()}`;
};

// Generate Data URL for QR Code
export const generateQrDataUrl = async (text: string): Promise<string> => {
  try {
    return await QRCode.toDataURL(text, {
      width: 256,
      margin: 1.5,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    });
  } catch (err) {
    console.error('Error generating QR code', err);
    return '';
  }
};
