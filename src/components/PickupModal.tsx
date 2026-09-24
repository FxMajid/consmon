import React, { useState, useRef } from 'react';
import { 
  CheckCircle2, 
  X, 
  Utensils, 
  Camera, 
  Image as ImageIcon, 
  Trash2, 
  RefreshCw, 
  Eye, 
  Upload
} from 'lucide-react';

interface PickupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (receiverName: string, proofPhoto?: string) => void;
  groupName: string;
  picName: string;
  menu: string;
  qty: number;
  timeSlotLabel: string;
  members?: string;
}

export const PickupModal: React.FC<PickupModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  groupName,
  picName,
  menu,
  qty,
  timeSlotLabel,
  members
}) => {
  const [receiverName, setReceiverName] = useState('');
  const [proofPhoto, setProofPhoto] = useState<string | null>(null);
  const [isPreviewZoomOpen, setIsPreviewZoomOpen] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  // Compress image file to compact base64 JPEG
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCompressing(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_DIMENSION = 800;
        let { width, height } = img;

        if (width > height) {
          if (width > MAX_DIMENSION) {
            height = Math.round((height * MAX_DIMENSION) / width);
            width = MAX_DIMENSION;
          }
        } else {
          if (height > MAX_DIMENSION) {
            width = Math.round((width * MAX_DIMENSION) / height);
            height = MAX_DIMENSION;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.75);
          setProofPhoto(compressedBase64);
        }
        setIsCompressing(false);
      };
      img.onerror = () => {
        setIsCompressing(false);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setProofPhoto(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(receiverName.trim() || picName, proofPhoto || undefined);
    // Reset state for next usage
    setReceiverName('');
    setProofPhoto(null);
    onClose();
  };

  const handleCancel = () => {
    setReceiverName('');
    setProofPhoto(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 my-auto animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-100 text-red-700 flex items-center justify-center shrink-0">
              <Utensils className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                Konfirmasi Pengambilan Konsumsi
              </h3>
              <p className="text-[11px] text-slate-500">
                Verifikasi penyerahan makanan ke PIC / Divisi
              </p>
            </div>
          </div>
          <button
            onClick={handleCancel}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          {/* Summary Box */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Penerima / Kelompok:</span>
              <span className="font-bold text-slate-800 text-right">{groupName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">PIC Resmi:</span>
              <span className="font-semibold text-slate-700">{picName}</span>
            </div>
            {members && (
              <div className="pt-1.5 border-t border-slate-200/70">
                <span className="text-slate-500 block text-[11px]">Anggota Makan Diambil PIC:</span>
                <span className="font-medium text-blue-900 bg-blue-50 px-2.5 py-1 rounded border border-blue-200 block mt-0.5 leading-relaxed">
                  {members}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-500">Sesi Waktu:</span>
              <span className="font-bold text-red-600">{timeSlotLabel}</span>
            </div>
            <div className="flex justify-between items-baseline pt-1.5 border-t border-slate-200">
              <span className="text-slate-600 font-medium">Jatah Menu:</span>
              <div className="text-right">
                <span className="font-bold text-slate-900">{menu}</span>
                <span className="ml-2 font-black text-red-600 text-sm">({qty} Porsi)</span>
              </div>
            </div>
          </div>

          {/* Receiver Name */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Nama Pengambil (PIC / Yang Mewakili):
            </label>
            <input
              type="text"
              value={receiverName}
              onChange={(e) => setReceiverName(e.target.value)}
              placeholder={`Contoh: ${picName}`}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-red-500 bg-white text-xs"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Bila dikosongkan, otomatis menggunakan nama PIC resmi ({picName}).
            </p>
          </div>

          {/* Bukti Foto Pengambilan (Pengganti Catatan) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-semibold text-slate-700 flex items-center space-x-1.5">
                <Camera className="w-3.5 h-3.5 text-red-600" />
                <span>Bukti Foto Pengambilan (Opsional):</span>
              </label>
              <span className="text-[11px] text-slate-400 font-normal">Kamera HP / Upload File</span>
            </div>

            {/* Hidden Input for Camera & File Picker */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              className="hidden"
            />

            {!proofPhoto ? (
              /* Photo Upload Trigger Card */
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-red-400 hover:bg-red-50/30 rounded-xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-1.5 group bg-slate-50/50"
              >
                <div className="w-10 h-10 rounded-full bg-slate-100 group-hover:bg-red-100 flex items-center justify-center text-slate-600 group-hover:text-red-600 transition-colors">
                  {isCompressing ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <Camera className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <div className="font-bold text-slate-700 group-hover:text-red-700 text-xs">
                    {isCompressing ? 'Memproses Foto...' : 'Ambil Foto / Pilih Gambar Bukti'}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Buka kamera ponsel untuk foto fisik penerima atau kotak konsumsi
                  </p>
                </div>
              </div>
            ) : (
              /* Photo Preview Card */
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between gap-3">
                <div className="flex items-center space-x-3 overflow-hidden">
                  <div 
                    onClick={() => setIsPreviewZoomOpen(true)}
                    className="w-14 h-14 rounded-lg overflow-hidden border border-slate-200 shrink-0 cursor-pointer relative group bg-black"
                  >
                    <img
                      src={proofPhoto}
                      alt="Bukti Pengambilan"
                      className="w-full h-full object-cover group-hover:opacity-80 transition-opacity"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Eye className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <div className="truncate">
                    <div className="font-bold text-slate-800 text-xs flex items-center space-x-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Foto Berhasil Dilampirkan</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Klik thumbnail untuk melihat perbesar
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    title="Ganti Foto"
                    className="p-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    title="Hapus Foto"
                    className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isCompressing}
              className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold flex items-center space-x-1.5 shadow-sm transition-colors disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Konfirmasi Ambil</span>
            </button>
          </div>
        </form>
      </div>

      {/* Enlarged Photo Modal / Lightbox */}
      {isPreviewZoomOpen && proofPhoto && (
        <div 
          className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setIsPreviewZoomOpen(false)}
        >
          <div className="max-w-md w-full bg-slate-900 rounded-2xl overflow-hidden border border-slate-700 shadow-2xl relative">
            <div className="p-3 bg-slate-800 flex items-center justify-between border-b border-slate-700 text-white">
              <span className="text-xs font-bold flex items-center space-x-1.5">
                <ImageIcon className="w-4 h-4 text-red-400" />
                <span>Pratinjau Bukti Foto Pengambilan</span>
              </span>
              <button
                type="button"
                onClick={() => setIsPreviewZoomOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-2 flex items-center justify-center max-h-[70vh] bg-black">
              <img
                src={proofPhoto}
                alt="Zoom Bukti Foto"
                className="max-h-[65vh] w-auto object-contain rounded-lg"
              />
            </div>
            <div className="p-3 bg-slate-800 text-center text-xs text-slate-400">
              {groupName} &bull; {timeSlotLabel}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
