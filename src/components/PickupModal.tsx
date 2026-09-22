import React, { useState } from 'react';
import { CheckCircle2, X, Clock, UserCheck, Utensils } from 'lucide-react';

interface PickupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (receiverName: string, note: string) => void;
  groupName: string;
  picName: string;
  menu: string;
  qty: number;
  timeSlotLabel: string;
}

export const PickupModal: React.FC<PickupModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  groupName,
  picName,
  menu,
  qty,
  timeSlotLabel
}) => {
  const [receiverName, setReceiverName] = useState('');
  const [note, setNote] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(receiverName || picName, note);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-red-100 text-red-700 flex items-center justify-center">
              <Utensils className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-slate-900">
              Konfirmasi Pengambilan Konsumsi
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          {/* Summary Box */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-500">Penerima / Kelompok:</span>
              <span className="font-bold text-slate-800">{groupName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">PIC Resmi:</span>
              <span className="font-semibold text-slate-700">{picName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Sesi Waktu:</span>
              <span className="font-semibold text-red-600">{timeSlotLabel}</span>
            </div>
            <div className="flex justify-between items-baseline pt-1 border-t border-slate-200">
              <span className="text-slate-600 font-medium">Jatah Menu:</span>
              <div className="text-right">
                <span className="font-bold text-slate-900">{menu}</span>
                <span className="ml-2 font-black text-red-600">({qty} Porsi)</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Nama Pengambil (PIC / Yang Mewakili):
            </label>
            <input
              type="text"
              value={receiverName}
              onChange={(e) => setReceiverName(e.target.value)}
              placeholder={`Contoh: ${picName}`}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-red-500 bg-white"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Bila dikosongkan, otomatis menggunakan nama PIC resmi ({picName}).
            </p>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Catatan / Pos Pengantaran (Opsional):
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Contoh: Diantar ke pos backstage, diambil lengkap"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-red-500 bg-white"
            />
          </div>

          <div className="pt-2 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold flex items-center space-x-1.5 shadow-sm transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Konfirmasi Ambil</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
